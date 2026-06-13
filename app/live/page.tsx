import type { Metadata } from 'next'
import LiveView from '@/components/LiveView'
import { PAGE_METADATA, SITE_CONFIG, OPEN_GRAPH, TWITTER_CARD } from '@/lib/config/seo'

export const metadata: Metadata = {
  title: PAGE_METADATA.live.title,
  description: PAGE_METADATA.live.description,
  keywords: [...PAGE_METADATA.live.keywords],
  openGraph: {
    ...OPEN_GRAPH,
    title: PAGE_METADATA.live.title,
    description: PAGE_METADATA.live.description,
    url: `${SITE_CONFIG.url}/live`,
  },
  twitter: {
    ...TWITTER_CARD,
    title: PAGE_METADATA.live.title,
    description: PAGE_METADATA.live.description,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/live`,
  },
}

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; s?: string }>
}) {
  const params = await searchParams
  return <LiveView templateId={params.t} slotId={params.s} />
}
