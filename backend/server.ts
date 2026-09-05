/**
 * Filtra.IA — bootstrap da API
 * Rotas de domínio ficam em routes/ e lib/.
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import { assertEnvOrExit } from './lib/env.js';
import { initDB, getDb } from './lib/db.js';
import { requireJwtSecret, setAuthCookie, autenticarToken } from './lib/auth.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { mountTrialRoutes } from './routes/trialRoutes.js';
import { mountAuthRoutes } from './routes/authRoutes.js';
import { mountEmpresaRoutes } from './routes/empresaRoutes.js';
import { mountReviewRoutes } from './routes/reviewRoutes.js';
import { mountAdminListRoutes } from './routes/adminListRoutes.js';
import { mountPasswordResetRoutes } from './passwordResetRoutes.js';
import { mountAdminLoginRoute } from './adminLoginRoute.js';
import { mountAdminPasswordResetRoutes } from './adminPasswordReset.js';
import { mountMfaRoutes } from './mfa.js';
import { mountStripeRoutes } from './stripeRoutes.js';
import { stripeConfigured } from './stripeBilling.js';

assertEnvOrExit();
const JWT_SECRET = requireJwtSecret();

const app = express();
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.originalUrl?.startsWith('/api/webhook/stripe')) return next();
  return express.json({ limit: '20kb' })(req, res, next);
});
app.use(cors({ origin: true, credentials: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    stripe: stripeConfigured(),
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

const PORT = Number(process.env.PORT || 5000);

async function main() {
  await initDB();

  mountTrialRoutes(app);
  mountAuthRoutes(app);
  mountEmpresaRoutes(app);
  mountReviewRoutes(app);
  mountAdminListRoutes(app);

  mountAdminLoginRoute(app, getDb, { setAuthCookie, JWT_SECRET });
  mountAdminPasswordResetRoutes(app, getDb);
  mountMfaRoutes(app, getDb, { JWT_SECRET, setAuthCookie, autenticarToken });
  mountPasswordResetRoutes(app, getDb);
  mountStripeRoutes(app, getDb);

  // Sempre por último
  app.use(notFoundHandler);
  app.use(errorHandler);

  console.log(`💳 Stripe: ${stripeConfigured() ? 'ok' : 'OFF — defina STRIPE_SECRET_KEY no .env'}`);
  app.listen(PORT, () => {
    console.log(`🚀 API Filtra.IA em http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
