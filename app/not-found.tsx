import Link from "next/link";
export default function NotFound() {
  return <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-5"><p className="text-5xl">🐾</p><h1 className="font-display font-bold text-2xl">Không tìm thấy nội dung</h1><p className="text-sm text-brown-wood">Bài viết hoặc hồ sơ có thể đã được xóa, hoặc bạn chưa có quyền xem.</p><Link href="/" className="social-button">Về bảng tin</Link></div>;
}
