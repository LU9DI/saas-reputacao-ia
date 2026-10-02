import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody, type Schema } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createLead } from '../services/leadService.js';
import { TrialConflictError, TrialValidationError } from '../services/trialService.js';

const schemaLead: Schema = {
  nome_empresa: { required: true, type: 'string', min: 2, max: 120, message: 'Nome da empresa inválido.' },
  email: { required: true, type: 'email' },
  senha: { required: true, type: 'password_empresa' },
  google_review_url: { required: false, type: 'url', max: 500 },
  whatsapp: { required: false, type: 'string', max: 20 },
  locale: { required: false, type: 'string', max: 8 },
  consent: { required: true, type: 'boolean', message: 'Consentimento explícito é necessário.' },
  source: { required: false, type: 'string', max: 120 },
};

function clientIp(req: Request): string {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim();
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).split(',')[0].trim();
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.trim()) return real.trim();
  return String(req.ip || req.socket?.remoteAddress || '').trim();
}

const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de captações excedido. Tente novamente mais tarde.' },
});

export function mountLeadRoutes(app: Express) {
  app.post(
    '/api/lead',
    leadLimiter,
    validateBody(schemaLead),
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const result = await createLead(
          {
            nome_empresa: String(req.body.nome_empresa),
            email: String(req.body.email),
            senha: String(req.body.senha),
            google_review_url: req.body.google_review_url ? String(req.body.google_review_url) : undefined,
            whatsapp: req.body.whatsapp ? String(req.body.whatsapp) : undefined,
            locale: req.body.locale ? String(req.body.locale) : undefined,
            consent: req.body.consent === true,
            source: req.body.source ? String(req.body.source) : 'website',
            signup_ip: clientIp(req),
          },
          undefined,
          res,
        );
        return res.status(201).json(result);
      } catch (e: any) {
        if (e instanceof TrialConflictError || e?.name === 'TrialConflictError') {
          return res.status(409).json({ error: e.message || 'Este e-mail ou IP já utilizou o período de testes.' });
        }
        if (e instanceof TrialValidationError || e?.name === 'TrialValidationError') {
          return res.status(400).json({ error: e.message });
        }
        console.error('[lead]', e?.code, e?.message || e);
        return res.status(500).json({ error: 'Não foi possível processar sua inscrição.' });
      }
    }),
  );
}
