"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Gift, History, Sparkles } from "lucide-react";
import { Pet } from "@/types/petbook";
import { Avatar } from "@/components/shared/Avatar";
import { FollowButton } from "@/components/pet/FollowButton";
import { birthdayDaysAway } from "@/lib/social-validation";

export function RightPanel({ suggestedPets = [], birthdayPets = [] }: { suggestedPets?: Pet[]; birthdayPets?: Pet[] }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const birthdays = [...birthdayPets].sort((a, b) => birthdayDaysAway(a.birthday!, today) - birthdayDaysAway(b.birthday!, today));
  return (
    <aside className="desktop-rail hidden xl:block w-[276px] shrink-0 space-y-5 sticky top-[104px] self-start">
      {suggestedPets.length > 0 && <section className="social-card !p-5 space-y-5">
        <div className="flex items-center justify-between"><h2 className="panel-heading">Có thể bạn sẽ thích</h2><Sparkles size={17} className="text-[#BCA47D]" strokeWidth={1.6} /></div>
        <div className="space-y-5">{suggestedPets.map(pet => <div key={pet.id} className="flex items-center gap-2.5">
          <Link href={"/pet/" + pet.slug} className="flex items-center gap-2.5 min-w-0 flex-1"><Avatar src={pet.avatar_url} alt={pet.name} size="sm" /><div className="min-w-0"><p className="text-[13px] font-bold truncate">{pet.name}</p><p className="text-[10px] text-brown-soft mt-0.5 truncate">{pet.breed || (pet.species === "cat" ? "Một chiếc mèo" : "Một người bạn nhỏ")}</p></div></Link>
          <FollowButton targetId={pet.id} compact />
        </div>)}</div>
        <Link href="/explore" className="flex items-center justify-between border-t border-brown-border pt-4 muted-link">Khám phá thêm bạn mới<ArrowRight size={15} /></Link>
      </section>}

      <section className="social-card !p-5 space-y-4">
        <div className="flex items-center gap-2.5"><span className="grid place-items-center rounded-xl w-8 h-8 bg-[#F7EEDF] text-[#A78955]"><Gift size={17} strokeWidth={1.7} /></span><h2 className="panel-heading">Sắp đến ngày đặc biệt</h2></div>
        {birthdays.length ? birthdays.map(pet => <Link key={pet.id} href={"/pet/" + pet.slug} className="flex items-center gap-3"><Avatar src={pet.avatar_url} alt={pet.name} size="sm" /><div><p className="text-sm font-bold">{pet.name}</p><p className="text-xs text-brown-soft mt-1">{birthdayDaysAway(pet.birthday!, today) === 0 ? "Sinh nhật hôm nay!" : "Sinh nhật sau " + birthdayDaysAway(pet.birthday!, today) + " ngày"}</p></div></Link>) :
          <p className="text-xs leading-7 text-brown-soft">Thêm ngày sinh cho boss để mỗi dịp đặc biệt đều được nhớ đến.</p>}
        {!birthdays.length && <Link href="/my-pets" className="muted-link inline-flex items-center gap-1">Ghé thăm các boss<ArrowUpRight size={13} /></Link>}
      </section>

      <Link href="/memories" className="memory-panel rounded-3xl p-5 block group relative overflow-hidden">
        <span className="eyebrow !text-[#756044]">Chiếc hộp thời gian</span>
        <div className="w-12 h-12 rounded-2xl bg-white/60 grid place-items-center text-[#A58254] mt-5 mb-4 -rotate-6 group-hover:rotate-0 transition-transform"><History size={26} strokeWidth={1.4} /></div>
        <h2 className="font-display font-bold text-xl tracking-tight text-[#71583E]">Ngày này,<br />năm ấy.</h2>
        <p className="text-xs leading-relaxed text-[#725E46] mt-2 pr-6">Có những khoảnh khắc,<br />nhớ lại vẫn thấy thương.</p>
        <span className="mt-5 inline-flex gap-2 items-center text-xs font-bold text-[#795A3E]">Mở hộp kỷ niệm<ArrowUpRight size={15} /></span>
        <span className="absolute -right-5 bottom-4 text-[100px] leading-none font-display text-[#DECBB2]/50 pointer-events-none" aria-hidden="true">♡</span>
      </Link>
      <p className="px-2 text-[10px] leading-6 text-brown-muted">Những chiếc chân nhỏ. Những câu chuyện lớn.<br />Được làm với yêu thương, dành cho các boss.</p>
    </aside>
  );
}
