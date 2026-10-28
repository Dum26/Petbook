# Cơ sở dữ liệu PetBook

Chạy `npm run migrate` từ thư mục gốc.

- `supabase/migrations/20261027000001_petbook_schema.sql`: profiles, pets, posts, post_media, reactions, comments, follows, notifications; chỉ chạy nếu chưa có bảng pets.
- `supabase/migrations/20261028000001_social_privacy.sql`: RLS đọc theo quyền riêng tư, chặn ghi trực tiếp từ Data API, index và bucket petbook-private.
- `public.petbook_migrations`: ghi nhận migration đã áp dụng, lần chạy sau bỏ qua.

Ứng dụng kiểm tra chủ sở hữu ở Server Actions trước khi ghi qua PostgreSQL. Auth/Storage vẫn dùng Supabase SDK và phiên người dùng. Không cần service-role key cho luồng mới.

Migration 20261019 và seed.sql thuộc hệ thống lưu kỷ niệm gia đình cũ, được giữ để tham chiếu và bảo toàn dữ liệu. Trình chạy mới không nạp seed và không xóa bảng cũ.

Kiểm tra chính sách bằng `npm run test:database`: toàn bộ dữ liệu thử được rollback.
