import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Private pages declare noindex in HTML. Keep them crawlable so bots can
      // observe that directive; only API endpoints are blocked from crawling.
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
