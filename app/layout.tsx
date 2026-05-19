import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Covercast 直播背景编辑器",
  description: "Create and export customizable live room backgrounds.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
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
