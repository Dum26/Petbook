"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/account/AuthShell";
import { loginAction } from "@/app/actions/petbook";

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi đăng nhập.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Mừng bạn trở lại." description="Các boss và những câu chuyện đáng yêu đang chờ bạn." footer="Chưa có tài khoản? Tham gia PetBook →" footerHref="/register">
      {errorMsg && <p role="alert" className="rounded-2xl bg-red-50 text-red-700 p-4 text-sm mb-5 flex items-start gap-2"><AlertCircle size={17} className="shrink-0 mt-0.5" />{errorMsg}</p>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label htmlFor="login-email" className="block">Email của bạn</label><input id="login-email" type="email" name="email" autoComplete="email" required placeholder="ban@example.com" className="social-input" /></div>
        <div><div className="flex items-center justify-between"><label htmlFor="login-password" className="block">Mật khẩu</label><Link href="/forgot-password" className="muted-link mb-2">Quên mật khẩu?</Link></div><input id="login-password" type="password" name="password" autoComplete="current-password" required placeholder="Nhập mật khẩu của bạn" className="social-input" /></div>
        <button type="submit" disabled={isSubmitting} className="social-button w-full !min-h-[50px] !mt-7">{isSubmitting ? "Đang đăng nhập…" : "Về với các boss"}<ArrowRight size={17} /></button>
      </form>
    </AuthShell>
  );
}
