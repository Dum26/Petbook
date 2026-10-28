"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Profile } from "@/types/petbook";
import { Avatar } from "@/components/shared/Avatar";
import { saveProfileAction } from "@/app/actions/petbook";
export function ProfileSettings({ profile, email }: { profile: Profile | null; email: string }) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(profile?.avatar_url || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAvatar(result.url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không tải được ảnh."); }
    finally { setBusy(false); event.target.value = ""; }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const result = await saveProfileAction(new FormData(event.currentTarget));
      if (!result.success) throw new Error(result.error);
      setMessage("Đã lưu thông tin tài khoản."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không lưu được hồ sơ."); } finally { setBusy(false); }
  }
  return <form onSubmit={save} className="social-card space-y-5">
    <h2 className="font-display font-bold text-xl">Hồ sơ chủ nuôi</h2>
    <div className="flex items-center gap-4"><Avatar src={avatar} alt={profile?.display_name || "Ảnh đại diện"} size="lg" /><label className="text-sm font-bold text-orange-deep">Đổi ảnh đại diện<input aria-label="Tải ảnh đại diện" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={upload} className="block text-xs mt-2 max-w-52" /></label></div>
    <input type="hidden" name="avatar_url" value={avatar} />
    <label className="block text-sm font-bold">Tên hiển thị<input name="display_name" defaultValue={profile?.display_name} required maxLength={80} className="social-input mt-2" /></label>
    <label className="block text-sm font-bold">Giới thiệu<textarea name="bio" defaultValue={profile?.bio || ""} maxLength={1000} rows={3} className="social-input mt-2" /></label>
    <p className="text-xs text-brown-soft">{email} · @{profile?.username}</p>
    <button disabled={busy} className="social-button">{busy ? "Đang xử lý…" : "Lưu thay đổi"}</button>
    {message && <p role="status" className="text-sm text-brown-wood">{message}</p>}
  </form>;
}
