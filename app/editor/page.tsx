// This file MUST remain a Server Component — do not add 'use client' here,
// because we export `metadata` which only works in Server Components.
import type { Metadata } from 'next'
import EditorPage from '@/features/editor/components/EditorPage'
import { PAGE_METADATA, SITE_CONFIG, OPEN_GRAPH, TWITTER_CARD } from '@/lib/config/seo'

export const metadata: Metadata = {
  title: PAGE_METADATA.editor.title,
  description: PAGE_METADATA.editor.description,
  keywords: [...PAGE_METADATA.editor.keywords],
  openGraph: {
    ...OPEN_GRAPH,
    title: PAGE_METADATA.editor.title,
    description: PAGE_METADATA.editor.description,
    url: `${SITE_CONFIG.url}/editor`,
  },
  twitter: {
    ...TWITTER_CARD,
    title: PAGE_METADATA.editor.title,
    description: PAGE_METADATA.editor.description,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/editor`,
  },
}

export default function Page() {
  return <EditorPage />
}
