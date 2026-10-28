import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getActivePetId, getPetBySlug, getPetById, getFeedPosts } from "@/lib/petbook-service";
import { PetProfileHeader } from "@/components/pet/PetProfileHeader";
import { NewsFeed } from "@/components/feed/NewsFeed";
export default async function PetProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const viewer = await getActivePetId();
  const { user } = await getCurrentUser();
  const pet = await getPetBySlug(id, viewer) || await getPetById(id);
  if (!pet) notFound();
  const mediaOnly = (await searchParams).tab === "media";
  const isOwner = user?.id === pet.owner_id;
  const posts = await getFeedPosts({ petId: pet.id, viewerPetId: viewer, mediaOnly });
  return <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
    <PetProfileHeader key={pet.id + viewer} pet={pet} isOwner={isOwner} />
    <div className="max-w-2xl mx-auto space-y-5">
      <nav className="flex gap-3" aria-label="Nội dung hồ sơ">{[[false, "Bài viết"], [true, "Album ảnh & video"]].map(([media, label]) => <Link key={String(media)} href={`/pet/${pet.slug}${media ? "?tab=media" : ""}`} aria-current={mediaOnly === media ? "page" : undefined} className={`px-4 py-3 rounded-2xl font-bold text-sm ${mediaOnly === media ? "bg-orange-deep text-white" : "bg-white border border-brown-border text-brown-wood"}`}>{label}</Link>)}</nav>
      <NewsFeed initialPosts={posts} initialViewerPetId={viewer} petId={pet.id} mediaOnly={mediaOnly} showComposer={isOwner && !mediaOnly} />
    </div>
  </div>;
}
