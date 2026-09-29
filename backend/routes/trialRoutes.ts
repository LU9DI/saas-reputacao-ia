import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody, schemaTrialAtivar } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  ativarTrial,
  TrialConflictError,
  TrialValidationError,
  verificarTrialEmail,
} from '../services/trialService.js';

const trialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Limite de ativações excedido. Tente mais tarde.' },
});

function clientIp(req: Request): string {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) {
    return xf.split(',')[0].trim();
  }
  if (Array.isArray(xf) && xf[0]) {
    return String(xf[0]).split(',')[0].trim();
  }
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.trim()) return real.trim();
  return String(req.ip || (req.socket as any)?.remoteAddress || '').trim();
}

export function mountTrialRoutes(app: Express) {

  app.get(
    '/api/trial/verificar',
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const result = await verificarTrialEmail(String(req.query.token || ''), undefined, res);
        return res.status(200).json(result);
      } catch (e: any) {
        if (e instanceof TrialValidationError || e?.name === 'TrialValidationError') {
          return res.status(400).json({ error: e.message });
        }
        console.error('[trial/verificar]', e?.message || e);
        return res.status(500).json({ error: 'Não foi possível confirmar o e-mail.' });
      }
    })
  );
  app.post(
    '/api/trial/ativar',
    trialLimiter,
    validateBody(schemaTrialAtivar),
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const result = await ativarTrial(
          {
            nome_empresa: String(req.body.nome_empresa),
            email: String(req.body.email),
            senha: String(req.body.senha),
            google_review_url: req.body.google_review_url
              ? String(req.body.google_review_url)
              : undefined,
            whatsapp: req.body.whatsapp ? String(req.body.whatsapp) : undefined,
            locale: req.body.locale ? String(req.body.locale) : undefined,
            signup_ip: clientIp(req),
          },
          undefined,
          res
        );
        return res.status(201).json(result);
      } catch (e: any) {
        if (e instanceof TrialConflictError || e?.name === 'TrialConflictError') {
          return res.status(409).json({
            error: e.message || 'Este e-mail ou IP já utilizou o período de testes.',
          });
        }
        if (e instanceof TrialValidationError || e?.name === 'TrialValidationError') {
          return res.status(400).json({ error: e.message });
        }
        if (e?.status && e.status < 500) {
          return res.status(e.status).json({ error: e.message });
        }
        console.error('[trial/ativar]', e?.code, e?.message || e);
        return res.status(500).json({
          error: 'Erro ao ativar trial.',
          detail: String(e?.message || e).slice(0, 240),
        });
      }
    })
  );
}
