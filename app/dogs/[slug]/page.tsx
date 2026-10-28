import { redirect } from "next/navigation";
export default async function LegacyDogPage({ params }: { params: Promise<{ slug: string }> }) { redirect("/pet/" + encodeURIComponent((await params).slug)); }
