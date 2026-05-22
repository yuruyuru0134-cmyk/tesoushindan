import type { Metadata } from "next";
import { Noto_Serif_JP, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "手相診てみます",
  description: "手のひら画像をアップロードして、AIが手相を丁寧に診断します。",
  openGraph: {
    title: "手相診てみます",
    description: "手のひら画像をアップロードして、AIが手相を丁寧に診断します。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSerifJP.variable} ${cormorantGaramond.variable} dark`}>
      <body className="antialiased min-h-screen font-[family-name:var(--font-noto-serif-jp)]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
