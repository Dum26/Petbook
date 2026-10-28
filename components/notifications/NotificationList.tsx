"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Notification } from "@/types/petbook";
import { Avatar } from "@/components/shared/Avatar";
import { markNotificationAction, markNotificationsReadAction } from "@/app/actions/petbook";
export function NotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function mark(id?: string) {
    setBusy(true); setError("");
    try {
      const result = await (id ? markNotificationAction(id) : markNotificationsReadAction());
      if (!result.success) throw new Error(result.error);
      setNotifications(items => items.map(item => !id || item.id === id ? { ...item, is_read: true } : item));
      window.dispatchEvent(new Event("petbook:notifications-read")); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Chưa đánh dấu được thông báo."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    {notifications.some(item => !item.is_read) && <button className="social-button-secondary" disabled={busy} onClick={() => mark()}>Đánh dấu tất cả đã đọc</button>}
    {notifications.length ? <div className="social-card p-0 divide-y divide-brown-border/40 overflow-hidden">{notifications.map(item => {
      const href = item.type === "follow" ? item.actor_pet?.slug ? "/pet/" + item.actor_pet.slug : "/explore" : item.reference_id ? "/post/" + item.reference_id : "/";
      return <div key={item.id} className={`flex items-start gap-3 p-4 ${!item.is_read ? "bg-orange-pastel/10" : ""}`}>
        <Avatar src={item.actor_pet?.avatar_url} alt={item.actor_pet?.name || "PetBook"} size="sm" />
        <div className="flex-1 min-w-0"><Link href={href} className="block text-sm hover:text-orange-deep" onClick={() => { if (!item.is_read) void mark(item.id); }}>{item.message}</Link><time className="text-xs text-brown-soft" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" })}</time></div>
        {!item.is_read && <button disabled={busy} aria-label="Đánh dấu thông báo đã đọc" className="w-7 h-7 grid place-items-center text-orange-deep" onClick={() => mark(item.id)}>●</button>}
      </div>;
    })}</div> : <div className="social-card text-center space-y-3"><span className="text-3xl">🔔</span><p className="font-bold">Chưa có thông báo</p><p className="text-sm text-brown-wood">Những lượt theo dõi, cảm xúc và lời chào mới sẽ xuất hiện tại đây.</p></div>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
