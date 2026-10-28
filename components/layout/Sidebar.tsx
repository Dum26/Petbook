"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PawPrint, Plus, Bell, Settings, Heart, History, ArrowUpRight } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { usePet } from "@/lib/context/PetContext";

const links = [
  { href: "/", label: "Bảng tin", icon: Home },
  { href: "/explore", label: "Khám phá", icon: Compass },
  { href: "/my-pets", label: "Thú cưng của tôi", icon: PawPrint },
  { href: "/notifications", label: "Thông báo", icon: Bell },
  { href: "/memories", label: "Hộp kỷ niệm", icon: History },
];
export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, myPets, activePet, setActivePet } = usePet();
  return (
    <aside className="desktop-rail hidden lg:block w-[218px] xl:w-[224px] shrink-0 space-y-6 sticky top-[104px] self-start">
      <div>
        <p className="eyebrow px-4 mb-3">Góc nhỏ của bạn</p>
        <nav className="space-y-1" aria-label="Điều hướng bảng tin">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className="sidebar-nav-link"><Icon size={19} strokeWidth={1.7} />{label}</Link>)}
        </nav>
      </div>

      {user && activePet && (
        <section className="social-card !p-4 space-y-4">
          <div className="flex items-center justify-between"><p className="eyebrow">Boss đang chọn</p><Link href="/pet/new" aria-label="Thêm thú cưng" className="text-brown-soft hover:text-orange-deep"><Plus size={17} /></Link></div>
          <Link href={"/pet/" + activePet.slug} className="flex items-center gap-3">
            <Avatar src={activePet.avatar_url} alt={activePet.name} size="md" />
            <div className="min-w-0"><h2 className="font-bold text-sm truncate">{activePet.name}</h2><p className="text-[11px] text-brown-soft truncate">Được yêu bởi {profile?.display_name || "bạn"}</p></div>
          </Link>
          <div className="flex gap-5 text-xs border-t border-brown-border pt-3"><span><b className="block text-base">{activePet.follower_count}</b><span className="text-brown-soft">người theo dõi</span></span><span><b className="block text-base">{activePet.following_count}</b><span className="text-brown-soft">đang theo dõi</span></span></div>
          {myPets.length > 1 && <div className="flex gap-2 border-t border-brown-border pt-3">{myPets.map(pet => <button key={pet.id} title={"Chọn " + pet.name} aria-label={"Chọn " + pet.name} aria-pressed={pet.id === activePet.id} onClick={() => setActivePet(pet)} className={pet.id === activePet.id ? "rounded-full ring-2 ring-orange-deep ring-offset-2" : "rounded-full"}><Avatar src={pet.avatar_url} alt={pet.name} size="xs" /></button>)}</div>}
        </section>
      )}

      <div className="rounded-3xl bg-[#344C3D] text-white p-5 relative overflow-hidden">
        <Heart size={23} strokeWidth={1.5} className="text-[#D9BFA0] mb-4" />
        <h2 className="font-display text-lg font-bold leading-snug tracking-tight">Mỗi boss đều có<br />một câu chuyện.</h2>
        <p className="text-xs leading-relaxed text-[#D4DFD1] mt-2 mb-4">Dành một góc nhỏ cho những điều đáng yêu của riêng bạn.</p>
        <Link href={user ? "/pet/new" : "/register"} className="inline-flex items-center gap-2 text-xs font-bold text-[#F5D8BD]">{user ? "Thêm một người bạn" : "Bắt đầu câu chuyện"}<ArrowUpRight size={15} /></Link>
        <PawPrint size={88} className="absolute -bottom-4 -right-5 text-white/[0.05] -rotate-12 pointer-events-none" />
      </div>
      <div className="px-4 space-y-4"><Link href="/settings" className="inline-flex items-center gap-3 text-xs font-semibold text-brown-soft hover:text-brown-dark"><Settings size={16} />Cài đặt tài khoản</Link><p className="text-[10px] leading-relaxed text-brown-muted">PetBook © {new Date().getFullYear()}<br />Một cộng đồng, thật nhiều yêu thương.</p></div>
    </aside>
  );
}
