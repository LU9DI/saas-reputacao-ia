/**
 * Relatório PDF mensal.
 * Geração local (PDFKit) — NÃO consome tokens de IA.
 * Pode ser baixado quantas vezes quiser; só precisa de autenticação.
 */
import type { Express, Request, Response } from 'express';
import { getDb, findEmpresa } from '../lib/db.js';
import { gerarRelatorioMensalPDF, ensureUnidadesSchema } from '../relatorioPdf.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateReportMonth } from '../lib/dateValidation.js';
import { planTemPdf } from '../lib/plans.js';
import { logPdfGeneration } from '../lib/opsLog.js';
import { autenticarToken, isAdminUser, type AuthRequest } from '../lib/auth.js';

function podeGerirEmpresa(req: AuthRequest, empresaId: string): boolean {
  if (isAdminUser(req.user)) return true;
  return Boolean(req.user?.empresa_id && req.user.empresa_id === empresaId);
}

function detectAuthMode(req: AuthRequest): string {
  if (isAdminUser(req.user)) return 'jwt_admin';
  if (req.user?.empresa_id) return 'jwt_cliente';
  return 'jwt';
}

export function mountRelatorioRoutes(app: Express) {
  app.get(
    '/api/empresa/:ref/relatorio.pdf',
    autenticarToken,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const t0 = Date.now();
      const auth_mode = detectAuthMode(req);
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

      if (!podeGerirEmpresa(req, empresa.id)) {
        await logPdfGeneration(db, {
          empresa_id: empresa.id,
          empresa_nome: empresa.nome_empresa,
          status: 'forbidden',
          error: 'Sem permissão',
          auth_mode,
          duration_ms: Date.now() - t0,
        });
        return res.status(403).json({ error: 'Sem permissão para baixar o relatório desta empresa.' });
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

      const mesCheck = validateReportMonth(req.query.mes, {
        defaultToCurrent: true,
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
      const mesAno = mesCheck.value;

      await ensureUnidadesSchema(db);

      // Sem callGroq → 0 tokens de IA. Re-downloads livres.
      let pdf: Buffer;
      try {
        pdf = await gerarRelatorioMensalPDF(db, empresa.id, mesAno);
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
        throw e;
      }

      await logPdfGeneration(db, {
        empresa_id: empresa.id,
        empresa_nome: empresa.nome_empresa,
        mes: mesAno,
        status: 'ok',
        bytes: pdf.length,
        auth_mode,
        duration_ms: Date.now() - t0,
      });

      const slug = empresa.slug || empresa.id.slice(0, 8);
      const filename = `relatorio-${slug}-${mesAno}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Filtra-Pdf-Tokens', '0');
      res.send(pdf);
    })
  );
}
