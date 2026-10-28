import React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/petbook-service";
import { PlusCircle, PawPrint, Edit3, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";

export default async function MyPetsPage() {
  const { user, pets } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brown-dark flex items-center gap-2">
            <PawPrint className="w-7 h-7 text-orange-deep" />
            <span>Danh Sách Boss Của Bạn 🐾</span>
          </h1>
          <p className="text-xs sm:text-sm text-brown-wood mt-1">
            Quản lý tất cả hồ sơ thú cưng bạn đang nuôi dưỡng ({pets.length} boss).
          </p>
        </div>

        <Link
          href="/pet/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-deep hover:bg-orange-hover text-white text-xs font-black shadow-sm transition-transform hover:scale-105 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Thêm Boss mới</span>
        </Link>
      </div>

      {pets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="rounded-3xl overflow-hidden bg-white border border-brown-border/60 shadow-sm hover:shadow-md transition-all group"
            >
              {/* Pet cover preview */}
              <div className="relative w-full h-28 bg-gradient-to-r from-orange-pastel/30 via-cream-200 to-pink-soft/30">
                {pet.cover_url && (
                  <Image src={pet.cover_url} alt="" fill unoptimized className="object-cover" />
                )}
              </div>

              {/* Body */}
              <div className="p-5 pt-0 relative space-y-3">
                <div className="-mt-10 mb-2">
                  <Avatar
                    src={pet.avatar_url}
                    alt={pet.name}
                    size="lg"
                    className="border-4 border-white shadow-md"
                  />
                </div>

                <div>
                  <h3 className="font-display font-extrabold text-lg text-brown-dark group-hover:text-orange-deep transition-colors">
                    {pet.name}
                  </h3>
                  <p className="text-xs text-orange-deep font-bold mt-0.5">
                    {pet.breed || pet.species}
                  </p>
                  <p className="text-xs text-brown-soft mt-1 line-clamp-2">
                    {pet.bio || "Chưa có lời giới thiệu."}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-brown-soft pt-2 border-t border-brown-border/30">
                  <span>{pet.follower_count || 0} người theo dõi</span>
                  <span>{pet.following_count || 0} đang theo dõi</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/pet/${pet.slug}`}
                    className="flex-1 py-2 text-center rounded-xl bg-orange-pastel/20 hover:bg-orange-pastel/35 text-orange-deep font-bold text-xs transition-colors"
                  >
                    Xem trang
                  </Link>
                  <Link
                    href={`/pet/${pet.slug}/edit`}
                    className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-brown-wood transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-4xl bg-white border border-brown-border/60 text-center space-y-3">
          <span className="text-4xl">🐾</span>
          <h3 className="font-display font-extrabold text-lg text-brown-dark">
            Bạn chưa có thú cưng nào
          </h3>
          <p className="text-xs text-brown-wood">
            Hãy bắt đầu bằng cách tạo hồ sơ cho bé cưng đầu tiên của bạn!
          </p>
          <div className="pt-2">
            <Link
              href="/pet/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-deep hover:bg-orange-hover text-white text-xs font-black shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo hồ sơ ngay</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
