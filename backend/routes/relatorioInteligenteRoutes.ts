import type { Express, Response } from 'express';
import { getDb, findEmpresa } from '../lib/db.js';
import { gerarRelatorioInteligentePDF } from '../relatorioInteligentePdf.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { autenticarToken, isAdminUser, type AuthRequest } from '../lib/auth.js';
import { planTemPdf } from '../lib/plans.js';
import { readPdfCache, writePdfCache } from '../lib/pdfCache.js';

function dateOnly(value: unknown): string | null {
  const s = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isFinite(d.getTime()) ? s : null;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function canAccess(req: AuthRequest, empresaId: string) {
  return isAdminUser(req.user) || req.user?.empresa_id === empresaId;
}

export function mountRelatorioInteligenteRoutes(app: Express) {
  app.get('/api/empresa/:ref/relatorio-inteligente.pdf', autenticarToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const db = getDb();
    const empresa: any = await findEmpresa(req.params.ref);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });
    if (!canAccess(req, String(empresa.id))) return res.status(403).json({ error: 'Sem permissão.' });

    const plan = String(empresa.plan || empresa.status || '').toLowerCase();
    if (!planTemPdf(plan)) return res.status(403).json({ error: 'PDF não disponível neste plano.' });

    // O Relatório Inteligente do painel usa todos os dados atuais.
    // Portanto, quando o frontend não envia um período, o PDF deve fazer o mesmo,
    // sem exigir um seletor mensal/ciclo legado.
    const inicioParam = dateOnly(req.query.inicio);
    const fimParam = dateOnly(req.query.fim);
    const inicio = inicioParam || '1970-01-01';
    const fim = fimParam || todayUtc();
    if (new Date(`${inicio}T00:00:00Z`) >= new Date(`${fim}T00:00:00Z`)) {
      return res.status(400).json({ error: 'Período do ciclo inválido.' });
    }

    const langRaw = String(req.query.lang || 'pt').toLowerCase();
    const lang = ['pt', 'en', 'es', 'zh'].includes(langRaw) ? langRaw : 'pt';
    const key = `ciclo-${inicio}-${fim}`;
    const version = 'inteligente-v2';
    const cached = readPdfCache(String(empresa.id), key, plan, lang, version);
    const pdf = cached || await gerarRelatorioInteligentePDF(db, String(empresa.id), inicio, fim, lang);
    if (!cached) writePdfCache(String(empresa.id), key, plan, pdf, lang, version);

    const slug = String(empresa.slug || empresa.id).replace(/[^a-z0-9_-]+/gi, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-inteligente-${slug}-${fim}.pdf"`);
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    res.setHeader('X-PDF-Cache', cached ? 'HIT' : 'MISS');
    return res.send(pdf);
  }));
}
