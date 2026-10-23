import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import { autenticarToken, isAdminUser, type AuthRequest } from '../lib/auth.js';
import { getDb } from '../lib/db.js';
import { ensureAcquisitionSchema } from './acquisitionRoutes.js';
import {
  AcquisitionContentError,
  acquisitionContentOverview,
  approveAcquisitionContent,
  generateAcquisitionContent,
  listAcquisitionContent,
  publishAcquisitionContent,
  rejectAcquisitionContent,
} from '../services/acquisitionContent.js';

const baseSchemaReady = new WeakSet<object>();

function webhookSecretOk(req: Request): boolean {
  const expected = String(process.env.N8N_INBOUND_SECRET || process.env.N8N_WEBHOOK_SECRET || '').trim();
  const received = String(req.headers['x-filtra-secret'] || '').trim();
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function adminOnly(req: AuthRequest, res: Response): boolean {
  if (!isAdminUser(req.user)) {
    res.status(403).json({ error: 'Acesso negado.' });
    return false;
  }
  return true;
}

function errorStatus(error: unknown): number {
  if (error instanceof AcquisitionContentError) return error.statusCode;
  return 500;
}

function errorMessage(error: unknown): string {
  if (error instanceof AcquisitionContentError) return error.message;
  return 'Falha interna na automação de conteúdo.';
}

function route(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      const status = errorStatus(error);
      if (status >= 500) console.error('[acquisition-content]', error);
      res.status(status).json({ error: errorMessage(error) });
    }
  };
}

async function ensureSchema(): Promise<void> {
  const db = getDb();
  if (baseSchemaReady.has(db)) return;
  await ensureAcquisitionSchema(db);
  baseSchemaReady.add(db);
}

export function mountAcquisitionContentRoutes(app: Express): void {
  app.get(
    '/api/admin/acquisition/overview',
    autenticarToken,
    route(async (req, res) => {
      if (!adminOnly(req, res)) return;
      await ensureSchema();
      res.json(await acquisitionContentOverview(getDb()));
    }),
  );

  app.get(
    '/api/admin/acquisition/content',
    autenticarToken,
    route(async (req, res) => {
      if (!adminOnly(req, res)) return;
      await ensureSchema();
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const limit = Number(req.query.limit || 50);
      const items = await listAcquisitionContent(getDb(), { status, limit });
      res.json({ ok: true, items });
    }),
  );

  app.post(
    '/api/admin/acquisition/content/generate',
    autenticarToken,
    route(async (req, res) => {
      if (!adminOnly(req, res)) return;
      await ensureSchema();
      const result = await generateAcquisitionContent({
        db: getDb(),
        limit: req.body?.limit,
      });
      res.status(201).json({ ok: true, ...result });
    }),
  );

  app.post(
    '/api/admin/acquisition/content/:id/approve',
    autenticarToken,
    route(async (req, res) => {
      if (!adminOnly(req, res)) return;
      await ensureSchema();
      const item = await approveAcquisitionContent(getDb(), String(req.params.id), {
        title: typeof req.body?.title === 'string' ? req.body.title : undefined,
        body: typeof req.body?.body === 'string' ? req.body.body : undefined,
      });
      res.json({ ok: true, item });
    }),
  );

  app.post(
    '/api/admin/acquisition/content/:id/reject',
    autenticarToken,
    route(async (req, res) => {
      if (!adminOnly(req, res)) return;
      await ensureSchema();
      const item = await rejectAcquisitionContent(
        getDb(),
        String(req.params.id),
        typeof req.body?.reason === 'string' ? req.body.reason : '',
      );
      res.json({ ok: true, item });
    }),
  );

  app.post(
    '/api/admin/acquisition/content/:id/publish',
    autenticarToken,
    route(async (req, res) => {
      if (!adminOnly(req, res)) return;
      await ensureSchema();
      const result = await publishAcquisitionContent(getDb(), String(req.params.id));
      res.json({ ok: true, ...result });
    }),
  );

  app.post(
    '/api/n8n/acquisition/content/generate',
    route(async (req, res) => {
      if (!webhookSecretOk(req)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await ensureSchema();
      const result = await generateAcquisitionContent({
        db: getDb(),
        limit: req.body?.limit,
      });
      res.status(201).json({ ok: true, ...result });
    }),
  );

  app.get(
    '/api/n8n/acquisition/content/pending',
    route(async (req, res) => {
      if (!webhookSecretOk(req)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await ensureSchema();
      const limit = Number(req.query.limit || 20);
      const items = await listAcquisitionContent(getDb(), { status: 'pending_review', limit });
      res.json({ ok: true, items });
    }),
  );
}
