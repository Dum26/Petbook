-- ==============================================================================
-- MIGRATION: 20261019000002_rls_and_storage.sql
-- PROJECT: Nhà Của 2 Boss 🐶🐶
-- DESCRIPTION: Thiết lập Row Level Security (RLS) và Storage Bucket policies
-- ==============================================================================

-- BẬT ROW LEVEL SECURITY TRÊN TẤT CẢ CÁC BẢNG
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funny_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. POLICIES CHO ADMIN_USERS
-- ------------------------------------------------------------------------------
-- Chỉ admin mới xem được danh sách admin
CREATE POLICY "Admin users can view admin list"
  ON public.admin_users FOR SELECT
  USING (public.is_admin() OR auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. POLICIES CHO DOGS
-- ------------------------------------------------------------------------------
-- Khách và admin đều có thể xem danh sách các boss
CREATE POLICY "Anyone can view dogs"
  ON public.dogs FOR SELECT
  USING (true);

-- Chỉ admin được thêm, sửa, xóa boss
CREATE POLICY "Admins have full access to dogs"
  ON public.dogs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. POLICIES CHO MEMORIES
-- ------------------------------------------------------------------------------
-- Khách chỉ được xem kỷ niệm đã published. Admin được xem tất cả (kể cả draft)
CREATE POLICY "Anyone can view published memories"
  ON public.memories FOR SELECT
  USING (status = 'published' OR public.is_admin());

-- Chỉ admin được tạo, cập nhật, xóa kỷ niệm
CREATE POLICY "Admins have full access to memories"
  ON public.memories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. POLICIES CHO MEMORY_MEDIA
-- ------------------------------------------------------------------------------
-- Khách chỉ xem được media thuộc các kỷ niệm published
CREATE POLICY "Anyone can view media of published memories"
  ON public.memory_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_media.memory_id
        AND (m.status = 'published' OR public.is_admin())
    )
  );

-- Chỉ admin được quản lý media
CREATE POLICY "Admins have full access to memory media"
  ON public.memory_media FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. POLICIES CHO MEMORY_DOGS
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can view memory dogs of published memories"
  ON public.memory_dogs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_dogs.memory_id
        AND (m.status = 'published' OR public.is_admin())
    )
  );

CREATE POLICY "Admins have full access to memory dogs"
  ON public.memory_dogs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. POLICIES CHO ALBUMS
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can view albums"
  ON public.albums FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to albums"
  ON public.albums FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. POLICIES CHO MEMORY_ALBUMS
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can view memory albums"
  ON public.memory_albums FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_albums.memory_id
        AND (m.status = 'published' OR public.is_admin())
    )
  );

CREATE POLICY "Admins have full access to memory albums"
  ON public.memory_albums FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. POLICIES CHO TAGS & MEMORY_TAGS
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can view tags"
  ON public.tags FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to tags"
  ON public.tags FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view memory tags"
  ON public.memory_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_tags.memory_id
        AND (m.status = 'published' OR public.is_admin())
    )
  );

CREATE POLICY "Admins have full access to memory tags"
  ON public.memory_tags FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. POLICIES CHO FUNNY_POSTS
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can view published funny posts"
  ON public.funny_posts FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins have full access to funny posts"
  ON public.funny_posts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. POLICIES CHO MILESTONES
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can view milestones"
  ON public.milestones FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to milestones"
  ON public.milestones FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- STORAGE CONFIGURATION CHO SUPABASE STORAGE (Bucket: memories)
-- ==============================================================================

-- 1. Khởi tạo bucket 'memories' nếu chưa có
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memories',
  'memories',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];

-- 2. Storage RLS Policies
-- Khách có thể xem/tải tất cả file công khai trong bucket 'memories'
DROP POLICY IF EXISTS "Public view storage memories" ON storage.objects;
CREATE POLICY "Public view storage memories"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memories');

-- Chỉ Admin mới được upload file vào bucket 'memories'
DROP POLICY IF EXISTS "Admin upload storage memories" ON storage.objects;
CREATE POLICY "Admin upload storage memories"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memories'
    AND (public.is_admin() OR auth.role() = 'authenticated')
  );

-- Chỉ Admin mới được update file trong bucket 'memories'
DROP POLICY IF EXISTS "Admin update storage memories" ON storage.objects;
CREATE POLICY "Admin update storage memories"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'memories'
    AND (public.is_admin() OR auth.role() = 'authenticated')
  );

-- Chỉ Admin mới được xóa file trong bucket 'memories'
DROP POLICY IF EXISTS "Admin delete storage memories" ON storage.objects;
CREATE POLICY "Admin delete storage memories"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memories'
    AND (public.is_admin() OR auth.role() = 'authenticated')
  );
