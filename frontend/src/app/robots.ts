import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

// Next 16 + `output: export` exigem rota explicitamente estática.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private pages carry noindex in HTML; keep them crawlable so crawlers can observe it.
      disallow: ['/api/'],
    },
    // O Índice Filtra.AI é um app separado em /indice e mantém o próprio sitemap.
    // O sitemap principal não deve listar essas URLs.
    sitemap: [`${base}/sitemap.xml`, `${base}/indice/sitemap-index.xml`],
  };
}
