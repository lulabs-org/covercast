import { MetadataRoute } from 'next'
import { SITE_CONFIG, ROUTES } from './lib/seo-config'

/**
 * 动态生成sitemap.xml
 * 遵循Next.js 16的sitemap生成规范
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}${ROUTES.editor}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}${ROUTES.live}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
}
