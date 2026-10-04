import type { Express } from 'express';
import { listDotCapabilities } from '../services/dotCapabilities.js';
import { listDotConnectors } from '../services/dotConnector.js';

export function mountDotCapabilityRoutes(app: Express) {
  app.get('/api/dot/agent/capabilities', (_req, res) => res.json({ ok: true, capabilities: listDotCapabilities() }));
}
