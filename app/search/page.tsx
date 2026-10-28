import { redirect } from "next/navigation";
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  redirect("/explore?q=" + encodeURIComponent((await searchParams).q || ""));
}
