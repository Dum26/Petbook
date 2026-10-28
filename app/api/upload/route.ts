import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { detectMedia } from "@/lib/media";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập để tải tệp." }, { status: 401 });
  if (Number(req.headers.get("content-length")) > 51 * 1024 * 1024) return NextResponse.json({ error: "Tệp tối đa 50MB." }, { status: 413 });
  try {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File) || !file.size || file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Chọn tệp từ 1 byte đến 50MB." }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const media = detectMedia(bytes);
    if (!media) return NextResponse.json({ error: "Hỗ trợ JPG, PNG, GIF, WebP, MP4, MOV và WebM. Hãy chuyển HEIC sang JPG trước khi tải." }, { status: 400 });
    const storagePath = user.id + "/" + randomUUID() + "." + media.extension;
    const { error } = await supabase.storage.from("petbook-private").upload(storagePath, bytes, { contentType: media.mime, upsert: false });
    if (error) throw error;
    return NextResponse.json({ url: "/api/media/" + storagePath, storage_path: storagePath, media_type: media.type, mime_type: media.mime, file_size: file.size });
  } catch {
    return NextResponse.json({ error: "Chưa tải được tệp. Vui lòng kiểm tra kết nối và thử lại." }, { status: 500 });
  }
}
