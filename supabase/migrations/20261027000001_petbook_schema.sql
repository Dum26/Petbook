-- =====================================================
-- PETBOOK SOCIAL NETWORK DATABASE SCHEMA
-- =====================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  locale TEXT DEFAULT 'vi',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PETS TABLE (Every user can own multiple pets)
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  species TEXT NOT NULL DEFAULT 'dog',
  breed TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT 'male',
  birthday DATE,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT,
  personality JSONB DEFAULT '[]'::jsonb,
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_owner ON public.pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_slug ON public.pets(slug);

-- 4. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  reaction_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_pet ON public.posts(pet_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 5. POST MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
  mime_type TEXT,
  file_size INT,
  sort_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_media_post ON public.post_media(post_id);

-- 6. REACTIONS TABLE (bone, paw, heart, haha, wow)
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bone', 'paw', 'heart', 'haha', 'wow')) DEFAULT 'paw',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, pet_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.reactions(post_id);

-- 7. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);

-- 8. FOLLOWS TABLE (Pets follow pets)
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  following_pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_pet_id, following_pet_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_pet_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_pet_id);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('reaction', 'comment', 'follow', 'system')),
  reference_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);

-- 10. COUNTER TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reaction_count ON public.reactions;
CREATE TRIGGER trg_reaction_count
AFTER INSERT OR DELETE ON public.reactions
FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_count ON public.comments;
CREATE TRIGGER trg_comment_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

CREATE OR REPLACE FUNCTION update_pet_follow_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pets SET following_count = following_count + 1 WHERE id = NEW.follower_pet_id;
    UPDATE public.pets SET follower_count = follower_count + 1 WHERE id = NEW.following_pet_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pets SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_pet_id;
    UPDATE public.pets SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_pet_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_follow_count ON public.follows;
CREATE TRIGGER trg_follow_count
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION update_pet_follow_count();

-- 11. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  clean_username TEXT;
  counter INT := 0;
BEGIN
  base_username := SPLIT_PART(NEW.email, '@', 1);
  clean_username := REGEXP_REPLACE(LOWER(base_username), '[^a-z0-9_]', '', 'g');
  IF clean_username = '' THEN
    clean_username := 'user';
  END IF;

  -- ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = clean_username) LOOP
    counter := counter + 1;
    clean_username := REGEXP_REPLACE(LOWER(base_username), '[^a-z0-9_]', '', 'g') || counter;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    clean_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', base_username),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. RLS POLICIES (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Pets: Public read, owner manage
DROP POLICY IF EXISTS "Pets are viewable by everyone" ON public.pets;
CREATE POLICY "Pets are viewable by everyone" ON public.pets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage their pets" ON public.pets;
CREATE POLICY "Owners can manage their pets" ON public.pets FOR ALL USING (auth.uid() = owner_id);

-- Posts: Public read, author manage
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authors can manage their posts" ON public.posts;
CREATE POLICY "Authors can manage their posts" ON public.posts FOR ALL USING (auth.uid() = author_id);

-- Post Media: Public read, post author manage
DROP POLICY IF EXISTS "Post media is viewable by everyone" ON public.post_media;
CREATE POLICY "Post media is viewable by everyone" ON public.post_media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authors can manage post media" ON public.post_media;
CREATE POLICY "Authors can manage post media" ON public.post_media FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
);

-- Reactions: Public read, user manage
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their reactions" ON public.reactions;
CREATE POLICY "Users can manage their reactions" ON public.reactions FOR ALL USING (auth.uid() = user_id);

-- Comments: Public read, user manage
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their comments" ON public.comments;
CREATE POLICY "Users can manage their comments" ON public.comments FOR ALL USING (auth.uid() = user_id);

-- Follows: Public read, follower pet owner manage
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Pet owners can manage follows" ON public.follows;
CREATE POLICY "Pet owners can manage follows" ON public.follows FOR ALL USING (
  EXISTS (SELECT 1 FROM public.pets WHERE id = follower_pet_id AND owner_id = auth.uid())
);

-- Notifications: Recipient only
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- 13. Create Storage bucket 'petbook' if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('petbook', 'petbook', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'petbook');

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'petbook'
);
