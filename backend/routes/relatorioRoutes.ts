/**
 * Relatório PDF mensal — autenticado, cache em disco, SEM tokens de IA.
 * Suporta ?lang=pt|en|es|zh e diferencia conteúdo por plano (v8).
 */
import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getDb, findEmpresa } from '../lib/db.js';
import { gerarRelatorioMensalPDF, ensureUnidadesSchema, PDF_LAYOUT_VERSION, cycleWindowFromExpiry } from '../relatorioPdf.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateReportMonth } from '../lib/dateValidation.js';
import { planTemPdf } from '../lib/plans.js';
import { logPdfGeneration } from '../lib/opsLog.js';
import {
  autenticarToken,
  isAdminUser,
  type AuthRequest,
} from '../lib/auth.js';
import { readPdfCache, writePdfCache } from '../lib/pdfCache.js';

const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitos downloads de PDF deste IP. Aguarde um pouco.' },
});

function podeAcessarEmpresa(req: AuthRequest, empresaId: string): boolean {
  if (isAdminUser(req.user)) return true;
  return Boolean(req.user?.empresa_id && req.user.empresa_id === empresaId);
}

function authModeOf(req: AuthRequest): string {
  if (isAdminUser(req.user)) return 'jwt_admin';
  if (req.user?.empresa_id) return 'jwt_cliente';
  return 'jwt';
}

function normalizeLang(raw: unknown): string {
  const s = String(raw || '').toLowerCase().trim();
  if (s.startsWith('en')) return 'en';
  if (s.startsWith('es')) return 'es';
  if (s.startsWith('zh') || s.startsWith('cn')) return 'zh';
  return 'pt';
}

export function mountRelatorioRoutes(app: Express) {
  app.get(
    '/api/empresa/:ref/relatorio.pdf',
    pdfLimiter,
    autenticarToken,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const t0 = Date.now();
      const auth_mode = authModeOf(req);
      const db = getDb();

      const empresa = await findEmpresa(req.params.ref);
      if (!empresa) {
        await logPdfGeneration(db, {
          status: 'error',
          error: 'Empresa não encontrada',
          auth_mode,
          duration_ms: Date.now() - t0,
        });
        return res.status(404).json({ error: 'Empresa não encontrada.' });
      }

      if (!podeAcessarEmpresa(req, empresa.id)) {
        await logPdfGeneration(db, {
          empresa_id: empresa.id,
          empresa_nome: empresa.nome_empresa,
          status: 'forbidden',
          error: 'Sem permissão',
          auth_mode,
          duration_ms: Date.now() - t0,
        });
        return res.status(403).json({ error: 'Sem permissão para baixar este relatório.' });
      }

      const plan = String(empresa.plan || '').toLowerCase();
      if (!planTemPdf(plan)) {
        await logPdfGeneration(db, {
          empresa_id: empresa.id,
          empresa_nome: empresa.nome_empresa,
          status: 'forbidden',
          error: `Plano ${plan} sem PDF`,
          auth_mode,
          duration_ms: Date.now() - t0,
        });
        return res.status(403).json({
          error:
            'Relatório PDF não disponível neste plano. Use o seletor de plano no painel (modo teste) ou faça upgrade.',
          plan,
        });
      }

      const explicitMonth = req.query.mes !== undefined && String(req.query.mes).trim() !== '';
      let mesAno = '';
      let reportWindow = null as ReturnType<typeof cycleWindowFromExpiry>;
      if (explicitMonth) {
        const mesCheck = validateReportMonth(req.query.mes, {
          defaultToCurrent: false,
          minYear: 2020,
          allowFutureMonths: 0,
        });
        if (!mesCheck.ok) {
          await logPdfGeneration(db, {
            empresa_id: empresa.id,
            empresa_nome: empresa.nome_empresa,
            status: 'error',
            error: mesCheck.error,
            auth_mode,
            duration_ms: Date.now() - t0,
          });
          return res.status(400).json({
            error: mesCheck.error,
            exemplo: '2026-09',
          });
        }
        mesAno = mesCheck.value;
      } else if (plan !== 'trial' && String(empresa.status || '').toLowerCase() !== 'trial') {
        // Paid subscriptions use the current billing period, whose end is expira_em.
        // The explicit ?mes=YYYY-MM path remains available for historical calendar-month reports.
        reportWindow = cycleWindowFromExpiry((empresa as any).expira_em);
        if (reportWindow) {
          mesAno = reportWindow.end.toISOString().slice(0, 7);
        } else {
          const mesCheck = validateReportMonth(undefined, {
            defaultToCurrent: true,
            minYear: 2020,
            allowFutureMonths: 0,
          });
          if (!mesCheck.ok) throw new Error(mesCheck.error);
          mesAno = mesCheck.value;
        }
      } else {
        const mesCheck = validateReportMonth(undefined, {
          defaultToCurrent: true,
          minYear: 2020,
          allowFutureMonths: 0,
        });
        if (!mesCheck.ok) throw new Error(mesCheck.error);
        mesAno = mesCheck.value;
      }

      const lang = normalizeLang(
        req.query.lang || (empresa as any).locale || (empresa as any).idioma || (empresa as any).language
      );
      const version = PDF_LAYOUT_VERSION || 'v8';
      const cacheKey = reportWindow?.key || mesAno;

      const cached = readPdfCache(empresa.id, cacheKey, plan, lang, version);
      if (cached) {
        await logPdfGeneration(db, {
          empresa_id: empresa.id,
          empresa_nome: empresa.nome_empresa,
          mes: mesAno,
          status: 'ok',
          bytes: cached.length,
          auth_mode: auth_mode + '_cache',
          duration_ms: Date.now() - t0,
        });
        const slug = (empresa as any).slug || empresa.id.slice(0, 8);
        const cacheFilename = reportWindow
          ? `relatorio-${slug}-ciclo-${reportWindow.end.toISOString().slice(0, 10)}-${lang}.pdf`
          : `relatorio-${slug}-${mesAno}-${lang}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${cacheFilename}"`
        );
        res.setHeader('X-PDF-Cache', 'HIT');
        res.setHeader('X-PDF-Lang', lang);
        res.setHeader('X-PDF-Version', version);
        return res.send(cached);
      }

      await ensureUnidadesSchema(db);

      let pdf: Buffer;
      try {
        pdf = await gerarRelatorioMensalPDF(db, empresa.id, mesAno, undefined, lang, reportWindow);
      } catch (e: any) {
        await logPdfGeneration(db, {
          empresa_id: empresa.id,
          empresa_nome: empresa.nome_empresa,
          mes: mesAno,
          status: 'error',
          error: e?.message || 'Falha geração PDF',
          auth_mode,
          duration_ms: Date.now() - t0,
        });
        console.error('[pdf] generation error:', e?.message || e, e?.stack);
        throw e;
      }

      writePdfCache(empresa.id, cacheKey, plan, pdf, lang, version);

      await logPdfGeneration(db, {
        empresa_id: empresa.id,
        empresa_nome: empresa.nome_empresa,
        mes: mesAno,
        status: 'ok',
        bytes: pdf.length,
        auth_mode,
        duration_ms: Date.now() - t0,
      });

      const slug = (empresa as any).slug || empresa.id.slice(0, 8);
      const filename = reportWindow
        ? `relatorio-${slug}-ciclo-${reportWindow.end.toISOString().slice(0, 10)}-${lang}.pdf`
        : `relatorio-${slug}-${mesAno}-${lang}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-PDF-Cache', 'MISS');
      res.setHeader('X-PDF-Lang', lang);
      res.setHeader('X-PDF-Version', version);
      res.send(pdf);
    })
  );
}
