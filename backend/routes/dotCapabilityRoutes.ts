import type { Express } from 'express';
import { listDotCapabilities } from '../services/dotCapabilities.js';

export function mountDotCapabilityRoutes(app: Express) {
  app.get('/api/dot/agent/capabilities', (_req, res) => res.json({ ok: true, capabilities: listDotCapabilities() }));
}
