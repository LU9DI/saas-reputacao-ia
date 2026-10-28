// Índice central de descoberta do domínio canônico.
//
// Por que existe: o site principal publica /sitemap.xml (106 URLs) e o Índice
// Filtra.AI é um app separado, servido em /indice, que publica o próprio sitemap.
// Sem este arquivo o domínio tem dois pontos de descoberta independentes e nenhum
// artefato único que represente "todas as URLs publicadas em filtraai.com".
//
// Regras do Google que este arquivo respeita (Search Central, sitemap index):
//   1. Todo sitemap referenciado precisa estar no mesmo site do índice.
//   2. Todo sitemap referenciado precisa estar no mesmo diretório do índice ou
//      abaixo na hierarquia do site.
//   3. O índice pode listar até 50.000 sitemaps e ter até 50 MB.
// Verificado em produção: as 28.607 URLs do Índice já são publicadas em
// https://filtraai.com/indice/... (mesmo host), então as condições 1 e 2 valem
// sem cross-site submission.
//
// Decisões deliberadas:
//   - /sitemap.xml continua sendo um <urlset> (leaf). Não é convertido em índice:
//     scripts/submit-indexnow.mjs e consumidores externos leem exatamente essa URL.
//   - Aponta para o leaf /indice/sitemap/0.xml, não para /indice/sitemap-index.xml.
//     O segundo é, ele mesmo, um <sitemapindex>; índice dentro de índice não é
//     documentado pelo Google. Com 1 shard, listar o leaf custa uma linha.
//   - Sem <lastmod> no índice. O lastmod do índice se refere à última modificação
//     do ARQUIVO de sitemap, não da página. Cada URL já carrega seu lastmod real
//     dentro dos leaves, que é o que o Google usa.
//   - Nenhuma URL de página aparece aqui: o índice só lista sitemaps, para não
//     duplicar URLs entre o índice central e os leaves.

const base = 'https://filtraai.com';

export const dynamic = 'force-static';

// Mantenha em sincronia com indice/src/app/sitemap.ts (POR_ARQUIVO = 40000).
// Hoje: 28.607 URLs -> 1 shard. Ao passar de 40.000 URLs, adicione
// `/indice/sitemap/1.xml` (e os seguintes). scripts/validate-seo.mjs falha
// quando a contagem real e a lista abaixo divergem.
const SITEMAPS = [
  `${base}/sitemap.xml`, // site principal — mesmo diretório
  `${base}/indice/sitemap/0.xml`, // Índice Filtra.AI, shard 0 — abaixo do índice
] as const;

export function GET() {
  const itens = SITEMAPS.map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${itens}\n</sitemapindex>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
