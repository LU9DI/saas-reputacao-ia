import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { callAI } from '../groqService.js';
import crypto from 'crypto';
import { getDb } from '../lib/db.js';
import { ensureAcquisitionSchema } from './acquisitionRoutes.js';
import { sanitizeAcquisitionAttribution } from '../services/acquisitionAttribution.js';

const diagnosticLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false, message: { error: 'Limite de diagnósticos atingido. Tente novamente mais tarde.' } });
type ReviewInput = { rating: number; text: string };

function cleanReviews(value: unknown): ReviewInput[] {
  if (!Array.isArray(value)) return [];
  return value.map((r: any) => ({ rating: Number(r?.rating), text: String(r?.text ?? r?.comment ?? '').trim().slice(0, 2000) }))
    .filter((r) => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5 && r.text.length >= 3).slice(0, 30);
}

function parseAi(text: string) {
  const cleaned = text.replace(/^\s*```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { return null; }
}

export function mountDiagnosticRoutes(app: Express) {
  app.post('/api/public/diagnostic', diagnosticLimiter, async (req: Request, res: Response) => {
    const company = String(req.body?.company || '').trim().slice(0, 160);
    const locale = String(req.body?.locale || 'pt').trim().slice(0, 10);
    const reviews = cleanReviews(req.body?.reviews);
    const leadId = String(req.body?.lead_id || '').trim().slice(0, 120);
    const attribution = sanitizeAcquisitionAttribution(req.body?.attribution);
    if (company.length < 2) return res.status(400).json({ error: 'Informe o nome da empresa.' });
    if (reviews.length < 3) return res.status(400).json({ error: 'Envie pelo menos 3 avaliações reais para gerar o diagnóstico.' });
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const distribution = [1,2,3,4,5].map((rating) => ({ rating, count: reviews.filter((r) => r.rating === rating).length }));
    const negative = reviews.filter((r) => r.rating <= 2).length;
    const positive = reviews.filter((r) => r.rating >= 4).length;
    const system = 'Você é o analista de reputação da Filtra.AI. Analise somente as avaliações fornecidas. Não invente fatos, métricas, clientes, canais ou causas. Responda em JSON válido com as chaves: summary, strengths (array de strings), risks (array de strings), recurring_themes (array de strings), actions (array de strings), confidence (low|medium|high). Cada afirmação deve ser sustentada pelo texto recebido. Locale: ' + locale + '.';
    const user = JSON.stringify({ company, review_count: reviews.length, average_rating: Number(average.toFixed(2)), distribution, reviews });
    try {
      const ai = await callAI(system, user, 700, 0.2, { tipo: 'public_diagnostic' });
      const analysis = parseAi(ai.text);
      if (!analysis) return res.status(502).json({ error: 'Não foi possível estruturar o diagnóstico agora. Tente novamente.' });
      if (leadId) {
        try {
          const db = getDb();
          await ensureAcquisitionSchema(db);
          await db.run(`INSERT INTO acquisition_events (id,lead_id,event_type,source,occurred_at,metadata_json)
            VALUES (?,?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(id) DO NOTHING`, [
            crypto.randomUUID(), leadId, 'diagnostic.completed', attribution.utm_source || 'website', JSON.stringify({ company, locale, review_count: reviews.length, attribution }).slice(0, 20000)
          ]);
          await db.run(`UPDATE acquisition_leads SET acquisition_stage='diagnosed', acquisition_next_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=? AND COALESCE(acquisition_suppressed,0)=0`, [leadId]);
        } catch (persistError: any) {
          console.warn('[acquisition] diagnostic persistence failed:', persistError?.message || persistError);
        }
      }
      return res.json({ ok: true, diagnostic: { company, review_count: reviews.length, average_rating: Number(average.toFixed(2)), positive_count: positive, negative_count: negative, distribution, ...analysis }, provider: ai.provider });
    } catch (error: any) {
      return res.status(503).json({ error: 'Diagnóstico temporariamente indisponível.', detail: process.env.NODE_ENV === 'production' ? undefined : String(error?.message || error) });
    }
  });
}
