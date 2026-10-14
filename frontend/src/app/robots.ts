import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // These are application/private endpoints, not public search landing pages.
      disallow: ['/painel/', '/admin/', '/api/', '/avaliacao/', '/widget/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
