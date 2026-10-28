import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { LanguageProvider } from "@/lib/i18n";
import { PetProvider } from "@/lib/context/PetContext";
import { getCurrentUser, getActivePetId } from "@/lib/petbook-service";

export const dynamic = "force-dynamic";

const quicksand = Quicksand({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PetBook 🐾 — Mạng xã hội dành riêng cho các boss thú cưng",
  description: "Mạng xã hội dành cho thú cưng. Tạo hồ sơ cho boss, chia sẻ ảnh và video, lưu giữ kỷ niệm và kết nối cùng những người bạn mới.",
  keywords: ["petbook", "mạng xã hội thú cưng", "pet social network", "chó mèo", "thú cưng việt nam"],
  openGraph: {
    title: "PetBook 🐾 — Mạng xã hội cho các boss thú cưng",
    description: "Nơi các boss chia sẻ câu chuyện hàng ngày, kết bạn và thả tim cho nhau!",
    type: "website",
    locale: "vi_VN",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F5F1",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile, pets } = await getCurrentUser();
  const activePetId = await getActivePetId();

  return (
    <html lang="vi" className={quicksand.variable}>
      <body className="min-h-screen flex flex-col bg-cream-50 text-brown-dark antialiased selection:bg-orange-pastel selection:text-brown-dark font-sans pb-20 lg:pb-0">
        <LanguageProvider>
          <PetProvider
            initialUser={user}
            initialProfile={profile}
            initialPets={pets}
            initialActivePetId={activePetId}
          >
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
          </PetProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
