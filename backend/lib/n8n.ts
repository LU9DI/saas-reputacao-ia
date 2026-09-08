/**
 * Integração n8n — inbound (captação) + outbound (eventos do SaaS).
 *
 * Env:
 *   N8N_ENABLED=1                    — liga a integração
 *   N8N_WEBHOOK_URL=https://...      — URL do webhook de SAÍDA (n8n recebe eventos)
 *   N8N_WEBHOOK_SECRET=...           — segredo compartilhado (header x-filtra-secret)
 *   N8N_INBOUND_SECRET=...           — segredo para n8n → API (default = N8N_WEBHOOK_SECRET)
 *
 * Princípios:
 *   - API NÃO dispara WhatsApp frio / spam
 *   - n8n decide o que enviar (mensagens humanas, limites, horários)
 *   - eventos estruturados + idempotência simples
 */
import crypto from 'crypto';
import { getDb } from './db.js';

export function n8nEnabled(): boolean {
  if (process.env.N8N_ENABLED === '0') return false;
  return Boolean(
    process.env.N8N_WEBHOOK_URL?.trim() ||
      process.env.N8N_ENABLED === '1' ||
      process.env.N8N_INBOUND_SECRET?.trim()
  );
}

export function n8nOutboundConfigured(): boolean {
  return Boolean(process.env.N8N_WEBHOOK_URL?.trim());
}

export function n8nInboundSecret(): string {
  return (
    process.env.N8N_INBOUND_SECRET?.trim() ||
    process.env.N8N_WEBHOOK_SECRET?.trim() ||
    ''
  );
}

export function n8nOutboundSecret(): string {
  return process.env.N8N_WEBHOOK_SECRET?.trim() || '';
}

export function n8nStatus() {
  const url = process.env.N8N_WEBHOOK_URL?.trim() || null;
  return {
    enabled: n8nEnabled(),
    outbound: n8nOutboundConfigured(),
    outbound_url_set: Boolean(url),
    inbound_secret_set: Boolean(n8nInboundSecret()),
    secret_set: Boolean(n8nOutboundSecret() || n8nInboundSecret()),
  };
}

export function verifyInboundSecret(headerValue: string | undefined | null): boolean {
  const expected = n8nInboundSecret();
  // Se não configurou secret, em produção bloqueia; em dev aceita
  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }
  const got = String(headerValue || '').trim();
  if (!got || got.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
  } catch {
    return got === expected;
  }
}

export type N8nEventType =
  | 'trial.activated'
  | 'review.created'
  | 'review.critical'
  | 'payment.activated'
  | 'lead.captured'
  | 'ping';

export type N8nOutboundPayload = {
  event: N8nEventType;
  at: string;
  empresa_id?: string | null;
  slug?: string | null;
  data: Record<string, unknown>;
};

/**
 * Dispara evento para o n8n (fire-and-forget seguro).
 * Nunca lança para não quebrar o fluxo principal.
 */
export async function dispatchN8nEvent(
  event: N8nEventType,
  data: Record<string, unknown>,
  meta?: { empresaId?: string | null; slug?: string | null }
): Promise<{ ok: boolean; status?: number; skipped?: boolean; error?: string }> {
  const url = process.env.N8N_WEBHOOK_URL?.trim();
  if (!url) {
    return { ok: false, skipped: true, error: 'N8N_WEBHOOK_URL ausente' };
  }

  const payload: N8nOutboundPayload = {
    event,
    at: new Date().toISOString(),
    empresa_id: meta?.empresaId || (data.empresa_id as string) || null,
    slug: meta?.slug || (data.slug as string) || null,
    data,
  };

  const secret = n8nOutboundSecret();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Filtra.AI-n8n/1.0',
    'X-Filtra-Event': event,
  };
  if (secret) {
    headers['X-Filtra-Secret'] = secret;
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(t);

    // log ops (best-effort)
    try {
      const db = getDb();
      await db.run(
        `INSERT INTO ops_webhook_log (id, source, event_type, status, detail, created_at)
         VALUES (?, 'n8n_out', ?, ?, ?, datetime('now'))`,
        [
          crypto.randomUUID(),
          event,
          res.ok ? 'ok' : 'error',
          `http=${res.status}`,
        ]
      ).catch(() => null);
    } catch {
      /* tabela pode não existir ainda */
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[n8n] outbound ${event} → ${res.status}`, body.slice(0, 120));
      return { ok: false, status: res.status, error: body.slice(0, 200) };
    }
    return { ok: true, status: res.status };
  } catch (e: any) {
    console.warn('[n8n] outbound fail:', e?.message || e);
    return { ok: false, error: String(e?.message || e).slice(0, 200) };
  }
}

/** Ping de saúde para o admin / n8n. */
export async function pingN8n(): Promise<{ ok: boolean; detail: string }> {
  if (!n8nOutboundConfigured()) {
    return { ok: false, detail: 'N8N_WEBHOOK_URL não configurada' };
  }
  const r = await dispatchN8nEvent('ping', { source: 'filtra-api' });
  return {
    ok: Boolean(r.ok),
    detail: r.ok ? `HTTP ${r.status}` : r.error || r.detail || 'falha',
  };
}
