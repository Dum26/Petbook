import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getPetBySlug, getPetById } from "@/lib/petbook-service";
import { PetForm } from "@/components/pet/PetForm";

interface EditPetPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPetPage({ params }: EditPetPageProps) {
  const { id } = await params;
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let pet = await getPetBySlug(id);
  if (!pet) {
    pet = await getPetById(id);
  }

  if (!pet) {
    notFound();
  }

  if (pet.owner_id !== user.id) {
    redirect(`/pet/${pet.slug}`);
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brown-dark">
          Chỉnh Sửa Hồ Sơ: {pet.name} 🐾
        </h1>
        <p className="text-xs sm:text-sm text-brown-wood">
          Cập nhật ảnh đại diện, ảnh bìa và thông tin của bé cưng
        </p>
      </div>

      <PetForm initialPet={pet} />
    </div>
  );
}
