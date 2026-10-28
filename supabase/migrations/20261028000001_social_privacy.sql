BEGIN;
CREATE INDEX IF NOT EXISTS idx_posts_feed ON public.posts (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pet_feed ON public.posts (pet_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_media_url ON public.post_media (url);
CREATE INDEX IF NOT EXISTS idx_comments_order ON public.comments (post_id, created_at, id);

-- The server performs mutations through pg after verifying the authenticated owner.
-- The public Data API stays read-only and uses the same visibility rules.
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN
      ('profiles', 'pets', 'posts', 'post_media', 'comments', 'reactions', 'follows', 'notifications')
  LOOP EXECUTE format('DROP POLICY %I ON %I.%I', item.policyname, item.schemaname, item.tablename); END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.can_view_post(target_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = target_id AND (
      p.visibility = 'public' OR p.author_id = auth.uid()
      OR (p.visibility = 'followers' AND EXISTS (
        SELECT 1 FROM public.follows f JOIN public.pets pet ON pet.id = f.follower_pet_id
        WHERE f.following_pet_id = p.pet_id AND pet.owner_id = auth.uid()
      ))
    )
  );
$$;
REVOKE ALL ON FUNCTION public.can_view_post(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_post(uuid) TO anon, authenticated;

CREATE POLICY social_profiles_read ON public.profiles FOR SELECT USING (true);
CREATE POLICY social_pets_read ON public.pets FOR SELECT USING (true);
CREATE POLICY social_posts_read ON public.posts FOR SELECT USING (public.can_view_post(id));
CREATE POLICY social_media_read ON public.post_media FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY social_comments_read ON public.comments FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY social_reactions_read ON public.reactions FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY social_follows_read ON public.follows FOR SELECT USING (true);
CREATE POLICY social_notifications_read ON public.notifications FOR SELECT USING (recipient_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.profiles, public.pets, public.posts, public.post_media,
  public.comments, public.reactions, public.follows, public.notifications FROM anon, authenticated;
GRANT SELECT ON public.profiles, public.pets, public.posts, public.post_media,
  public.comments, public.reactions, public.follows, public.notifications TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('petbook-private', 'petbook-private', false, 52428800,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.can_view_petbook_media(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT
    split_part(object_name, '/', 1) = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.post_media m
      WHERE m.url = '/api/media/' || object_name AND public.can_view_post(m.post_id))
    OR EXISTS (SELECT 1 FROM public.pets p WHERE p.avatar_url = '/api/media/' || object_name OR p.cover_url = '/api/media/' || object_name)
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_url = '/api/media/' || object_name);
$$;
REVOKE ALL ON FUNCTION public.can_view_petbook_media(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_petbook_media(text) TO anon, authenticated;
DROP POLICY IF EXISTS social_upload ON storage.objects;
CREATE POLICY social_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'petbook-private' AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS social_download ON storage.objects;
CREATE POLICY social_download ON storage.objects FOR SELECT TO anon, authenticated USING (
  bucket_id = 'petbook-private' AND public.can_view_petbook_media(name)
);
COMMIT;
