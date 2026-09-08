/**
 * CORS com lista de origens em produção.
<<<<<<< HEAD
 *
 * Env:
 *   CORS_ORIGINS=https://app.vercel.app,https://seudominio.com
 *   Se vazio em prod: usa APP_URL + FRONTEND_URL.
 *   Em development: reflete qualquer origin (credentials ok).
 *   Em produção sem allowlist: bloqueia Origin de browser (permite sem Origin = health/webhooks).
=======
 * Em origem bloqueada: falha sem ecoar o domínio na mensagem ao cliente.
>>>>>>> 4d10efc0aeb52dab05eae3aedaeceb6534ada2d5
 */
import type { CorsOptions } from 'cors';

export function buildCorsOptions(): CorsOptions {
  const isProd = process.env.NODE_ENV === 'production';

  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const defaults = [process.env.APP_URL, process.env.FRONTEND_URL]
    .filter(Boolean)
    .map((s) => String(s).replace(/\/$/, ''));

  // sempre inclui filtraai.com em produção
  const hardDefaults = isProd
    ? ['https://filtraai.com', 'https://www.filtraai.com']
    : [];

  const allowlist = [...new Set([...fromEnv, ...defaults, ...hardDefaults])];

  if (!isProd) {
    return { origin: true, credentials: true };
  }

  if (allowlist.length === 0) {
    console.warn(
      '[cors] PRODUÇÃO sem CORS_ORIGINS/APP_URL/FRONTEND_URL — requests com Origin serão bloqueados.'
    );
  }

  return {
    origin(origin, callback) {
<<<<<<< HEAD
      // curl, healthchecks, webhooks server-to-server
=======
>>>>>>> 4d10efc0aeb52dab05eae3aedaeceb6534ada2d5
      if (!origin) return callback(null, true);
      const o = origin.replace(/\/$/, '');
      if (allowlist.includes(o)) return callback(null, true);
      // log interno só — cliente recebe 403 genérico via error handler / cors
      console.warn('[cors] origem bloqueada');
      callback(new Error('Forbidden'));
    },
    credentials: true,
  };
}
