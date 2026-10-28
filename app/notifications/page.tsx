import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getNotifications } from "@/lib/petbook-service";
import { NotificationList } from "@/components/notifications/NotificationList";
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { user } = await getCurrentUser();
  if (!user) redirect("/login");
  const page = Math.min(3000, Math.max(0, parseInt((await searchParams).page || "0") || 0));
  const notifications = await getNotifications(user.id, page * 30);
  return <div className="max-w-2xl mx-auto px-4 py-8 space-y-6"><h1 className="font-display font-bold text-3xl">Thông báo 🔔</h1><NotificationList key={page + JSON.stringify(notifications)} initialNotifications={notifications} /><nav aria-label="Trang thông báo" className="flex justify-between text-sm font-bold text-orange-deep">{page > 0 ? <Link href={"/notifications?page=" + (page - 1)}>← Trang trước</Link> : <span />}{notifications.length === 30 && <Link href={"/notifications?page=" + (page + 1)}>Trang sau →</Link>}</nav></div>;
}
