import { MetadataRoute } from 'next';
import { SITE_CONFIG } from './lib/seo-config';

/**
 * 动态生成robots.txt
 * 遵循Next.js 16的robots生成规范
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}