/**
 * Headers de segurança + request id (sem dependência helmet pesada).
 */
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = String(req.headers['x-request-id'] || '').trim();
  // Nunca ecoar arbitrariamente um header controlado pelo cliente. Além de
  // evitar log/header injection, isso mantém IDs curtos e previsíveis para observabilidade.
  const id = /^[A-Za-z0-9._:-]{1,100}$/.test(incoming) ? incoming : crypto.randomUUID();
  (req as any).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  // API JSON — CSP restritiva no próprio browser do client é do Next; aqui só API
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
}
