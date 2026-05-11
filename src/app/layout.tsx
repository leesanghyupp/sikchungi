import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://sikchungi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "식충이 — 음식 추천 잼민이 친구",
    template: "%s | 식충이",
  },
  description: "뭐 먹지? 30초 만에 음식 3개 골라주는 잼민이 AI 친구 🤤",
  applicationName: "식충이",
  keywords: ["음식 추천", "점심 메뉴", "저녁 메뉴", "AI", "식충이", "Gemini"],
  authors: [{ name: "leesanghyupp", url: "https://github.com/leesanghyupp" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "식충이",
    title: "식충이 — 뭐 먹지? 잼민이가 골라줌 🤤",
    description: "30초 만에 음식 3개 골라주는 잼민이 AI 친구. 점심·저녁·야식까지 ㄱㄱ 🔥",
    images: [
      {
        url: "/mascot.svg",
        width: 512,
        height: 512,
        alt: "식충이 마스코트",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "식충이 — 뭐 먹지? 🤤",
    description: "30초 만에 음식 3개 골라주는 잼민이 AI 친구 🔥",
    images: ["/mascot.svg"],
  },
  icons: {
    icon: "/mascot.svg",
    apple: "/mascot.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF8C42",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
