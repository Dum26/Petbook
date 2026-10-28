"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  Upload,
  Save,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { Pet, PetSpecies, PetGender } from "@/types/petbook";
import { savePetAction } from "@/app/actions/petbook";
import { useTranslation } from "@/lib/i18n";
import { usePet } from "@/lib/context/PetContext";

interface PetFormProps {
  initialPet?: Pet | null;
}

export function PetForm({ initialPet }: PetFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { setActivePet } = usePet();

  const [name, setName] = useState(initialPet?.name || "");
  const [species, setSpecies] = useState<PetSpecies>(initialPet?.species || "dog");
  const [breed, setBreed] = useState(initialPet?.breed || "");
  const [gender, setGender] = useState<PetGender>(initialPet?.gender || "male");
  const [birthday, setBirthday] = useState(initialPet?.birthday || "");
  const [bio, setBio] = useState(initialPet?.bio || "");
  const [personalityInput, setPersonalityInput] = useState(
    initialPet?.personality ? initialPet.personality.join(", ") : ""
  );
  const [avatarUrl, setAvatarUrl] = useState(initialPet?.avatar_url || "");
  const [coverUrl, setCoverUrl] = useState(initialPet?.cover_url || "");

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, type: "avatar" | "cover") => {
    if (type === "avatar") setIsUploadingAvatar(true);
    else setIsUploadingCover(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Tải ảnh thất bại.");
      }

      const url = data.url || data.storage_path;
      if (type === "avatar") setAvatarUrl(url);
      else setCoverUrl(url);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi tải ảnh lên.");
    } finally {
      if (type === "avatar") setIsUploadingAvatar(false);
      else setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập tên cho Boss!");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const personalityArray = personalityInput
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      const res = await savePetAction({
        id: initialPet?.id,
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        gender,
        birthday: birthday || null,
        bio: bio.trim() || null,
        personality: personalityArray,
        avatar_url: avatarUrl || null,
        cover_url: coverUrl || null,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      if (res?.pet) {
        setActivePet(res.pet);
        router.push(`/pet/${res.pet.slug}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi lưu hồ sơ boss.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <p className="text-xs text-brown-wood">Ảnh đại diện và ảnh bìa của boss được hiển thị công khai.</p>
      {/* Cover and Avatar Uploader */}
      <div className="rounded-3xl overflow-hidden bg-white border border-brown-border/60 shadow-sm relative">
        {/* Cover Preview */}
        <div className="relative w-full h-44 sm:h-52 bg-gradient-to-r from-orange-pastel/30 via-cream-200 to-pink-soft/30 flex items-center justify-center">
          {coverUrl && (
            <Image
              src={coverUrl}
              alt="Cover preview"
              fill
              unoptimized
              className="object-cover"
            />
          )}

          <input
            type="file"
            ref={coverInputRef}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "cover");
            }}
            className="hidden"
          />

          <button
            type="button"
            disabled={isUploadingCover}
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-brown-dark text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-orange-deep" />
            <span>{isUploadingCover ? "Đang tải ảnh..." : t("form_pet_cover")}</span>
          </button>
        </div>

        {/* Avatar Uploader */}
        <div className="px-6 pb-6 -mt-14 relative flex items-end justify-between gap-4">
          <div className="relative">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-polaroid bg-cream-200 flex items-center justify-center text-3xl">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span>🐾</span>
              )}
            </div>

            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "avatar");
              }}
              className="hidden"
            />

            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-orange-deep hover:bg-orange-hover text-white shadow-md cursor-pointer disabled:opacity-50"
              title="Tải ảnh đại diện"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Details Box */}
      <div className="p-6 rounded-3xl bg-white border border-brown-border/60 shadow-sm space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-100 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Name & Species */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-brown-dark uppercase tracking-wider mb-1">
              {t("form_pet_name")} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="vd: Bò, Gấu, Miu, Mochi..."
              className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-brown-border/60 focus:border-orange-deep focus:bg-white text-xs sm:text-sm font-bold text-brown-dark focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-brown-dark uppercase tracking-wider mb-1">
              {t("form_pet_species")} *
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-brown-border/60 focus:border-orange-deep focus:bg-white text-xs sm:text-sm font-bold text-brown-dark focus:outline-none transition-colors cursor-pointer"
            >
              <option value="dog">{t("form_pet_species_dog")}</option>
              <option value="cat">{t("form_pet_species_cat")}</option>
              <option value="bird">{t("form_pet_species_bird")}</option>
              <option value="hamster">{t("form_pet_species_hamster")}</option>
              <option value="rabbit">{t("form_pet_species_rabbit")}</option>
              <option value="other">{t("form_pet_species_other")}</option>
            </select>
          </div>
        </div>

        {/* Breed & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-brown-dark uppercase tracking-wider mb-1">
              {t("form_pet_breed")}
            </label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="vd: Corgi lai Golden, Poodle xù, Mèo Anh lông ngắn..."
              className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-brown-border/60 focus:border-orange-deep focus:bg-white text-xs sm:text-sm text-brown-dark focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-brown-dark uppercase tracking-wider mb-1">
              {t("pet_gender")}
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-brown-border/60 focus:border-orange-deep focus:bg-white text-xs sm:text-sm font-bold text-brown-dark focus:outline-none transition-colors cursor-pointer"
            >
              <option value="male">{t("pet_gender_male")}</option>
              <option value="female">{t("pet_gender_female")}</option>
            </select>
          </div>
        </div>

        {/* Birthday */}
        <div>
          <label className="block text-xs font-black text-brown-dark uppercase tracking-wider mb-1">
            {t("form_pet_birthday")}
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-brown-border/60 focus:border-orange-deep focus:bg-white text-xs sm:text-sm font-bold text-brown-dark focus:outline-none transition-colors cursor-pointer"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-black text-brown-dark uppercase tracking-wider mb-1">
            {t("form_pet_bio")}
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Kể về tính cách, sở thích, câu chuyện vui về bé cưng của bạn..."
            className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-brown-border/60 focus:border-orange-deep focus:bg-white text-xs sm:text-sm text-brown-dark focus:outline-none resize-none transition-colors"
          />
        </div>

        {/* Personality Tags */}
        <div>
          <label className="block text-xs font-black text-brown-dark uppercase tracking-wider mb-1">
            {t("pet_personality")}
          </label>
          <input
            type="text"
            value={personalityInput}
            onChange={(e) => setPersonalityInput(e.target.value)}
            placeholder={t("form_pet_personality_hints")}
            className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-brown-border/60 focus:border-orange-deep focus:bg-white text-xs sm:text-sm text-brown-dark focus:outline-none transition-colors"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving || isUploadingAvatar || isUploadingCover}
            className="w-full py-3.5 rounded-2xl bg-orange-deep hover:bg-orange-hover text-white font-display font-extrabold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? t("form_saving") : t("form_btn_save")}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
