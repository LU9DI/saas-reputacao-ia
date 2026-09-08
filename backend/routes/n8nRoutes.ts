/**
 * Rotas n8n:
 *  GET  /api/n8n/status
 *  POST /api/n8n/inbound/lead     — captação (Maps / formulário / lista)
 *  POST /api/n8n/inbound/review   — avaliação vinda do n8n
 *  POST /api/n8n/ping             — testa saída (admin secret opcional)
 *
 * Header obrigatório em produção: X-Filtra-Secret: <N8N_INBOUND_SECRET>
 */
import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDb, slugify, slugUnico } from '../lib/db.js';
import {
  n8nStatus,
  n8nEnabled,
  verifyInboundSecret,
  dispatchN8nEvent,
  pingN8n,
} from '../lib/n8n.js';
import { criarReview } from '../services/reviewService.js';
import { normalizarWhatsapp } from '../lib/whatsapp.js';

const inboundLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit n8n inbound.' },
});

function requireN8nSecret(req: Request, res: Response): boolean {
  const secret =
    (req.headers['x-filtra-secret'] as string) ||
    (req.headers['x-n8n-secret'] as string) ||
    '';
  if (!verifyInboundSecret(secret)) {
    res.status(401).json({ error: 'Segredo n8n inválido ou ausente (X-Filtra-Secret).' });
    return false;
  }
  return true;
}

export function mountN8nRoutes(app: Express) {
  app.get('/api/n8n/status', (_req, res) => {
    res.json({
      ...n8nStatus(),
      endpoints: {
        status: 'GET /api/n8n/status',
        inbound_lead: 'POST /api/n8n/inbound/lead',
        inbound_review: 'POST /api/n8n/inbound/review',
        ping: 'POST /api/n8n/ping',
      },
      hint: n8nEnabled()
        ? 'Integração pronta. Configure workflows no n8n apontando para estes endpoints.'
        : 'Defina N8N_WEBHOOK_URL e N8N_WEBHOOK_SECRET (ou N8N_ENABLED=1) no Render.',
    });
  });

  app.post(
    '/api/n8n/ping',
    inboundLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      if (!requireN8nSecret(req, res)) return;
      const r = await pingN8n();
      res.status(r.ok ? 200 : 503).json(r);
    })
  );

  /**
   * Captação de lead (Google Maps / listas / formulário).
   * Body sugerido:
   * {
   *   "nome_empresa": "Padaria X",
   *   "telefone": "11999998888",
   *   "email": "contato@x.com",
   *   "cidade": "São Paulo",
   *   "fonte": "google_maps",
   *   "maps_url": "https://...",
   *   "notas": "opcional"
   * }
   *
   * NÃO envia mensagem automática — só registra e devolve id.
   * O workflow n8n decide se/quando contatar (anti-spam).
   */
  app.post(
    '/api/n8n/inbound/lead',
    inboundLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      if (!requireN8nSecret(req, res)) return;

      const body = req.body || {};
      const nome = String(body.nome_empresa || body.nome || body.name || '').trim();
      if (!nome || nome.length < 2) {
        return res.status(400).json({ error: 'nome_empresa obrigatório.' });
      }

      const telefone = normalizarWhatsapp(body.telefone || body.whatsapp || body.phone || null);
      const email = body.email ? String(body.email).trim().toLowerCase() : null;
      const fonte = String(body.fonte || body.source || 'n8n').slice(0, 64);
      const cidade = body.cidade ? String(body.cidade).slice(0, 80) : null;
      const mapsUrl = body.maps_url || body.google_maps_url || body.url || null;
      const notas = body.notas || body.notes || null;

      const db = getDb();
      await ensureLeadsTable(db);

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.run(
        `INSERT INTO n8n_leads
          (id, nome_empresa, telefone, email, cidade, fonte, maps_url, notas, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'novo', ?)`,
        [
          id,
          nome.slice(0, 160),
          telefone,
          email,
          cidade,
          fonte,
          mapsUrl ? String(mapsUrl).slice(0, 500) : null,
          notas ? String(notas).slice(0, 1000) : null,
          now,
        ]
      );

      // Eco opcional de volta ao n8n (outro fluxo) — sem WPP automático
      dispatchN8nEvent(
        'lead.captured',
        {
          lead_id: id,
          nome_empresa: nome,
          telefone,
          email,
          cidade,
          fonte,
          maps_url: mapsUrl,
        },
        {}
      ).catch(() => null);

      res.status(201).json({
        success: true,
        lead_id: id,
        status: 'novo',
        message:
          'Lead registrado. Contato comercial deve ser feito pelo workflow n8n (sem spam automático na API).',
      });
    })
  );

  /**
   * Review vinda do n8n (ex.: sincronização manual / import).
   * Reusa criarReview com as mesmas regras de quota/fraude.
   */
  app.post(
    '/api/n8n/inbound/review',
    inboundLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      if (!requireN8nSecret(req, res)) return;

      const body = req.body || {};
      const empresaRef = String(body.empresa_id || body.empresa_ref || body.slug || '').trim();
      if (!empresaRef) {
        return res.status(400).json({ error: 'empresa_id ou slug obrigatório.' });
      }

      try {
        const result = await criarReview({
          name: body.name ? String(body.name) : body.nome ? String(body.nome) : undefined,
          comment: body.comment ? String(body.comment) : body.comentario ? String(body.comentario) : undefined,
          rating: Number(body.rating),
          empresa_ref: empresaRef,
          empresa_id: body.empresa_id ? String(body.empresa_id) : undefined,
          client_whatsapp: body.client_whatsapp || body.whatsapp || undefined,
          locale: body.locale ? String(body.locale) : undefined,
          is_test: Boolean(body.is_test),
          ip: 'n8n',
        });
        res.status(201).json({ success: true, ...result, source: 'n8n' });
      } catch (e: any) {
        const status = e?.status || 500;
        res.status(status >= 400 && status < 600 ? status : 500).json({
          error: e?.message || 'Falha ao criar review',
        });
      }
    })
  );
}

async function ensureLeadsTable(db: any) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS n8n_leads (
      id TEXT PRIMARY KEY,
      nome_empresa TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      cidade TEXT,
      fonte TEXT,
      maps_url TEXT,
      notas TEXT,
      status TEXT DEFAULT 'novo',
      created_at TEXT NOT NULL
    )
  `);
  try {
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_n8n_leads_created ON n8n_leads(created_at)`);
  } catch {
    /* */
  }
}
