import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://covercast.vercel.app"),
  title: {
    default: "Covercast — 直播背景编辑器",
    template: "%s | Covercast",
  },
  description:
    "Covercast 是一款开源的直播室背景编辑器，专为竖屏直播间设计。支持拖拽编辑、SVG 渲染、OBS 浏览器源接入，内置多套场景模板。",
  keywords: [
    "直播背景编辑器",
    "OBS 浏览器源",
    "直播间背景",
    "SVG 编辑器",
    "Covercast",
    "陆向谦实验室",
  ],
  authors: [{ name: "陆向谦实验室", url: "https://www.lulabs.org/zh" }],
  creator: "陆向谦实验室",
  publisher: "陆向谦实验室",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Covercast — 直播背景编辑器",
    description:
      "开源直播室背景编辑器，支持 SVG 渲染与 OBS 浏览器源接入，让直播背景制作变得简单高效。",
    type: "website",
    locale: "zh_CN",
    siteName: "Covercast",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Covercast — 直播背景编辑器",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Covercast — 直播背景编辑器",
    description:
      "开源直播室背景编辑器，支持 SVG 渲染与 OBS 浏览器源接入。",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
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
