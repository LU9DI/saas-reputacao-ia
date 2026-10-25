import { getMeta, todosOsCaminhos } from '@/lib/data';
import { BASE } from '@/lib/seo';

export const dynamic = 'force-static';
const POR_ARQUIVO = 40000;

// O Next gera os sitemaps em /sitemap/[id].xml, mas não o arquivo de índice. Este é o índice.
export function GET() {
  const qtd = Math.max(1, Math.ceil(todosOsCaminhos().length / POR_ARQUIVO));
  const lastmod = getMeta().geradoEm;
  const itens = Array.from({ length: qtd }, (_, id) => `  <sitemap><loc>${BASE}/sitemap/${id}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${itens}\n</sitemapindex>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
