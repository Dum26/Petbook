"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Globe, Lock, Users, MessageCircle, Share2, Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { Post, Comment, ReactionType, PostVisibility } from "@/types/petbook";
import { usePet } from "@/lib/context/PetContext";
import { useTranslation } from "@/lib/i18n";
import { reactPostAction, addCommentAction, deletePostAction, loadCommentsAction, loadReactionAction, updatePostAction } from "@/app/actions/petbook";
import { MediaGallery } from "./MediaGallery";

const reactions: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "paw", emoji: "🐾", label: "Đập chân" }, { type: "bone", emoji: "🦴", label: "Thưởng xương" },
  { type: "heart", emoji: "❤️", label: "Thả tim" }, { type: "haha", emoji: "😂", label: "Haha" }, { type: "wow", emoji: "😮", label: "Wow" },
];

export function PostCard({ post, expanded = false, onPostDeleted }: { post: Post; expanded?: boolean; onPostDeleted?: (id: string) => void }) {
  const { user, activePet } = usePet();
  const activePetId = activePet?.id;
  const { locale } = useTranslation();
  const router = useRouter();
  const [reaction, setReaction] = useState<ReactionType | null>(post.user_reaction_pet_id === activePet?.id ? post.user_reaction || null : null);
  const [reactionCount, setReactionCount] = useState(post.reaction_count);
  const [comments, setComments] = useState<Comment[]>(post.recent_comments || []);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(expanded);
  const [loaded, setLoaded] = useState(false);
  const [commentOffset, setCommentOffset] = useState(0);
  const [moreComments, setMoreComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [commentsBusy, setCommentsBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility);
  const [draft, setDraft] = useState(post.content);
  const [draftVisibility, setDraftVisibility] = useState<PostVisibility>(post.visibility);

  useEffect(() => {
    let current = true;
    if (activePetId && post.user_reaction_pet_id !== activePetId) loadReactionAction(post.id, activePetId).then(result => {
      if (current && "type" in result) { setReaction(result.type!); setReactionCount(result.count!); }
    });
    return () => { current = false; };
  }, [activePetId, post.id, post.user_reaction_pet_id]);

  useEffect(() => {
    let current = true;
    if (expanded) {
      setCommentsBusy(true);
      loadCommentsAction(post.id).then(result => {
        if (current && result.comments) { setComments(result.comments); setLoaded(true); setCommentOffset(result.comments.length); setMoreComments(result.comments.length === 30); }
        else if (current) setError(result.error || "Không tải được bình luận.");
      }).finally(() => { if (current) setCommentsBusy(false); });
    }
    return () => { current = false; };
  }, [post.id, expanded]);

  const showError = (error: unknown) => setError(error instanceof Error ? error.message : "Thao tác chưa thành công. Vui lòng thử lại.");
  async function react(type: ReactionType) {
    if (!user || !activePet) { setError("Đăng nhập và tạo hồ sơ boss để tương tác nhé."); return; }
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await reactPostAction(post.id, activePet.id, type);
      if (!("success" in result) || !result.success) throw new Error(result.error);
      setReaction(result.type); setReactionCount(result.reaction_count);
    } catch (error) { showError(error); } finally { setBusy(false); }
  }
  async function loadComments() {
    setCommentsBusy(true); setError("");
    try {
      const result = await loadCommentsAction(post.id, loaded ? commentOffset : 0);
      if (!result.comments) throw new Error(result.error);
      setComments(previous => loaded ? [...previous, ...result.comments!.filter(c => !previous.some(p => p.id === c.id))] : result.comments!);
      setCommentOffset((loaded ? commentOffset : 0) + result.comments.length);
      setLoaded(true); setMoreComments(result.comments.length === 30);
    } catch (error) { showError(error); } finally { setCommentsBusy(false); }
  }
  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    if (!activePet || !commentInput.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const result = await addCommentAction({ postId: post.id, petId: activePet.id, content: commentInput });
      if (!result.comment) throw new Error(result.error);
      setComments(previous => [...previous, result.comment!]);
      setCommentCount(previous => previous + 1); setCommentInput("");
    } catch (error) { showError(error); } finally { setBusy(false); }
  }
  async function remove() {
    if (!confirm("Xóa bài viết này? Bạn sẽ không thể khôi phục bài đã xóa.")) return;
    setBusy(true); setError("");
    try {
      const result = await deletePostAction(post.id);
      if (!result.success) throw new Error(result.error);
      onPostDeleted?.(post.id);
    } catch (error) { showError(error); } finally { setBusy(false); }
  }
  async function save() {
    setBusy(true); setError("");
    try {
      const result = await updatePostAction(post.id, draft, draftVisibility);
      if (!result.success) throw new Error(result.error);
      setContent(draft.trim()); setVisibility(draftVisibility); setEditing(false); router.refresh();
    } catch (error) { showError(error); } finally { setBusy(false); }
  }
  async function share() {
    try { await navigator.clipboard.writeText(window.location.origin + "/post/" + post.id); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { setError("Không sao chép được. Bạn có thể mở bài viết rồi sao chép địa chỉ."); }
  }
  let time = "";
  try { time = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: locale === "vi" ? vi : enUS }); } catch {}
  const VisibilityIcon = visibility === "private" ? Lock : visibility === "followers" ? Users : Globe;
  return <article id={"post-" + post.id} className="social-card post-card space-y-4">
    <header className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0"><Link href={"/pet/" + post.pet.slug}><Avatar src={post.pet.avatar_url} alt={post.pet.name} size="md" /></Link>
        <div className="min-w-0"><Link href={"/pet/" + post.pet.slug} className="font-bold text-[15px] tracking-tight hover:text-orange-deep">{post.pet.name}</Link>
          <div className="flex items-center gap-2 text-[11px] text-brown-soft mt-1"><Link href={"/post/" + post.id} className="hover:underline">{time}</Link><VisibilityIcon size={12} aria-label={visibility === "public" ? "Công khai" : visibility === "followers" ? "Người theo dõi" : "Chỉ mình tôi"} /></div>
        </div>
      </div>
      {user?.id === post.author_id && <div className="flex gap-1"><button aria-label="Sửa bài viết" onClick={() => setEditing(!editing)} className="social-icon-button"><Pencil size={16} /></button><button aria-label="Xóa bài viết" onClick={remove} disabled={busy} className="social-icon-button text-red-600"><Trash2 size={16} /></button></div>}
    </header>
    {editing ? <div className="space-y-3"><textarea aria-label="Nội dung bài viết" className="social-input min-h-28" value={draft} onChange={e => setDraft(e.target.value)} maxLength={10000} /><select aria-label="Quyền xem" value={draftVisibility} onChange={e => setDraftVisibility(e.target.value as PostVisibility)} className="social-input"><option value="public">Công khai</option><option value="followers">Người theo dõi</option><option value="private">Chỉ mình tôi</option></select><div className="flex gap-2"><button className="social-button" disabled={busy} onClick={save}>Lưu thay đổi</button><button className="social-button-secondary" onClick={() => setEditing(false)}>Hủy</button></div></div> :
      content && <p className="post-content whitespace-pre-wrap break-words">{content}</p>}
    <MediaGallery media={post.media || []} title={"Khoảnh khắc của " + post.pet.name} />
    <div className="flex justify-between text-[11px] text-brown-soft !mt-4"><span>{reactionCount} lượt cảm xúc</span><button onClick={() => setShowComments(!showComments)} className="hover:underline">{commentCount} bình luận</button></div>
    <div className="flex items-center justify-between gap-1 border-y border-brown-border py-2" aria-label="Cảm xúc">
      {reactions.map(item => <button key={item.type} title={item.label} aria-label={item.label} aria-pressed={reaction === item.type} disabled={busy} onClick={() => react(item.type)} className="reaction-choice flex-1">{item.emoji}</button>)}
    </div>
    <div className="flex gap-3 text-xs font-semibold text-brown-wood !mt-2"><button onClick={() => setShowComments(!showComments)} className="flex-1 flex gap-2 justify-center items-center py-2 hover:text-orange-deep"><MessageCircle size={16} />Bình luận</button><button onClick={share} className="flex-1 flex gap-2 justify-center items-center py-2 hover:text-orange-deep"><Share2 size={16} />{copied ? "Đã chép liên kết" : "Chia sẻ"}</button></div>
    {showComments && <section aria-label="Bình luận" className="space-y-3 border-t border-brown-border/40 pt-4">
      {comments.map(comment => <div key={comment.id} className="flex gap-2"><Link href={"/pet/" + comment.pet?.slug}><Avatar size="xs" src={comment.pet?.avatar_url} alt={comment.pet?.name || "Boss"} /></Link><div className="flex-1 rounded-2xl bg-cream-50 p-3"><Link href={"/pet/" + comment.pet?.slug} className="text-xs font-bold">{comment.pet?.name}</Link><p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p></div></div>)}
      {((!loaded && commentCount > comments.length) || moreComments) && <button onClick={loadComments} disabled={commentsBusy} className="text-sm font-bold text-orange-deep">{commentsBusy ? "Đang tải…" : loaded ? "Xem thêm bình luận" : "Xem toàn bộ bình luận"}</button>}
      {!comments.length && !commentsBusy && <p className="text-sm text-brown-soft">Gửi lời chào đầu tiên cho boss nhé.</p>}
      {user && activePet ? <form onSubmit={addComment} className="flex gap-2"><input aria-label={"Bình luận với tư cách " + activePet.name} placeholder={activePet.name + " muốn nói gì?"} className="social-input flex-1 min-w-0" value={commentInput} onChange={e => setCommentInput(e.target.value)} maxLength={2000} required /><button disabled={busy || !commentInput.trim()} className="social-button">Gửi</button></form> : <Link href={user ? "/pet/new" : "/login"} className="text-sm text-orange-deep font-bold">{user ? "Tạo boss để bình luận" : "Đăng nhập để bình luận"}</Link>}
    </section>}
    {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</p>}
  </article>;
}
