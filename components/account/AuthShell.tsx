import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { PetSketch } from "@/components/brand/PetSketch";

export function AuthShell({ title, description, children, footer, footerHref }: {
  title: string; description: string; children: ReactNode; footer: string; footerHref: string;
}) {
  return (
    <div className="auth-layout">
      <aside className="auth-editorial">
        <div><p className="eyebrow !text-[#52664D] mb-5">Nơi những chiếc đuôi kể chuyện</p><h2>Những điều nhỏ xíu.<br /><span className="text-[#6E8763]">Thương thật là nhiều.</span></h2><p className="text-sm leading-7 text-[#53694B] mt-5 max-w-xs">Lưu giữ một khoảnh khắc, kết nối một người bạn. Cùng viết nên câu chuyện của boss nhà mình.</p></div>
        <PetSketch className="auth-art" />
        <p className="flex gap-2 items-center text-xs text-[#52664D]"><Heart size={14} />Dành cho thú cưng. Dành cho những người thương chúng.</p>
      </aside>
      <section className="auth-form-panel">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-brown-soft mb-8 hover:text-orange-deep"><ArrowLeft size={14} />Về ngôi nhà PetBook</Link>
        <p className="eyebrow mb-3">Chào mừng đến với PetBook</p>
        <h1 className="font-display font-bold text-3xl tracking-[-.05em] leading-tight">{title}</h1>
        <p className="text-sm text-brown-soft leading-7 mt-3 mb-8">{description}</p>
        {children}
        <div className="border-t border-brown-border mt-7 pt-6"><Link href={footerHref} className="text-sm font-semibold text-orange-deep hover:underline">{footer}</Link></div>
      </section>
    </div>
  );
}
