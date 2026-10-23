import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

// Next 16 + `output: export` exigem rota explicitamente estática.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      // O grupo curinga permite buscadores e crawlers de IA. Grupos explícitos
      // só serão adicionados se houver uma política específica de bloqueio.
      userAgent: '*',
      allow: '/',
      // Private pages carry noindex in HTML; keep them crawlable so crawlers can observe it.
      disallow: ['/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
