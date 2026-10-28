import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/petbook-service";
import { ProfileSettings } from "@/components/account/ProfileSettings";
import { logoutAction } from "@/app/actions/petbook";
export default async function SettingsPage() {
  const { user, profile } = await getCurrentUser();
  if (!user) redirect("/login");
  return <div className="max-w-2xl mx-auto px-4 py-8 space-y-5"><h1 className="font-display font-bold text-3xl">Tài khoản của bạn</h1><ProfileSettings profile={profile} email={user.email || ""} /><section className="social-card space-y-4"><h2 className="font-display font-bold text-xl">Đăng nhập & bảo mật</h2><Link href="/forgot-password" className="text-sm font-bold text-orange-deep block">Gửi email đổi mật khẩu →</Link><form action={logoutAction}><button className="text-sm font-bold text-red-700">Đăng xuất khỏi PetBook</button></form></section></div>;
}
