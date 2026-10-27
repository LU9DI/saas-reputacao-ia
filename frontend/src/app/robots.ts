import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

// Next 16 + `output: export` exigem rota explicitamente estática.
export const dynamic = 'force-static';

// Crawlers de busca/resposta e de treinamento/corpus que declaramos explicitamente.
// Motivo: um crawler que encontra um grupo com o próprio nome obedece SÓ a esse
// grupo e ignora `User-agent: *`. Sem o grupo explícito, o comportamento fica
// implícito e pode divergir entre provedores. Aqui a decisão é deliberada:
// permitimos rastreamento e citação, e mantemos /api/ bloqueado em todos.
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
  // Treinamento / corpus (inclui grounding de Gemini e Common Crawl)
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Amazonbot',
];

// Páginas privadas levam noindex no HTML; continuam rastreáveis para que o
// crawler consiga observar a diretiva. Não bloqueamos rotas privadas aqui.
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
    // O Índice Filtra.AI é um app separado em /indice e mantém o próprio sitemap.
    // O sitemap principal não deve listar essas URLs.
    sitemap: [`${base}/sitemap.xml`, `${base}/indice/sitemap-index.xml`],
  };
}
