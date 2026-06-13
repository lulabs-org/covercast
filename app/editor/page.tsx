import type { Metadata } from 'next'
import SceneEditor from '@/components/SceneEditor'
import { PAGE_METADATA, SITE_CONFIG, OPEN_GRAPH, TWITTER_CARD } from '../../lib/seo-config'

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

export default function EditorPage() {
  return <SceneEditor />
}
