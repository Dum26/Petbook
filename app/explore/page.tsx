import Link from "next/link";
import { searchPets, getFeedPosts, getActivePetId } from "@/lib/petbook-service";
import { speciesLabels, species } from "@/lib/social-validation";
import Image from "next/image";
import { PawPrint, Search, ArrowUpRight } from "lucide-react";
import { NewsFeed } from "@/components/feed/NewsFeed";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; species?: string; page?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 100);
  const petSpecies = species.safeParse(params.species).success ? params.species! : "";
  const page = Math.min(4000, Math.max(0, Number.parseInt(params.page || "0") || 0));
  const viewer = await getActivePetId();
  const [pets, posts] = await Promise.all([searchPets(query, petSpecies, page * 24), query ? getFeedPosts({ query, viewerPetId: viewer }) : Promise.resolve([])]);
  const href = (nextPage: number) => "/explore?" + new URLSearchParams({ q: query, species: petSpecies, page: String(nextPage) });
  return (
    <div className="max-w-[1120px] mx-auto py-8 sm:py-12 px-4 sm:px-8 space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div><p className="eyebrow mb-3">Rất vui được gặp bạn</p><h1 className="font-display font-bold text-3xl sm:text-4xl tracking-[-.05em]">Một thế giới bạn nhỏ.</h1><p className="text-sm text-brown-soft mt-3 leading-7">Có thể người bạn tiếp theo của boss đang ở ngay đây.</p></div>
        <PawPrint size={48} strokeWidth={1} className="text-[#BDCBB3] hidden sm:block -rotate-12" />
      </div>
      <form action="/explore" className="social-card !p-3 sm:!p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48"><Search size={17} className="absolute left-4 top-4 text-brown-soft" /><input type="search" name="q" defaultValue={query} maxLength={100} placeholder="Tên boss, giống hoặc một câu chuyện…" aria-label="Tìm kiếm cộng đồng" className="social-input !pl-11 !border-transparent" /></div>
        <select name="species" defaultValue={petSpecies} aria-label="Loài thú cưng" className="social-input !w-auto flex-1 sm:flex-none !border-transparent"><option value="">Tất cả loài</option>{Object.entries(speciesLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className="social-button">Tìm bạn mới<ArrowUpRight size={16} /></button>
      </form>
      <section aria-label="Thú cưng" className="space-y-5">
        <div className="flex justify-between items-center"><h2 className="section-heading">{query ? "Những người bạn phù hợp" : "Ghé thăm các boss"}</h2><span className="eyebrow hidden sm:block">Mỗi boss, một cá tính</span></div>
        {pets.length ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">{pets.map((pet, index) => <Link key={pet.id} href={"/pet/" + pet.slug} className="pet-grid-card block rounded-3xl bg-white border border-brown-border overflow-hidden group">
          <div className="pet-grid-cover relative h-40 sm:h-48" style={{ background: ["#E4EADF", "#F1E5D7", "#E4E9E6", "#EDDDD4"][index % 4] }}>
            {pet.cover_url || pet.avatar_url ? <Image src={(pet.cover_url || pet.avatar_url)!} alt={pet.name} fill unoptimized className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="h-full grid place-items-center"><PawPrint size={58} strokeWidth={1} className="text-[#A5B09B]" /></div>}
            <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/95 rounded-full text-[10px] font-bold text-brown-wood">{speciesLabels[pet.species]}</span>
          </div>
          <div className="p-4 sm:p-5"><h3 className="font-display font-bold text-lg tracking-tight truncate group-hover:text-orange-deep">{pet.name}</h3><p className="text-[11px] text-brown-soft truncate mt-1">{pet.breed || "Một người bạn thật đáng yêu"}</p>
            <div className="flex items-center justify-between border-t border-brown-border mt-4 pt-3"><p className="text-[10px] sm:text-xs text-brown-soft"><b className="text-brown-wood">{pet.follower_count}</b> người theo dõi</p><ArrowUpRight size={17} className="text-orange-deep" /></div>
          </div>
        </Link>)}</div> : <div className="social-card !py-14 text-center space-y-4"><Search size={28} strokeWidth={1.5} className="mx-auto text-brown-soft" /><h3 className="font-bold">Chưa gặp đúng người bạn rồi.</h3><p className="text-sm text-brown-soft">Thử đổi tên tìm kiếm hoặc chọn một loài khác nhé.</p><Link href="/explore" className="muted-link inline-block">Xem tất cả các boss →</Link></div>}
        <div className="flex justify-between text-sm font-bold text-orange-deep pt-2">{page > 0 ? <Link href={href(page - 1)}>← Trang trước</Link> : <span />}{pets.length === 24 && <Link href={href(page + 1)}>Trang sau →</Link>}</div>
      </section>
      {query && <section className="space-y-5 border-t border-brown-border pt-8"><h2 className="section-heading">Những câu chuyện về “{query}”</h2><NewsFeed initialPosts={posts} initialViewerPetId={viewer} query={query} showComposer={false} /></section>}
    </div>
  );
}
