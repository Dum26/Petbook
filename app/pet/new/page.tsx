import React from "react";
import { PetForm } from "@/components/pet/PetForm";
import { getCurrentUser } from "@/lib/petbook-service";
import { redirect } from "next/navigation";
import { Sparkles, PawPrint } from "lucide-react";

export default async function NewPetPage() {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-pastel/25 text-orange-deep text-xs font-black">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>THÀNH VIÊN MỚI TRONG GIA ĐÌNH</span>
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brown-dark">
          Tạo Hồ Sơ Boss Thú Cưng 🐾
        </h1>
        <p className="text-xs sm:text-sm text-brown-wood max-w-md mx-auto">
          Điền thông tin và đăng ảnh bé cưng của bạn để nhận thẻ công dân PetBook và kết nối với bạn bè khắp nơi!
        </p>
      </div>

      <PetForm />
    </div>
  );
}
