import Link from "next/link";
import { ArrowUpRight, Compass, Heart, Users, Cake } from "lucide-react";
import { getActivePetId, getFeedPosts, getSuggestedPets, getBirthdayPets } from "@/lib/petbook-service";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/layout/RightPanel";
import { NewsFeed } from "@/components/feed/NewsFeed";
import { Avatar } from "@/components/shared/Avatar";
import { PetSketch } from "@/components/brand/PetSketch";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ feed?: string }> }) {
  const mode = (await searchParams).feed === "following" ? "following" : "discover";
  const activePetId = await getActivePetId();
  const [posts, suggestedPets, birthdayPets] = await Promise.all([
    getFeedPosts({ viewerPetId: activePetId, mode }), getSuggestedPets(activePetId, 6), getBirthdayPets(),
  ]);
  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 xl:px-8 py-6 lg:py-8">
      <div className="flex items-start justify-center gap-6 xl:gap-7">
        <Sidebar />
        <section aria-label="Bảng tin" className="flex-1 max-w-[640px] min-w-0 space-y-6">
          <div className="welcome-banner">
            <div className="welcome-copy">
              <p className="eyebrow !text-[#52664D] mb-3">Một ngôi nhà cho mọi boss</p>
              <h1>Chuyện của boss.<br /><span className="text-[#587155]">Niềm vui của bạn.</span></h1>
              <p className="text-xs sm:text-[13px] text-[#52664D] leading-relaxed mt-3 max-w-[260px]">Chuyện thường ngày của các boss,<br className="hidden sm:block" /> là điều đặc biệt ở đây.</p>
            </div>
            <PetSketch className="welcome-art" />
          </div>

          {suggestedPets.length > 0 && <section aria-label="Những người bạn nhỏ" className="space-y-4">
            <div className="flex items-center justify-between"><h2 className="panel-heading">Những người bạn nhỏ</h2><Link href="/explore" className="muted-link inline-flex items-center gap-1">Làm quen nhé<ArrowUpRight size={14} /></Link></div>
            <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-1">
              {suggestedPets.map(pet => <Link key={pet.id} href={"/pet/" + pet.slug} className="flex flex-col items-center gap-2 shrink-0 w-[62px] sm:w-[68px] group">
                <div className="pet-portrait"><Avatar src={pet.avatar_url} alt={pet.name} size="lg" border={false} className="!w-[54px] !h-[54px] sm:!w-[60px] sm:!h-[60px]" /></div>
                <span className="text-[11px] font-bold truncate w-full text-center group-hover:text-orange-deep">{pet.name}</span>
              </Link>)}
            </div>
          </section>}

          <div className="flex items-center justify-between gap-3">
            <nav aria-label="Chọn bảng tin" className="feed-tabs flex-1">
              <Link href="/" aria-current={mode === "discover" ? "page" : undefined} className="feed-tab"><Compass size={17} />Khám phá</Link>
              <Link href="/?feed=following" aria-current={mode === "following" ? "page" : undefined} className="feed-tab"><Users size={17} />Đang theo dõi</Link>
            </nav>
          </div>

          {birthdayPets.length > 0 && <section className="social-card xl:hidden !bg-[#FCF5E9] flex gap-3"><Cake size={20} className="text-orange-deep shrink-0 mt-1" /><div className="space-y-2"><h2 className="font-bold text-sm">Sinh nhật trong 7 ngày tới</h2>{birthdayPets.map(pet => <Link key={pet.id} href={"/pet/" + pet.slug} className="block text-xs text-brown-wood">{pet.name} · {new Date(pet.birthday!).toLocaleDateString("vi-VN", { timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit" })}</Link>)}</div></section>}
          <NewsFeed initialPosts={posts} initialViewerPetId={activePetId} mode={mode} />
          <p className="flex items-center justify-center gap-2 py-4 text-[11px] text-brown-soft"><Heart size={12} />Một chút đáng yêu, mỗi ngày.</p>
        </section>
        <RightPanel key={activePetId} suggestedPets={suggestedPets.slice(0, 4)} birthdayPets={birthdayPets} />
      </div>
    </div>
  );
}
