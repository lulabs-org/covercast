/**
 * JSON-LD结构化数据组件
 * 遵循架构要求：独立组件，UI与数据分离
 */

import { JSON_LD_CONFIG, SITE_CONFIG } from '@/config/seo'

interface JsonLdProps {
  type: 'organization' | 'softwareApplication' | 'webPage' | 'faq' | 'howTo'
  data?: Record<string, unknown>
}

/**
 * 生成JSON-LD结构化数据
 */
function generateJsonLd(type: JsonLdProps['type'], data?: Record<string, unknown>) {
  const baseConfig = {
    '@context': 'https://schema.org',
  }

  switch (type) {
    case 'organization':
      return {
        ...baseConfig,
        ...JSON_LD_CONFIG.organization,
      }

    case 'softwareApplication':
      return {
        ...baseConfig,
        ...JSON_LD_CONFIG.softwareApplication,
      }

    case 'webPage':
      return {
        ...baseConfig,
        '@type': 'WebPage',
        name: data?.name || SITE_CONFIG.name,
        description: data?.description || SITE_CONFIG.description,
        url: data?.url || SITE_CONFIG.url,
        ...data,
      }

    case 'faq':
      return {
        ...baseConfig,
        ...JSON_LD_CONFIG.faq,
      }

    case 'howTo':
      return {
        ...baseConfig,
        ...JSON_LD_CONFIG.howTo,
      }

    default:
      return baseConfig
  }
}

/**
 * JSON-LD结构化数据组件
 * 用于提升搜索引擎对网站内容的理解
 */
export default function JsonLd({ type, data }: JsonLdProps) {
  const jsonLd = generateJsonLd(type, data)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  )
}
