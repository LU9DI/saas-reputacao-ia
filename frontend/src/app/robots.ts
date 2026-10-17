import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private pages carry noindex in HTML; keep them crawlable so crawlers can observe it.
      disallow: ['/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
