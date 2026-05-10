import type { Metadata } from "next";
import { Nunito_Sans, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import FloatingSidebar from "@/components/layout/FloatingSidebar";
import AuthModal from "@/components/layout/AuthModal";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "TitliAnime — Watch Anime Online",
    template: "%s | TitliAnime",
  },
  description:
    "Stream thousands of anime series and movies in HD. Track your progress with MAL & AniList integration.",
  keywords: ["anime", "watch anime", "streaming", "manga", "TitliAnime"],
  openGraph: {
    title: "TitliAnime",
    description: "Premium anime streaming platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark h-full antialiased ${nunitoSans.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-dvh bg-[#080808] text-white overflow-x-hidden"
        suppressHydrationWarning
      >
        <FloatingSidebar />
        <Header />
        <main className="min-h-dvh">{children}</main>
        <AuthModal />
      </body>
    </html>
  );
}
