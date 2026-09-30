import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/painel/', '/admin/', '/api/', '/avaliacao/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
