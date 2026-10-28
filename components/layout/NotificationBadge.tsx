"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { notificationCountAction } from "@/app/actions/petbook";
export function NotificationBadge() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();
  useEffect(() => {
    let current = true;
    const refresh = () => { if (document.visibilityState === "visible") notificationCountAction().then(result => { if (current) setCount(result.count); }).catch(() => {}); };
    refresh();
    const interval = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("petbook:notifications-read", refresh);
    return () => { current = false; clearInterval(interval); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("petbook:notifications-read", refresh); };
  }, [pathname]);
  return count > 0 ? <span aria-label={count + " thông báo chưa đọc"} className="inline-flex min-w-5 h-5 px-1 items-center justify-center bg-orange-deep text-white text-[10px] rounded-full">{count > 99 ? "99+" : count}</span> : null;
}
