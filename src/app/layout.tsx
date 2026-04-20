import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PetCare Hub",
  description: "宠物洗护店预约与复购管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
