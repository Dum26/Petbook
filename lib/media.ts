export function detectMedia(bytes: Uint8Array): { type: "image" | "video"; extension: string; mime: string } | null {
  const hex = Array.from(bytes.slice(0, 12), b => b.toString(16).padStart(2, "0")).join("");
  const text = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  if (hex.startsWith("ffd8ff")) return { type: "image", extension: "jpg", mime: "image/jpeg" };
  if (hex.startsWith("89504e470d0a1a0a")) return { type: "image", extension: "png", mime: "image/png" };
  if (["GIF87a", "GIF89a"].includes(text(0, 6))) return { type: "image", extension: "gif", mime: "image/gif" };
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return { type: "image", extension: "webp", mime: "image/webp" };
  if (hex.startsWith("1a45dfa3") && text(0, Math.min(bytes.length, 4096)).includes("webm")) return { type: "video", extension: "webm", mime: "video/webm" };
  if (text(4, 8) === "ftyp") {
    const brand = text(8, 12);
    if (brand === "qt  ") return { type: "video", extension: "mov", mime: "video/quicktime" };
    if (["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "MSNV"].includes(brand)) return { type: "video", extension: "mp4", mime: "video/mp4" };
  }
  return null;
}
