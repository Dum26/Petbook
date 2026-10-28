-- ==============================================================================
-- MIGRATION: 20261019000001_initial_schema.sql
-- PROJECT: Nhà Của 2 Boss 🐶🐶
-- DESCRIPTION: Kiến trúc cơ sở dữ liệu cho website lưu giữ kỷ niệm
-- ==============================================================================

-- Bật extension uuid-ossp (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG ADMIN USERS (Quản lý quyền quản trị viên độc lập, an toàn hơn user_metadata)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hàm kiểm tra xem user hiện tại có phải admin không
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. BẢNG DOGS (Hồ sơ các boss - thiết kế mở rộng được nhiều hơn 2 boss)
CREATE TABLE IF NOT EXISTS public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  nickname TEXT,
  birthday DATE NOT NULL,
  adoption_date DATE NOT NULL,
  breed TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  avatar_path TEXT NOT NULL,
  cover_path TEXT,
  personality TEXT[] DEFAULT '{}'::text[],
  favorite_food TEXT,
  hobbies TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. BẢNG MEMORIES (Kỷ niệm: bài viết chứa ảnh/video)
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  caption TEXT NOT NULL,
  happened_at DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  cover_media_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. BẢNG MEMORY_MEDIA (Danh sách ảnh/video thuộc về kỷ niệm)
CREATE TABLE IF NOT EXISTS public.memory_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Thêm foreign key cho cover_media_id trong memories (DEFERRABLE INITIALLY DEFERRED)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_memories_cover_media'
  ) THEN
    ALTER TABLE public.memories
      ADD CONSTRAINT fk_memories_cover_media
      FOREIGN KEY (cover_media_id)
      REFERENCES public.memory_media(id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- 5. BẢNG MEMORY_DOGS (Quan hệ nhiều-nhiều giữa kỷ niệm và các chú chó)
CREATE TABLE IF NOT EXISTS public.memory_dogs (
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (memory_id, dog_id)
);

-- 6. BẢNG ALBUMS (Bộ sưu tập theo chủ đề)
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. BẢNG MEMORY_ALBUMS (Quan hệ nhiều-nhiều giữa kỷ niệm và albums)
CREATE TABLE IF NOT EXISTS public.memory_albums (
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (memory_id, album_id)
);

-- 8. BẢNG TAGS (Thẻ phân loại)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. BẢNG MEMORY_TAGS (Quan hệ nhiều-nhiều giữa kỷ niệm và tags)
CREATE TABLE IF NOT EXISTS public.memory_tags (
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (memory_id, tag_id)
);

-- 10. BẢNG FUNNY_POSTS (Góc tấu hài & danh hiệu)
CREATE TABLE IF NOT EXISTS public.funny_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  media_path TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  dog_id UUID REFERENCES public.dogs(id) ON DELETE SET NULL,
  badge_title TEXT,
  reaction_count INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. BẢNG MILESTONES (Các cột mốc đáng nhớ)
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES public.dogs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  happened_at DATE NOT NULL,
  memory_id UUID REFERENCES public.memories(id) ON DELETE SET NULL,
  icon TEXT DEFAULT 'paw',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES CHO PERFORMANCE VÀ TÌM KIẾM
CREATE INDEX IF NOT EXISTS idx_dogs_slug ON public.dogs(slug);
CREATE INDEX IF NOT EXISTS idx_memories_happened_at ON public.memories(happened_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_status ON public.memories(status);
CREATE INDEX IF NOT EXISTS idx_memories_slug ON public.memories(slug);
CREATE INDEX IF NOT EXISTS idx_memory_media_memory_id ON public.memory_media(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_media_sort ON public.memory_media(memory_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_memory_dogs_dog_id ON public.memory_dogs(dog_id);
CREATE INDEX IF NOT EXISTS idx_memory_dogs_memory_id ON public.memory_dogs(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_albums_album_id ON public.memory_albums(album_id);
CREATE INDEX IF NOT EXISTS idx_memory_tags_tag_id ON public.memory_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_funny_posts_published ON public.funny_posts(is_published, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_milestones_happened ON public.milestones(happened_at ASC);

-- TRIGGER TỰ ĐỘNG CẬP NHẬT updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_dogs_updated_at ON public.dogs;
CREATE TRIGGER set_dogs_updated_at BEFORE UPDATE ON public.dogs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_memories_updated_at ON public.memories;
CREATE TRIGGER set_memories_updated_at BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_albums_updated_at ON public.albums;
CREATE TRIGGER set_albums_updated_at BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_funny_posts_updated_at ON public.funny_posts;
CREATE TRIGGER set_funny_posts_updated_at BEFORE UPDATE ON public.funny_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_milestones_updated_at ON public.milestones;
CREATE TRIGGER set_milestones_updated_at BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
