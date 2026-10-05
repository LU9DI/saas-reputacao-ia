import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Dot offline até validação em localhost — bloqueia a rota no edge. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/dot' || pathname.startsWith('/dot/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dot', '/dot/:path*'],
};
