import { llmsIndex } from '@/lib/llms';

// Convenção emergente (não padrão). Gerado dos mesmos dados do site no build.
export const dynamic = 'force-static';

export function GET() {
  return new Response(llmsIndex(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
