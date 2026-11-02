import { parse } from 'node-html-parser';
import TurndownService from 'turndown';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = 'https://filtraai.com';
const NOISE =
  'script, style, noscript, svg, button, form, input, select, textarea, iframe, canvas, video, audio, [hidden], [aria-hidden="true"]';

function notFound() {
  return new NextResponse('Not Found', {
    status: 404,
    headers: { 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get('path');
  if (
    !pathname ||
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    pathname.includes('\\') ||
    pathname.split('/').some((part) => part === '.' || part === '..') ||
    pathname.startsWith('/api/') ||
    pathname === '/'
  ) {
    return notFound();
  }

  const pageUrl = new URL(pathname, request.nextUrl.origin);
  let upstream: Response;
  try {
    upstream = await fetch(pageUrl, {
      headers: { Accept: 'text/html' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return new NextResponse('Markdown source temporarily unavailable', { status: 502 });
  }

  if (!upstream.ok || !(upstream.headers.get('content-type') ?? '').includes('text/html')) {
    return notFound();
  }

  const html = await upstream.text();
  if (html.length > 2_000_000) {
    return new NextResponse('Page too large to convert', { status: 413 });
  }

  const root = parse(html);
  const main = root.querySelector('main') ?? root.querySelector('article');
  if (!main) return notFound();

  main.querySelectorAll(NOISE).forEach((node) => node.remove());
  main.querySelectorAll('nav').forEach((node) => node.remove());
  main.querySelectorAll('a[aria-label="Filtra.AI"]').forEach((node) => node.remove());

  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
  });

  turndown.addRule('blockLink', {
    filter: (node) =>
      node.nodeName === 'A' &&
      Boolean(node.getAttribute('href')) &&
      [...node.querySelectorAll('h1,h2,h3,h4,p,div,ul,ol')].length > 0,
    replacement: (content, node) => {
      const href = node.getAttribute('href') ?? '';
      const absolute = href.startsWith('/') ? `${SITE}${href}` : href;
      return `\n\n${content.trim()}\n\n→ ${absolute}\n\n`;
    },
  });

  turndown.addRule('imgWithAlt', {
    filter: 'img',
    replacement: (_content, node) => {
      const alt = (node.getAttribute('alt') ?? '').trim();
      return alt ? `![${alt}](${node.getAttribute('src') ?? ''})` : '';
    },
  });

  const markdown = turndown
    .turndown(main.innerHTML)
    .replace(/\]\((\/[^)\s]*)\)/g, (_match, path) => `](${SITE}${path})`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (markdown.length < 200) return notFound();

  const canonical = new URL(pathname, SITE).toString();
  const body = `> Fonte canônica: ${canonical} · Idioma: ${pathname.split('/')[1] === 'en' ? 'en' : pathname.split('/')[1] === 'es' ? 'es' : 'pt-BR'}\n\n${markdown}\n`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${canonical}>; rel="canonical"`,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      Vary: 'Accept',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
