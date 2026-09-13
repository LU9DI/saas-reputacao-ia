import { NextResponse } from 'next/server';

/**
 * Vercel Cron — acorda o backend Render a cada 5 min.
 * Configure CRON_SECRET na Vercel (opcional) para proteger o endpoint.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  const primary =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'https://filtra-ia-api.onrender.com';
  const backup = process.env.NEXT_PUBLIC_API_URL_BACKUP || '';
  const bases = [primary, backup].filter(Boolean).map((u) => u.replace(/\/+$/, ''));

  const results: { base: string; ok: boolean; ms: number; status?: number }[] = [];

  await Promise.all(
    bases.map(async (base) => {
      const t0 = Date.now();
      try {
        const res = await fetch(`${base}/api/health`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(20_000),
        });
        results.push({ base, ok: res.ok, ms: Date.now() - t0, status: res.status });
      } catch {
        results.push({ base, ok: false, ms: Date.now() - t0 });
      }
    })
  );

  return NextResponse.json({
    ok: results.some((r) => r.ok),
    at: new Date().toISOString(),
    results,
  });
}
