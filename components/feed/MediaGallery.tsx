"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PostMedia } from "@/types/petbook";
export function MediaGallery({ media, title }: { media: PostMedia[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const isOpen = index !== null;
  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keys = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") setIndex(i => i === null ? null : (i + media.length - 1) % media.length);
      if (event.key === "ArrowRight") setIndex(i => i === null ? null : (i + 1) % media.length);
    };
    window.addEventListener("keydown", keys);
    return () => { element?.close(); document.body.style.overflow = previous; window.removeEventListener("keydown", keys); };
  }, [isOpen, media.length]);
  if (!media.length) return null;
  return <>
    <div className={media.length === 1 ? "post-media overflow-hidden" : "post-media grid grid-cols-2 gap-1 overflow-hidden"}>
      {media.map((item, i) => item.media_type === "video" ?
        <video key={item.id} src={item.url} controls preload="metadata" playsInline className="w-full max-h-[480px] bg-[#E9EDE4]" /> :
        <button key={item.id} onClick={() => setIndex(i)} aria-label={"Mở ảnh " + (i + 1)} className="block w-full bg-cream-100"><Image src={item.url} alt={title + " · ảnh " + (i + 1)} width={1200} height={900} unoptimized className={media.length === 1 ? "w-full max-h-[520px] object-contain" : "w-full aspect-square object-cover"} /></button>)}
    </div>
    {index !== null && <dialog ref={dialog} aria-label={title} onCancel={() => setIndex(null)} className="media-dialog" onClick={event => { if (event.target === event.currentTarget) setIndex(null); }}>
      <div className="flex justify-between items-center gap-4 p-4 text-white"><p>{index + 1} / {media.length}</p><button onClick={() => setIndex(null)} className="px-4 py-2 rounded-xl bg-white/20" aria-label="Đóng ảnh">Đóng ✕</button></div>
      {media[index].media_type === "video" ? <video key={media[index].url} src={media[index].url} controls autoPlay className="max-h-[70vh] w-full" /> : <Image src={media[index].url} alt={title} width={1600} height={1200} unoptimized className="max-h-[70vh] w-full object-contain" />}
      {media.length > 1 && <div className="flex justify-between p-4 text-white"><button aria-label="Ảnh trước" onClick={() => setIndex((index + media.length - 1) % media.length)}>← Trước</button><button aria-label="Ảnh sau" onClick={() => setIndex((index + 1) % media.length)}>Sau →</button></div>}
    </dialog>}
  </>;
}
