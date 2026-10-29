import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

// Next 16 + `output: export` exigem rota explicitamente estática.
export const dynamic = 'force-static';

// Crawlers de busca/resposta e de treinamento/corpus que declaramos explicitamente.
// Um crawler que encontra um grupo com o próprio nome obedece só a esse grupo,
// então mantemos a mesma política deliberada em todos: rastrear páginas públicas
// e bloquear apenas a API. Páginas privadas comunicam noindex no HTML.
const AI_CRAWLERS = [
  // Busca e respostas em assistentes
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-SearchBot',
  'Claude-User',
  'DuckAssistBot',
  'MistralAI-User',
  // Treinamento / corpus
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Amazonbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/api/'],
      })),
    ],
    // Ponto único de descoberta: o índice central inclui o sitemap principal
    // (106 URLs) e os três shards do Índice Filtra.AI (~28,8 mil URLs).
    // Evita anunciar vários pontos de entrada independentes no robots.txt.
    sitemap: `${base}/sitemap-index.xml`,
  };
}
