/**
 * PayPal Checkout (Orders v2) — pagamento único por ciclo do plano.
 *
 * Env:
 *   PAYPAL_CLIENT_ID=
 *   PAYPAL_CLIENT_SECRET=
 *   PAYPAL_MODE=sandbox|live  (default sandbox)
 */
import { resolvePlano, type PlanoDef } from '../stripeBilling.js';

function baseUrl(): string {
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function paypalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim()
  );
}

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID!.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET!.trim();
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data?.error_description || data?.error || 'PayPal OAuth falhou');
  }
  return data.access_token as string;
}

function appUrl(): string {
  return (process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
}

/** Valor BRL do plano (mensal ou anual). */
export function planoAmountBrl(plano: PlanoDef): string {
  // unitAmount está em centavos
  const reais = (plano.unitAmount / 100).toFixed(2);
  return reais;
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
  const returnUrl = `${appUrl()}/?paypal=success&empresa_id=${encodeURIComponent(opts.empresaId || '')}&plano=${encodeURIComponent(plano.key)}`;
  const cancelUrl = `${appUrl()}/?paypal=cancel`;

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'BRL',
          value,
        },
        description: `Filtra.IA — ${plano.label}`.slice(0, 127),
        custom_id: opts.empresaId || undefined,
        invoice_id: `filtra-${plano.key}-${Date.now()}`.slice(0, 127),
      },
    ],
    application_context: {
      brand_name: 'Filtra.IA',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.details?.[0]?.description || `PayPal ${res.status}`);
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
}> {
  if (!paypalConfigured()) throw new Error('PayPal não configurado');
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.details?.[0]?.description || `Capture ${res.status}`);
  }

  const unit = data?.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  return {
    status: data.status || cap?.status || 'UNKNOWN',
    captureId: cap?.id,
    amount: cap?.amount?.value,
    customId: unit?.custom_id || null,
  };
}
