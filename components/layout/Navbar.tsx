"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PawPrint, Home, Compass, Bell, Search, ChevronDown, LogOut, Plus, ArrowUpRight, Settings, History } from "lucide-react";
import { usePet } from "@/lib/context/PetContext";
import { Avatar } from "@/components/shared/Avatar";
import { logoutAction } from "@/app/actions/petbook";
import { NotificationBadge } from "./NotificationBadge";

const mobileLinks = [
  { href: "/", label: "Bảng tin", icon: Home },
  { href: "/explore", label: "Khám phá", icon: Compass },
  { href: "/#create-post", label: "Đăng bài", icon: Plus },
  { href: "/notifications", label: "Thông báo", icon: Bell },
  { href: "/my-pets", label: "Boss của tôi", icon: PawPrint },
];
export function Navbar() {
  const pathname = usePathname();
  const { user, profile, myPets, activePet, setActivePet } = usePet();
  const [menu, setMenu] = useState(false);
  return (
    <>
      <header className="site-header sticky top-0 z-40">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 xl:px-8 h-16 lg:h-20 flex items-center gap-3 sm:gap-5 lg:gap-10">
          <Link href="/" aria-label="PetBook — về bảng tin" className="flex items-center gap-2.5 shrink-0 lg:w-[218px] xl:w-[224px]">
            <span className="brand-mark w-10 h-10 grid place-items-center"><PawPrint size={23} strokeWidth={2} /></span>
            <span className="font-display font-bold text-[24px] sm:text-[26px] tracking-[-.065em]">petbook<span className="text-orange-deep">.</span></span>
          </Link>
          <form action="/explore" className="header-search hidden md:flex rounded-full items-center gap-3 px-4 py-2.5 flex-1 max-w-[440px] transition-colors">
            <Search size={17} strokeWidth={1.7} className="text-brown-soft shrink-0" />
            <input type="search" name="q" maxLength={100} aria-label="Tìm boss hoặc bài viết" placeholder="Tìm một người bạn, một câu chuyện…" className="min-w-0 w-full bg-transparent text-[13px] outline-none placeholder:text-brown-soft" />
          </form>
          <div className="flex items-center gap-2 sm:gap-4 ml-auto min-w-0">
            <Link href="/explore" aria-label="Khám phá cộng đồng" className="social-icon-button hidden sm:grid"><Compass size={21} strokeWidth={1.6} /></Link>
            {user ? (
              <>
                <Link href="/notifications" aria-label="Thông báo" className="social-icon-button relative hidden sm:grid"><Bell size={21} strokeWidth={1.6} /><span className="absolute -top-1 -right-1"><NotificationBadge /></span></Link>
                {myPets.length > 0 && <select aria-label="Đang sử dụng hồ sơ boss" value={activePet?.id || ""} onChange={event => setActivePet(myPets.find(pet => pet.id === event.target.value) || null)} className="bg-transparent border-l border-brown-border pl-2 py-2 text-xs font-bold max-w-[78px] sm:max-w-[120px] outline-none">{myPets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select>}
                <div className="relative" onKeyDown={event => { if (event.key === "Escape") setMenu(false); }}>
                  <button onClick={() => setMenu(!menu)} aria-label="Mở menu tài khoản" aria-expanded={menu} className="flex items-center gap-1.5"><Avatar size="sm" src={profile?.avatar_url} alt={profile?.display_name || "Tài khoản"} /><ChevronDown size={13} className="text-brown-soft hidden sm:block" /></button>
                  {menu && (
                    <>
                      <button aria-label="Đóng menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setMenu(false)} />
                      <div className="absolute top-full right-0 mt-5 w-64 z-50 social-card !p-3 shadow-xl">
                        <div className="px-3 py-3 mb-1 border-b border-brown-border"><p className="font-bold text-sm truncate">{profile?.display_name}</p><p className="text-xs text-brown-soft truncate mt-1">@{profile?.username}</p></div>
                        {[
                          { href: "/my-pets", label: "Thú cưng của tôi", icon: PawPrint },
                          { href: "/pet/new", label: "Thêm một boss", icon: Plus },
                          { href: "/memories", label: "Hộp kỷ niệm", icon: History },
                          { href: "/settings", label: "Cài đặt tài khoản", icon: Settings },
                        ].map(item => <Link key={item.href} href={item.href} onClick={() => setMenu(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-semibold hover:bg-cream-100"><item.icon size={17} className="text-brown-soft" />{item.label}</Link>)}
                        <form action={logoutAction} className="border-t border-brown-border mt-1 pt-1"><button className="w-full text-left px-3 py-3 text-orange-deep text-[13px] font-bold flex gap-3 items-center"><LogOut size={17} />Đăng xuất</button></form>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : <><Link href="/login" className="text-[13px] font-bold hidden sm:block">Đăng nhập</Link><Link href="/register" className="social-button !px-4 !py-2 !min-h-10 !text-xs">Tham gia<span className="hidden sm:inline">ngay</span><ArrowUpRight size={15} /></Link></>}
          </div>
        </div>
      </header>
      <nav aria-label="Điều hướng trên điện thoại" className="fixed bottom-0 inset-x-0 z-40 border-t border-brown-border flex justify-around lg:hidden mobile-nav">
        {mobileLinks.map(item => {
          const posting = item.icon === Plus;
          return <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`flex flex-col gap-1.5 items-center px-2 pt-3 pb-2.5 text-[10px] font-bold min-w-12 ${pathname === item.href ? "text-orange-deep" : "text-brown-soft"}`}>
            <span className={posting ? "w-11 h-11 -mt-6 mb-1 rounded-2xl grid place-items-center bg-orange-deep text-white border-4 border-cream-50 shadow-sm" : "relative"}><item.icon size={21} strokeWidth={1.8} />{item.href === "/notifications" && user && <span className="absolute -top-2 -right-3"><NotificationBadge /></span>}</span>{item.label}
          </Link>;
        })}
      </nav>
    </>
  );
}
