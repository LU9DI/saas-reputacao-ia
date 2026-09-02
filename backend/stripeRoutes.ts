/**
 * Rotas Stripe isoladas — montadas no server atual sem reescrever trial/IA/PDF.
 */
import type { Express, Request, Response } from 'express';
import type { Database } from 'sqlite';
import express from 'express';
import crypto from 'crypto';
import {
  stripeConfigured,
  criarCheckoutSession,
  constructStripeEvent,
  extractFromStripeObject,
  resolvePlano,
  listPlanosPublicos,
} from './stripeBilling.js';

async function ensureStripeColumns(db: Database) {
  const cols = (await db.all(`PRAGMA table_info(empresas)`)).map((c: any) => c.name);
  if (!cols.includes('stripe_customer_id')) {
    await db.exec(`ALTER TABLE empresas ADD COLUMN stripe_customer_id TEXT`);
  }
  if (!cols.includes('stripe_subscription_id')) {
    await db.exec(`ALTER TABLE empresas ADD COLUMN stripe_subscription_id TEXT`);
  }
}

async function activatePlan(
  db: Database,
  empresaId: string,
  planDb: string,
  customerId?: string | null,
  subscriptionId?: string | null
) {
  const normalized =
    planDb === 'corporativo' || planDb === 'corporate'
      ? 'corporate'
      : planDb === 'ultra'
        ? 'ultra'
        : 'pro';

  const cycleDays = normalized === 'pro' && planDb === 'pro-anual' ? 365 : 30;
  const expira = new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000).toISOString();

  await db.run(
    `UPDATE empresas SET status = 'ativo', plan = ?, expira_em = ? WHERE id = ?`,
    [normalized, expira, empresaId]
  );
  if (customerId) {
    await db.run(`UPDATE empresas SET stripe_customer_id = ? WHERE id = ?`, [
      customerId,
      empresaId,
    ]);
  }
  if (subscriptionId) {
    await db.run(`UPDATE empresas SET stripe_subscription_id = ? WHERE id = ?`, [
      subscriptionId,
      empresaId,
    ]);
  }
}

export function mountStripeRoutes(app: Express, getDb: () => Database) {
  // Webhook precisa do body cru — registra ANTES de parsers JSON genéricos se possível.
  // Aqui usamos raw só nesta rota.
  app.post(
    '/api/webhook/stripe',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      try {
        const sig = req.headers['stripe-signature'] as string | undefined;
        const raw = req.body as Buffer;
        const event = constructStripeEvent(raw, sig);
        const db = getDb();
        await ensureStripeColumns(db);

        const type = String(event.type || '');
        const obj = event.data?.object || {};

        if (
          type === 'checkout.session.completed' ||
          type === 'customer.subscription.created' ||
          type === 'customer.subscription.updated' ||
          type === 'invoice.paid'
        ) {
          let { empresaId, planDb, customerId, subscriptionId } = extractFromStripeObject(obj);

          if (!empresaId && customerId) {
            const row = await db.get(
              'SELECT id FROM empresas WHERE stripe_customer_id = ?',
              [customerId]
            );
            if (row) empresaId = row.id;
          }

          if (type === 'customer.subscription.updated' && obj.status === 'canceled' && empresaId) {
            await db.run(`UPDATE empresas SET status = 'bloqueado' WHERE id = ?`, [empresaId]);
            return res.json({ ok: true, action: 'block' });
          }

          if (
            type === 'checkout.session.completed' &&
            obj.payment_status &&
            obj.payment_status !== 'paid' &&
            obj.payment_status !== 'no_payment_required'
          ) {
            return res.json({ ok: true, action: 'pending' });
          }

          if (empresaId && planDb) {
            const resolved = resolvePlano(planDb);
            await activatePlan(
              db,
              empresaId,
              resolved?.planDb || planDb,
              customerId,
              subscriptionId
            );
            return res.json({ ok: true, action: 'activate' });
          }
        }

        if (
          (type === 'customer.subscription.deleted' || type === 'charge.refunded') &&
          obj
        ) {
          const { empresaId, customerId } = extractFromStripeObject(obj);
          let id = empresaId;
          if (!id && customerId) {
            const row = await db.get(
              'SELECT id FROM empresas WHERE stripe_customer_id = ?',
              [customerId]
            );
            id = row?.id || null;
          }
          if (id) {
            await db.run(`UPDATE empresas SET status = 'bloqueado' WHERE id = ?`, [id]);
            return res.json({ ok: true, action: 'block' });
          }
        }

        res.json({ ok: true, action: 'ignore' });
      } catch (e: any) {
        console.error('Stripe webhook:', e.message || e);
        res.status(400).json({ error: e.message || 'Webhook error' });
      }
    }
  );

  app.get('/api/planos', (_req, res) => {
    res.json({
      stripe: stripeConfigured(),
      planos: listPlanosPublicos(),
    });
  });

  /**
   * Clique no plano → URL do Stripe Checkout (tela de cartão).
   * Body: { plano: 'pro'|'pro-anual'|'ultra'|'corporate', empresa_id?, email? }
   */
  app.post('/api/checkout', async (req: Request, res: Response) => {
    try {
      if (!stripeConfigured()) {
        return res.status(503).json({
          error: 'Pagamentos não configurados (STRIPE_SECRET_KEY).',
        });
      }
      const plano = String(req.body.plano || req.body.plan || '').toLowerCase();
      if (!resolvePlano(plano)) {
        return res.status(400).json({ error: 'Plano inválido.' });
      }

      const empresaId = req.body.empresa_id ? String(req.body.empresa_id) : null;
      const db = getDb();
      await ensureStripeColumns(db);

      let nomeEmpresa: string | null = null;
      if (empresaId) {
        const emp = await db.get('SELECT * FROM empresas WHERE id = ?', [empresaId]);
        if (!emp) return res.status(404).json({ error: 'Empresa não encontrada.' });
        nomeEmpresa = emp.nome_empresa;
      }

      const session = await criarCheckoutSession({
        planoKey: plano,
        empresaId,
        email: req.body.email ? String(req.body.email) : null,
        nomeEmpresa,
      });

      res.json({
        success: true,
        checkout_url: session.checkoutUrl,
        session_id: session.sessionId,
        plano: session.label,
        value: session.value,
      });
    } catch (e: any) {
      console.error('Checkout:', e.message || e);
      res.status(500).json({ error: e.message || 'Erro no checkout' });
    }
  });

  // evita unused import se tree-shake reclamar
  void crypto;
}
