"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Post } from "@/types/petbook";
import { CreatePost } from "./CreatePost";
import { PostCard } from "./PostCard";
import { usePet } from "@/lib/context/PetContext";
import { loadFeedAction } from "@/app/actions/petbook";

type Props = {
  initialPosts: Post[]; petId?: string; initialViewerPetId?: string;
  mode?: "discover" | "following"; query?: string; mediaOnly?: boolean; memories?: boolean; showComposer?: boolean;
};

export function NewsFeed({ initialPosts, petId, initialViewerPetId, mode = "discover", query = "", mediaOnly = false, memories = false, showComposer = true }: Props) {
  const { activePet, user } = usePet();
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialPosts.length === 20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    setPosts(initialPosts);
    setHasMore(initialPosts.length === 20);
    setError("");
    if (activePet?.id !== initialViewerPetId) {
      setBusy(true);
      loadFeedAction({ petId, viewerPetId: activePet?.id, mode, query, mediaOnly, memories }).then(result => {
        if (!current) return;
        if (result.posts) { setPosts(result.posts); setHasMore(result.posts.length === 20); }
        else setError(result.error || "Chưa tải được bảng tin.");
      }).finally(() => { if (current) setBusy(false); });
    }
    return () => { current = false; };
  }, [initialPosts, activePet?.id, initialViewerPetId, petId, mode, query, mediaOnly, memories]);

  async function loadMore() {
    setBusy(true); setError("");
    try {
      const result = await loadFeedAction({ petId, viewerPetId: activePet?.id, mode, query, mediaOnly, memories, offset: posts.length });
      if (!result.posts) throw new Error(result.error);
      setPosts(previous => [...previous, ...result.posts!.filter(post => !previous.some(p => p.id === post.id))]);
      setHasMore(result.posts.length === 20);
    } catch (error) { setError(error instanceof Error ? error.message : "Chưa tải được bài viết."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-5 max-w-2xl mx-auto">
    {showComposer && <CreatePost onPostCreated={post => {
      if ((!petId || post.pet_id === petId) && mode === "discover") setPosts(previous => [post, ...previous.filter(item => item.id !== post.id)]);
    }} />}
    {mode === "following" && !user ? <div className="social-card text-center"><Link href="/login" className="font-bold text-orange-deep">Đăng nhập để xem các boss đang theo dõi</Link></div> :
      posts.length ? posts.map(post => <PostCard key={post.id + (activePet?.id || "")} post={post} onPostDeleted={id => setPosts(previous => previous.filter(p => p.id !== id))} />) :
      !busy && <div className="social-card text-center space-y-3 !py-12 border-dashed !shadow-none">
        <span className="text-4xl" aria-hidden="true">🐾</span>
        <h3 className="font-display font-bold text-xl">{mode === "following" ? "Bảng tin đang chờ những người bạn" : mediaOnly ? "Album chưa có ảnh hay video" : memories ? "Kỷ niệm sẽ lớn lên cùng boss" : "Chưa có bài viết phù hợp"}</h3>
        <p className="text-sm text-brown-wood">{mode === "following" ? "Theo dõi các boss ở mục Khám phá để gặp lại họ tại đây." : memories ? "Những bài viết vào ngày này của các năm trước sẽ xuất hiện ở đây." : "Chia sẻ một khoảnh khắc hoặc thử khám phá những người bạn mới."}</p>
        <Link href="/explore" className="inline-block font-bold text-orange-deep">Khám phá cộng đồng →</Link>
      </div>}
    {error && <p role="alert" className="rounded-2xl p-4 bg-red-50 text-red-700 text-sm">{error}</p>}
    {hasMore && <button onClick={loadMore} disabled={busy} className="social-button w-full">{busy ? "Đang tải…" : "Xem thêm bài viết"}</button>}
    {busy && !hasMore && <p role="status" className="text-sm text-center">Đang tải bảng tin…</p>}
  </div>;
}
