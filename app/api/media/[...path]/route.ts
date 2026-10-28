import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canReadMedia } from "@/lib/petbook-service";
import { mediaUrl } from "@/lib/social-validation";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  const url = "/api/media/" + path;
  if (!mediaUrl.safeParse(url).success || !path) return new NextResponse(null, { status: 404 });
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!await canReadMedia(url, user?.id || null)) return new NextResponse(null, { status: 404 });
    const { data, error } = await supabase.storage.from("petbook-private").createSignedUrl(path, 60);
    if (error || !data) return new NextResponse(null, { status: 404 });
    const range = req.headers.get("range");
    const response = await fetch(data.signedUrl, { headers: range ? { Range: range } : {}, cache: "no-store" });
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    });
    for (const name of ["content-type", "content-length", "content-range", "accept-ranges"]) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new NextResponse(response.body, { status: response.status, headers });
  } catch { return new NextResponse(null, { status: 503 }); }
}
