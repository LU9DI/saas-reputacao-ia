/**
 * Checkout PayPal (alternativa ao Stripe).
 */
import type { Express, Request, Response } from 'express';
import { getDb } from '../lib/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  paypalConfigured,
  createPayPalOrder,
  capturePayPalOrder,
} from '../lib/paypal.js';
import { resolvePlano } from '../stripeBilling.js';
import { activatePlan } from '../services/billingService.js';

export function mountPayPalRoutes(app: Express) {
  app.get('/api/paypal/status', (_req, res) => {
    res.json({
      configured: paypalConfigured(),
      mode: process.env.PAYPAL_MODE || 'sandbox',
    });
  });

  app.post(
    '/api/paypal/create-order',
    asyncHandler(async (req: Request, res: Response) => {
      if (!paypalConfigured()) {
        return res.status(503).json({
          error: 'PayPal não configurado. Defina PAYPAL_CLIENT_ID e PAYPAL_CLIENT_SECRET.',
        });
      }
      const plano = String(req.body?.plano || '').trim();
      if (!resolvePlano(plano)) {
        return res.status(400).json({ error: 'Plano inválido.' });
      }
      const empresaId = req.body?.empresa_id ? String(req.body.empresa_id) : null;
      if (empresaId) {
        const emp = await getDb().get(`SELECT id FROM empresas WHERE id = ?`, [empresaId]);
        if (!emp) return res.status(404).json({ error: 'Empresa não encontrada.' });
      }

      const order = await createPayPalOrder({
        planoKey: plano,
        empresaId,
        email: req.body?.email ? String(req.body.email) : null,
      });

      res.json({
        success: true,
        order_id: order.orderId,
        approve_url: order.approveUrl,
        plano: order.label,
        value_monthly_ref: order.value,
        gateway: 'paypal',
      });
    })
  );

  app.post(
    '/api/paypal/capture-order',
    asyncHandler(async (req: Request, res: Response) => {
      if (!paypalConfigured()) {
        return res.status(503).json({ error: 'PayPal não configurado.' });
      }
      const orderId = String(req.body?.order_id || req.body?.orderID || '').trim();
      const planoKey = String(req.body?.plano || '').trim();
      let empresaId = req.body?.empresa_id ? String(req.body.empresa_id) : null;
      if (!orderId) return res.status(400).json({ error: 'order_id obrigatório.' });

      const cap = await capturePayPalOrder(orderId);
      if (cap.status !== 'COMPLETED' && cap.status !== 'APPROVED') {
        // COMPLETED é o status do order após capture
        if (String(cap.status).toUpperCase() !== 'COMPLETED') {
          return res.status(402).json({
            error: `Pagamento não concluído (${cap.status}).`,
            capture: cap,
          });
        }
      }

      if (!empresaId && cap.customId) empresaId = String(cap.customId);
      const plano = resolvePlano(planoKey || 'pro');
      if (!empresaId) {
        return res.json({
          success: true,
          payment: cap,
          aviso: 'Pagamento capturado, mas empresa_id ausente — ative manualmente no admin.',
        });
      }

      const db = getDb();
      const days = plano?.interval === 'year' ? 365 : 30;
      const exp = new Date();
      exp.setDate(exp.getDate() + days);

      await activatePlan(
        db,
        empresaId,
        plano?.planDb || 'pro',
        null,
        `paypal:${cap.captureId || orderId}`,
        exp.toISOString()
      );

      // marca gateway
      try {
        const cols = (await db.all(`PRAGMA table_info(empresas)`)).map((c: any) => c.name);
        if (!cols.includes('payment_gateway')) {
          await db.exec(`ALTER TABLE empresas ADD COLUMN payment_gateway TEXT`);
        }
        await db.run(`UPDATE empresas SET payment_gateway = 'paypal', billing_cycle = ? WHERE id = ?`, [
          plano?.interval === 'year' ? 'year' : 'month',
          empresaId,
        ]);
      } catch {
        /* ignore */
      }

      res.json({
        success: true,
        gateway: 'paypal',
        payment: cap,
        plan: plano?.planDb,
        expira_em: exp.toISOString(),
      });
    })
  );
}
