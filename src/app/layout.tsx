import type { Metadata } from 'next'
import './globals.css'
import JsonLd from './components/seo/JsonLd'
import { SITE_CONFIG, OPEN_GRAPH, TWITTER_CARD, PAGE_METADATA } from './lib/seo-config'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: PAGE_METADATA.home.title,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: PAGE_METADATA.home.description,
  keywords: [...PAGE_METADATA.home.keywords],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    ...OPEN_GRAPH,
    title: PAGE_METADATA.home.title,
    description: PAGE_METADATA.home.description,
    url: SITE_CONFIG.url,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    ...TWITTER_CARD,
    title: PAGE_METADATA.home.title,
    description: PAGE_METADATA.home.description,
    images: [SITE_CONFIG.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  alternates: {
    canonical: SITE_CONFIG.url,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <JsonLd type="organization" />
        <JsonLd type="softwareApplication" />
        <JsonLd type="faq" />
        <JsonLd type="howTo" />
      </head>
      <body>{children}</body>
    </html>
  )
}
