import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Covercast OBS 直播背景编辑器",
  description: "Create and export customizable OBS live room backgrounds.",
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
