"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-5"><h1 className="font-display font-bold text-2xl">PetBook cần một chút thời gian 🐾</h1><p className="text-sm text-brown-wood">Chưa tải được nội dung. Hãy kiểm tra kết nối hoặc thử lại sau một lát.</p><button onClick={reset} className="social-button">Thử lại</button><Link href="/" className="block text-sm text-orange-deep">Về bảng tin</Link></div>;
}
