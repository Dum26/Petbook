"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Image as ImageIcon,
  Globe,
  Users,
  Lock,
  X,
  Send,
  AlertCircle,
  PawPrint,
  ArrowUpRight,
} from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { useTranslation } from "@/lib/i18n";
import { usePet } from "@/lib/context/PetContext";
import { createPostAction } from "@/app/actions/petbook";
import { Post } from "@/types/petbook";

interface CreatePostProps {
  onPostCreated?: (post: Post) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { t } = useTranslation();
  const { user, myPets, activePet, setActivePet } = usePet();

  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [mediaList, setMediaList] = useState<Array<{ url: string; media_type: "image" | "video"; file_size?: number }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div id="create-post" className="join-card scroll-mt-28">
        <span className="join-card-icon"><PawPrint size={25} strokeWidth={1.6} /></span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-base font-bold tracking-tight">Câu chuyện của boss cũng thuộc về nơi này.</h2>
          <p className="text-xs text-brown-soft leading-relaxed mt-1.5">Một tấm ảnh, một người bạn, một ngày đáng nhớ.</p>
          <div className="flex flex-wrap items-center gap-3 mt-4"><Link href="/register" className="social-button !min-h-10 !py-2 !text-xs">Tham gia PetBook<ArrowUpRight size={14} /></Link><Link href="/login" className="text-xs font-bold text-brown-wood hover:text-orange-deep">Đăng nhập</Link></div>
        </div>
      </div>
    );
  }
  if (myPets.length === 0) {
    return (
      <div id="create-post" className="join-card scroll-mt-28">
        <span className="join-card-icon"><PawPrint size={26} strokeWidth={1.6} /></span>
        <div><h2 className="font-bold text-base">Cùng ra mắt boss nhà bạn nhé.</h2><p className="text-xs text-brown-soft leading-relaxed mt-2">Thêm một hồ sơ nhỏ để bắt đầu chia sẻ những điều đáng yêu.</p><Link href="/pet/new" className="muted-link inline-flex items-center gap-2 mt-3">Tạo hồ sơ thú cưng<ArrowUpRight size={14} /></Link></div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (mediaList.length + files.length > 10) { setErrorMsg("Mỗi bài tối đa 10 ảnh/video."); return; }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Lỗi tải ảnh lên.");
        }

        const url = data.url || data.storage_path;
        const isVideo = data.media_type === "video";

        setMediaList((prev) => [
          ...prev,
          {
            url,
            media_type: isVideo ? "video" : "image",
            file_size: file.size,
          },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi tải tệp tin.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePet) return;
    if (!content.trim() && mediaList.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createPostAction({
        petId: activePet.id,
        content: content.trim(),
        visibility,
        media: mediaList,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      setContent("");
      setMediaList([]);
      if (res?.post && onPostCreated) {
        onPostCreated(res.post);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể đăng bài viết.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="create-post" className="social-card composer space-y-4 scroll-mt-28">
      {/* Top Header: Pet Selector & Visibility */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={activePet?.avatar_url} alt={activePet?.name || "Pet"} size="md" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-brown-soft mb-0.5">
              {t("feed_posting_as")}
            </p>
            {myPets.length > 1 ? (
              <select
                value={activePet?.id}
                onChange={(e) => {
                  const selected = myPets.find((p) => p.id === e.target.value);
                  if (selected) setActivePet(selected);
                }}
                aria-label="Chọn boss đăng bài" className="font-bold text-sm text-brown-dark bg-transparent focus:outline-none cursor-pointer max-w-36"
              >
                {myPets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.breed || p.species})
                  </option>
                ))}
              </select>
            ) : (
              <h4 className="font-display font-extrabold text-sm text-brown-dark truncate">
                {activePet?.name}
              </h4>
            )}
          </div>
        </div>

        {/* Visibility Dropdown */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-100 border border-brown-border/40 text-xs font-bold text-brown-wood">
          {visibility === "public" && <Globe className="w-3 h-3 text-orange-deep" />}
          {visibility === "followers" && <Users className="w-3 h-3 text-orange-deep" />}
          {visibility === "private" && <Lock className="w-3 h-3 text-orange-deep" />}
          <select
            aria-label="Quyền xem bài viết"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            className="bg-transparent focus:outline-none cursor-pointer text-[11px]"
          >
            <option value="public">Công khai 🌍</option>
            <option value="followers">Người theo dõi 🐾</option>
            <option value="private">Chỉ mình tôi 🔒</option>
          </select>
        </div>
      </div>

      {/* Post Textarea */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          aria-label="Nội dung bài viết"
          maxLength={10000}
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("feed_create_placeholder")}
          className="social-input resize-none !p-4 placeholder:font-medium"
        />

        {/* Media Preview Grid */}
        {mediaList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {mediaList.map((item, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-brown-border/60 bg-black/5 group">
                {item.media_type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <Image src={item.url} alt="Upload preview" fill unoptimized className="object-cover" />
                )}
                <button
                  type="button"
                  aria-label={"Bỏ tệp " + (idx + 1)}
                  onClick={() => removeMedia(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-100 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-brown-border">
          {/* File Upload Trigger */}
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              multiple
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-cream-100 text-brown-wood font-semibold text-xs transition-colors disabled:text-brown-muted"
            >
              <ImageIcon className="w-[18px] h-[18px] text-[#718765]" />
              <span>{isUploading ? "Đang tải tệp..." : t("feed_photo_video")}</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading || (!content.trim() && mediaList.length === 0)}
            className="social-button !min-h-10 !py-2 !text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? t("feed_posting") : t("feed_btn_post")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
