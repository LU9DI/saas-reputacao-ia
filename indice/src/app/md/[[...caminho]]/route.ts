import { markdownDaPagina } from '@/lib/llms';

type Props = { params: Promise<{ caminho?: string[] }> };

/**
 * Gêmea em Markdown de cada página do Índice, para agentes.
 *
 * A URL canônica continua sendo o HTML; o `.md` fica fora do sitemap e é
 * descoberto por /indice/llms.txt. `X-Robots-Tag: noindex` evita que o texto
 * bruto dispute indexação com a página canônica.
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: Props) {
  const { caminho = [] } = await params;
  const pagina = markdownDaPagina(caminho);
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
