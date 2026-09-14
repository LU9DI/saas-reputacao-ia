/**
 * PayPal Checkout (Orders v2) + Webhooks.
 *
 * Env:
 *   PAYPAL_CLIENT_ID=
 *   PAYPAL_CLIENT_SECRET=
 *   PAYPAL_MODE=sandbox|live
 *   PAYPAL_WEBHOOK_ID=   (ID do webhook no Developer Dashboard)
 */
import { resolvePlano, type PlanoDef } from '../stripeBilling.js';

/** Remove aspas acidentais e espaços das env vars do Render. */
function envTrim(key: string): string {
  let v = String(process.env[key] || '').trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  // Render às vezes cola \n no final do secret
  return v.replace(/[\r\n]+/g, '');
}

function paypalMode(): 'live' | 'sandbox' {
  const m = envTrim('PAYPAL_MODE').toLowerCase();
  return m === 'live' || m === 'production' || m === 'prod' ? 'live' : 'sandbox';
}

function baseUrl(): string {
  return paypalMode() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function paypalConfigured(): boolean {
  return Boolean(envTrim('PAYPAL_CLIENT_ID') && envTrim('PAYPAL_CLIENT_SECRET'));
}

export function paypalWebhookConfigured(): boolean {
  return paypalConfigured() && Boolean(envTrim('PAYPAL_WEBHOOK_ID'));
}

export async function accessToken(): Promise<string> {
  const id = envTrim('PAYPAL_CLIENT_ID');
  const secret = envTrim('PAYPAL_CLIENT_SECRET');
  if (!id || !secret) {
    throw new Error('PayPal: PAYPAL_CLIENT_ID ou PAYPAL_CLIENT_SECRET ausentes');
  }

  const mode = paypalMode();
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const url = `${baseUrl()}/v1/oauth2/token`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    });
  } catch (net: any) {
    throw new Error(`PayPal OAuth rede (${mode}): ${net?.message || net}`);
  }

  const data = await res.json().catch(() => ({} as any));
  if (!res.ok || !data.access_token) {
    const detail =
      data?.error_description ||
      data?.error ||
      data?.message ||
      `HTTP ${res.status}`;
    // Dica comum: credencial sandbox com MODE=live (ou o contrário)
    const hint =
      /client.?authentication|invalid_client|unauthorized/i.test(String(detail))
        ? ` — confira se CLIENT_ID/SECRET são do ambiente ${mode} (Developer Dashboard → ${mode === 'live' ? 'Live' : 'Sandbox'})`
        : '';
    throw new Error(`PayPal OAuth falhou (${mode}): ${detail}${hint}`);
  }
  return data.access_token as string;
}

function appUrl(): string {
  return (
    envTrim('APP_URL') ||
    envTrim('FRONTEND_URL') ||
    'https://filtra-ai.vercel.app'
  ).replace(/\/$/, '');
}

export function planoAmountBrl(plano: PlanoDef): string {
  return (plano.unitAmount / 100).toFixed(2);
}

/** custom_id: empresaId|planoKey (limite ~127 chars). */
export function buildCustomId(empresaId: string | null | undefined, planoKey: string): string {
  const eid = String(empresaId || '').slice(0, 60);
  const pk = String(planoKey || '').slice(0, 40);
  return `${eid}|${pk}`.slice(0, 127);
}

export function parseCustomId(customId: string | null | undefined): {
  empresaId: string | null;
  planoKey: string | null;
} {
  if (!customId) return { empresaId: null, planoKey: null };
  const parts = String(customId).split('|');
  if (parts.length >= 2) {
    return {
      empresaId: parts[0] || null,
      planoKey: parts.slice(1).join('|') || null,
    };
  }
  return { empresaId: String(customId), planoKey: null };
}

export function parsePlanoFromInvoiceId(invoiceId: string | null | undefined): string | null {
  if (!invoiceId) return null;
  const m = String(invoiceId).match(/^filtra-([a-z0-9-]+)-\d+$/i);
  return m ? m[1] : null;
}

export async function createPayPalOrder(opts: {
  planoKey: string;
  empresaId?: string | null;
  email?: string | null;
}): Promise<{ orderId: string; approveUrl: string; label: string; value: number }> {
  if (!paypalConfigured()) throw new Error('PayPal não configurado');
  const plano = resolvePlano(opts.planoKey);
  if (!plano) throw new Error('Plano inválido');

  const token = await accessToken();
  const value = planoAmountBrl(plano);
  const base = appUrl();
  const returnUrl = `${base}/?paypal=success&empresa_id=${encodeURIComponent(opts.empresaId || '')}&plano=${encodeURIComponent(plano.key)}`;
  const cancelUrl = `${base}/?paypal=cancel`;

  const body: Record<string, unknown> = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'BRL',
          value,
        },
        description: `Filtra.AI — ${plano.label}`.slice(0, 127),
        custom_id: buildCustomId(opts.empresaId, plano.key),
        invoice_id: `filtra-${plano.key}-${Date.now()}`.slice(0, 127),
      },
    ],
    application_context: {
      brand_name: 'Filtra.AI',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
      shipping_preference: 'NO_SHIPPING',
    },
  };

  if (opts.email) {
    (body as any).payer = { email_address: String(opts.email).slice(0, 254) };
  }

  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    const detail =
      data?.details?.[0]?.description ||
      data?.details?.[0]?.issue ||
      data?.message ||
      data?.name ||
      `HTTP ${res.status}`;
    const issue = data?.details?.[0]?.issue ? ` [${data.details[0].issue}]` : '';
    throw new Error(`PayPal create order falhou: ${detail}${issue}`);
  }

  const approve = (data.links || []).find((l: any) => l.rel === 'approve');
  if (!approve?.href) throw new Error('PayPal não retornou link de aprovação');

  return {
    orderId: data.id,
    approveUrl: approve.href,
    label: plano.label,
    value: plano.displayMonthly,
  };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  status: string;
  captureId?: string;
  amount?: string;
  customId?: string | null;
  invoiceId?: string | null;
  orderId: string;
}> {
  if (!paypalConfigured()) throw new Error('PayPal não configurado');
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    if (res.status === 422 || String(data?.name || '').includes('ORDER_ALREADY_CAPTURED')) {
      return getPayPalOrderSummary(orderId);
    }
    const detail =
      data?.details?.[0]?.description || data?.message || `Capture ${res.status}`;
    throw new Error(`PayPal capture falhou: ${detail}`);
  }

  const unit = data?.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  return {
    status: data.status || cap?.status || 'UNKNOWN',
    captureId: cap?.id,
    amount: cap?.amount?.value,
    customId: unit?.custom_id || null,
    invoiceId: unit?.invoice_id || null,
    orderId: data.id || orderId,
  };
}

export async function getPayPalOrderSummary(orderId: string) {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(`PayPal GET order: ${data?.message || res.status}`);
  const unit = data?.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  return {
    status: data.status || cap?.status || 'UNKNOWN',
    captureId: cap?.id,
    amount: cap?.amount?.value,
    customId: unit?.custom_id || null,
    invoiceId: unit?.invoice_id || null,
    orderId: data.id || orderId,
  };
}

/** Verifica autenticidade do webhook via API PayPal. */
export async function verifyPayPalWebhook(opts: {
  headers: Record<string, string | string[] | undefined>;
  webhookEvent: any;
}): Promise<boolean> {
  const webhookId = envTrim('PAYPAL_WEBHOOK_ID');
  if (!webhookId) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PayPal: PAYPAL_WEBHOOK_ID obrigatório em produção');
    }
    console.warn('[paypal webhook] PAYPAL_WEBHOOK_ID ausente — skip verify (dev)');
    return true;
  }

  const h = opts.headers;
  const get = (k: string) => {
    const v = h[k] || h[k.toLowerCase()] || h[k.toUpperCase()];
    return Array.isArray(v) ? v[0] : v;
  };

  const transmission_id = get('paypal-transmission-id');
  const transmission_time = get('paypal-transmission-time');
  const cert_url = get('paypal-cert-url');
  const auth_algo = get('paypal-auth-algo');
  const transmission_sig = get('paypal-transmission-sig');

  if (!transmission_id || !transmission_time || !cert_url || !auth_algo || !transmission_sig) {
    throw new Error('PayPal: Headers PayPal incompletos');
  }

  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      transmission_id,
      transmission_time,
      cert_url,
      auth_algo,
      transmission_sig,
      webhook_id: webhookId,
      webhook_event: opts.webhookEvent,
    }),
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    console.error('[paypal verify]', data);
    return false;
  }
  return String(data.verification_status || '').toUpperCase() === 'SUCCESS';
}
