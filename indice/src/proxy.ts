import { NextResponse, type NextRequest } from 'next/server';
import { pedeMarkdown } from '@/lib/negociacao';

/**
 * Negociação de conteúdo: a mesma URL entrega Markdown para agentes que pedem
 * `Accept: text/markdown` (e não pedem HTML), e HTML para todo o resto.
 *
 * A gêmea explícita em /md/... continua existindo. `Vary: Accept` evita que um
 * cache sirva Markdown a um navegador (ou o contrário).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl; // sem o basePath
  if (pedeMarkdown(request.headers.get('accept'))) {
    const url = request.nextUrl.clone();
    url.pathname = `/md${pathname === '/' ? '' : pathname}`;
    const resposta = NextResponse.rewrite(url);
    resposta.headers.set('Vary', 'Accept');
    // Mesma URL, corpo diferente: nunca deixar um cache compartilhado guardar a variante Markdown.
    resposta.headers.set('Cache-Control', 'private, no-store');
    return resposta;
  }
  const resposta = NextResponse.next();
  resposta.headers.append('Vary', 'Accept');
  return resposta;
}

export const config = {
  // Só páginas: fora assets, gêmeas /md, sitemaps, robots, llms e qualquer arquivo com extensão.
  matcher: ['/', '/((?!_next|md/|md$|sitemap|robots|llms|.*\\..*).*)'],
};
