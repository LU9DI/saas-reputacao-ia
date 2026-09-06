import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { clearAuthCookie, autenticarToken, type AuthRequest } from '../lib/auth.js';
import { validateBody, schemaLoginEmpresa } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { loginEmpresa, AuthUnauthorizedError } from '../services/authService.js';
import { getDb } from '../lib/db.js';
import { writeAuditFromReq } from '../lib/auditLog.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login.' },
});

export function mountAuthRoutes(app: Express) {
  app.post(
    '/api/auth/login',
    loginLimiter,
    validateBody(schemaLoginEmpresa),
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const result = await loginEmpresa(
          { cnpj: String(req.body.cnpj), senha: String(req.body.senha) },
          res,
          getDb(),
          req
        );
        res.json(result);
      } catch (e: any) {
        if (e instanceof AuthUnauthorizedError) {
          return res.status(401).json({ error: e.message });
        }
        if (e?.status) return res.status(e.status).json({ error: e.message });
        throw e;
      }
    })
  );

  app.post(
    '/api/auth/logout',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      // tenta identificar ator se houver cookie/token
      try {
        await new Promise<void>((resolve) => {
          autenticarToken(req, res, () => resolve());
        });
      } catch {
        /* sem token */
      }
      try {
        await writeAuditFromReq(getDb(), req, {
          action: 'auth.logout',
          actor_user_id: req.user?.id,
          empresa_id: req.user?.empresa_id,
          actor_role: req.user?.empresa_id === 'admin' ? 'admin' : 'empresa',
          result: 'ok',
        });
      } catch {
        /* */
      }
      clearAuthCookie(res);
      res.json({ success: true });
    })
  );
}
