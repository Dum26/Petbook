import { notFound } from "next/navigation";
import Link from "next/link";
import { getActivePetId, getPostById } from "@/lib/petbook-service";
import { PostDetail } from "@/components/feed/PostDetail";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const post = await getPostById((await params).id, await getActivePetId());
  if (!post) notFound();
  return <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
    <Link href="/" className="text-sm font-bold text-orange-deep">← Về bảng tin</Link>
    <h1 className="font-display font-bold text-2xl">Khoảnh khắc của {post.pet.name}</h1>
    <PostDetail post={post} />
  </div>;
}
