"use client";
import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, resetPasswordAction } from "@/app/actions/petbook";
export function PasswordForm({ reset = false, expired = false }: { reset?: boolean; expired?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(expired ? "Liên kết đã hết hạn hoặc không hợp lệ. Hãy yêu cầu email mới." : "");
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (reset && form.get("password") !== form.get("confirmation")) { setMessage("Hai mật khẩu chưa khớp."); return; }
    setBusy(true); setMessage("");
    try {
      const result = await (reset ? resetPasswordAction(form) : requestPasswordResetAction(form));
      if (!result.success) throw new Error(result.error);
      setDone(true);
      setMessage(reset ? "Đã đổi mật khẩu. Bạn có thể tiếp tục sử dụng PetBook." : "Nếu email có tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư rác và mở liên kết trong trình duyệt này.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa thực hiện được. Hãy thử lại."); }
    finally { setBusy(false); }
  }
  return <div className="max-w-md mx-auto px-4 py-12"><form onSubmit={submit} className="social-card space-y-5">
    <h1 className="font-display font-bold text-2xl">{reset ? "Đặt mật khẩu mới" : "Quên mật khẩu?"}</h1>
    <p className="text-sm text-brown-wood">{reset ? "Chọn mật khẩu từ 8 đến 128 ký tự để bảo vệ tài khoản." : "Nhập email đăng ký, PetBook sẽ gửi liên kết giúp bạn trở lại."}</p>
    {!done && (reset ? <><label className="block text-sm font-bold">Mật khẩu mới<input className="social-input mt-2" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><label className="block text-sm font-bold">Nhập lại mật khẩu<input className="social-input mt-2" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label></> : <label className="block text-sm font-bold">Email<input className="social-input mt-2" name="email" type="email" autoComplete="email" required /></label>)}
    {!done && <button className="social-button w-full" disabled={busy}>{busy ? "Đang xử lý…" : reset ? "Lưu mật khẩu" : "Gửi liên kết đặt lại"}</button>}
    {message && <p role="status" className="text-sm text-brown-wood">{message}</p>}
    <Link href={reset && done ? "/" : "/login"} className="block text-sm font-bold text-orange-deep">{reset && done ? "Về bảng tin →" : "← Về đăng nhập"}</Link>
  </form></div>;
}
