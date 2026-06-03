import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bright Data 프리미엄 검색 API 데모",
  description: "Bright Data SERP API로 직접 조립하는 프리미엄 검색 API 파이프라인",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
