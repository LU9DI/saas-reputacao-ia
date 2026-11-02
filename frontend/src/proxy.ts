import { NextRequest, NextResponse } from 'next/server';

// Next.js 16 proxy: serve explicit Markdown twins on the Node runtime.
// The HTML route remains canonical; only requests ending in .md are rewritten.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.toLowerCase().endsWith('.md')) return NextResponse.next();

  const canonicalPath = pathname.slice(0, -3) || '/';
  if (
    !canonicalPath.startsWith('/') ||
    canonicalPath.startsWith('//') ||
    canonicalPath.includes('\\') ||
    canonicalPath.split('/').some((part) => part === '.' || part === '..') ||
    canonicalPath.startsWith('/api/')
  ) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const destination = request.nextUrl.clone();
  destination.pathname = '/api/markdown';
  destination.search = '';
  destination.searchParams.set('path', canonicalPath);
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
