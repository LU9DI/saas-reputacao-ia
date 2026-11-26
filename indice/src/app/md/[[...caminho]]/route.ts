import { markdownDaPagina } from '@/lib/llms';
import { todosOsCaminhos } from '@/lib/data';

type Props = { params: Promise<{ caminho?: string[] }> };

/**
 * Gêmea em Markdown de cada página do Índice, para agentes.
 *
 * A extensão .md no último segmento evita colisões entre um caminho que é
 * página (por exemplo /ac) e outro que é descendente (/ac/acrelandia).
 * A URL canônica continua sendo o HTML; Markdown fica fora do sitemap.
 */
export function generateStaticParams() {
  return todosOsCaminhos().map((caminho) => {
    if (caminho === '/') return { caminho: ['index.md'] };
    const partes = caminho.slice(1).split('/');
    partes[partes.length - 1] += '.md';
    return { caminho: partes };
  });
}

export async function GET(_request: Request, { params }: Props) {
  const { caminho = [] } = await params;
  const partes = [...caminho];
  if (partes.length === 1 && partes[0] === 'index.md') partes.length = 0;
  else if (partes.length) partes[partes.length - 1] = partes[partes.length - 1].replace(/\.md$/, '');
  const pagina = markdownDaPagina(partes);
  if (!pagina) {
    return new Response('Not found\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
    });
  }
  return new Response(pagina.corpo, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${pagina.htmlUrl}>; rel="canonical"`,
      'X-Robots-Tag': 'noindex, follow',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
