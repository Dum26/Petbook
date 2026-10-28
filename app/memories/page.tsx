import { getActivePetId, getFeedPosts } from "@/lib/petbook-service";
import { NewsFeed } from "@/components/feed/NewsFeed";
export default async function MemoriesPage() {
  const viewer = await getActivePetId();
  const posts = await getFeedPosts({ memories: true, viewerPetId: viewer });
  return <div className="max-w-2xl mx-auto px-4 py-8 space-y-5"><h1 className="font-display font-bold text-3xl">Ngày này năm trước 📸</h1><p className="text-sm text-brown-wood">Nhìn lại những ngày đáng nhớ của gia đình boss. Kỷ niệm riêng tư chỉ hiển thị với bạn.</p><NewsFeed initialPosts={posts} initialViewerPetId={viewer} memories showComposer={false} /></div>;
}
