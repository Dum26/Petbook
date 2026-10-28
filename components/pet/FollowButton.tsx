"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePet } from "@/lib/context/PetContext";
import { getFollowStateAction, toggleFollowAction } from "@/app/actions/petbook";
export function FollowButton({ targetId, initialFollowing = false, compact = false }: { targetId: string; initialFollowing?: boolean; compact?: boolean }) {
  const { user, activePet } = usePet();
  const activePetId = activePet?.id;
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    setFollowing(initialFollowing);
    if (activePetId) getFollowStateAction(activePetId, targetId).then(result => { if (current) setFollowing(result.following); }).catch(() => { if (current) setError("Chưa tải được trạng thái theo dõi."); });
    return () => { current = false; };
  }, [activePetId, targetId, initialFollowing]);
  async function toggle() {
    if (!activePet) return;
    setBusy(true); setError("");
    try {
      const result = await toggleFollowAction(activePet.id, targetId);
      if (!("success" in result) || !result.success) throw new Error(result.error);
      setFollowing(result.following!); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Chưa theo dõi được."); }
    finally { setBusy(false); }
  }
  if (!user) return <Link href="/login" aria-label="Đăng nhập để theo dõi" className="text-[11px] font-bold text-orange-deep shrink-0">{compact ? "+ Theo dõi" : "Đăng nhập để theo dõi"}</Link>;
  if (!activePet) return <Link href="/pet/new" className="text-xs font-bold text-orange-deep">{compact ? "Tạo boss" : "Tạo boss để theo dõi"}</Link>;
  if (activePet.id === targetId) return null;
  return <div className="shrink-0"><button onClick={toggle} disabled={busy} aria-pressed={following} className={compact ? "text-[11px] font-bold text-orange-deep py-2 whitespace-nowrap disabled:text-brown-soft" : following ? "social-button-secondary text-xs" : "social-button text-xs"}>{busy ? "Đang lưu…" : following ? compact ? "Đã theo dõi" : "Đã theo dõi ✓" : compact ? "+ Theo dõi" : "Theo dõi +"}</button>{error && <p role="alert" className="text-xs text-red-700 mt-2 max-w-32">{error}</p>}</div>;
}
