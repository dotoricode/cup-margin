import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "컵마진 | 한 잔 팔면 진짜 얼마 남을까요?",
  description: "카페 사장님이 메뉴별 원가, 포장비, 수수료, 폐기율을 넣어 한 잔당 진짜 마진을 확인하는 무료 계산기 MVP입니다.",
  other: {
    "build-time": new Date().toISOString(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
