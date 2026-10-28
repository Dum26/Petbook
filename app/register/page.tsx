"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/account/AuthShell";
import { registerAction } from "@/app/actions/petbook";

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await registerAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res.needsConfirmation) {
        setMessage("Đăng ký thành công. Hãy mở email xác nhận trong trình duyệt này để tạo hồ sơ boss.");
      } else {
        router.push("/pet/new");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi đăng ký.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Một khởi đầu đáng yêu." description="Tạo tài khoản để boss nhà bạn có một góc riêng trong cộng đồng." footer="Đã là thành viên? Đăng nhập →" footerHref="/login">
      {message && <p role="status" className="p-4 rounded-2xl bg-[#E6EEDD] text-[#4B6A40] text-sm leading-7 mb-5">{message}</p>}
      {errorMsg && <p role="alert" className="rounded-2xl bg-red-50 text-red-700 p-4 text-sm mb-5 flex items-start gap-2"><AlertCircle size={17} className="shrink-0 mt-0.5" />{errorMsg}</p>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label htmlFor="register-name" className="block">Bạn muốn được gọi là gì?</label><input id="register-name" type="text" name="fullName" autoComplete="name" required maxLength={80} placeholder="Tên của bạn hoặc biệt danh" className="social-input" /></div>
        <div><label htmlFor="register-email" className="block">Email của bạn</label><input id="register-email" type="email" name="email" autoComplete="email" required placeholder="ban@example.com" className="social-input" /></div>
        <div><label htmlFor="register-password" className="block">Mật khẩu</label><input id="register-password" type="password" name="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder="Ít nhất 8 ký tự" className="social-input" /><p className="text-[11px] text-brown-soft mt-2">Một mật khẩu riêng, cho ngôi nhà nhỏ của bạn.</p></div>
        <button type="submit" disabled={isSubmitting} className="social-button w-full !min-h-[50px] !mt-7">{isSubmitting ? "Đang tạo tài khoản…" : "Bắt đầu cùng PetBook"}<ArrowRight size={17} /></button>
      </form>
    </AuthShell>
  );
}
