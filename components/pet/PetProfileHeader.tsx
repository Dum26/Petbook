"use client";
import Link from "next/link";
import Image from "next/image";
import { Pet } from "@/types/petbook";
import { Avatar } from "@/components/shared/Avatar";
import { FollowButton } from "./FollowButton";
import { speciesLabels } from "@/lib/social-validation";
import { PetSketch } from "@/components/brand/PetSketch";
export function PetProfileHeader({ pet, isOwner }: { pet: Pet; isOwner: boolean }) {
  return <section className="rounded-3xl overflow-hidden bg-white border border-brown-border">
    <div className="relative h-44 sm:h-64 bg-[#E2EADB] overflow-hidden">{pet.cover_url ? <Image src={pet.cover_url} alt={"Ảnh bìa " + pet.name} fill unoptimized className="object-cover" /> : <><div className="absolute top-7 left-7 sm:left-10"><p className="eyebrow !text-[#5D7354]">Một góc nhỏ, thật nhiều yêu thương.</p><p className="font-display text-2xl sm:text-3xl font-bold text-[#587153] tracking-tight mt-3">Nhà của {pet.name}.</p></div><PetSketch className="absolute -bottom-5 -right-4 w-52 sm:w-72" /></>}</div>
    <div className="px-5 sm:px-8 pb-7 space-y-5">
      <div className="flex items-end justify-between gap-4 -mt-12 relative"><Avatar src={pet.avatar_url} alt={pet.name} size="xl" className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-white shadow-sm" />{isOwner ? <Link href={`/pet/${pet.slug}/edit`} className="social-button-secondary">Sửa hồ sơ</Link> : <FollowButton targetId={pet.id} initialFollowing={pet.is_following} />}</div>
      <div><div className="flex flex-wrap items-center gap-3"><h1 className="font-display font-bold text-3xl sm:text-4xl tracking-[-.05em]">{pet.name}</h1><span className="text-[11px] font-bold rounded-full px-3 py-1 bg-cream-100 text-brown-wood">{speciesLabels[pet.species]}</span></div><p className="text-xs text-brown-soft mt-3">{pet.breed || "Một người bạn đáng yêu"}{pet.owner?.username ? " · Được yêu bởi @" + pet.owner.username : ""}</p></div>
      {pet.bio && <p className="text-sm whitespace-pre-wrap">{pet.bio}</p>}
      {pet.birthday && <p className="text-sm text-brown-wood">🎂 Sinh ngày {new Date(pet.birthday).toLocaleDateString("vi-VN", { timeZone: "Asia/Bangkok" })}</p>}
      {!!pet.personality?.length && <div className="flex flex-wrap gap-2">{pet.personality.map(trait => <span key={trait} className="text-xs rounded-full px-3 py-1 bg-cream-100 text-brown-wood">{trait}</span>)}</div>}
      <div className="flex gap-6 border-t border-brown-border/40 pt-4 text-sm"><span><b>{pet.follower_count}</b> người theo dõi</span><span><b>{pet.following_count}</b> Đang theo dõi</span></div>
    </div>
  </section>;
}
