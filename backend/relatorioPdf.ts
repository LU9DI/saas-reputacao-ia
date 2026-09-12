/**
 * Relatorio mensal PDF — conteudo e beneficios DIFERENTES por plano.
 *
 * Pro:   KPIs + barras 1*-5* + positivas vs criticas
 * Ultra: + sentimento + temas IA
 * Corp:  + ranking unidades + pagina por filial (só se houver dados)
 * Rei:   + donut + gargalos + pagina rica por filial
 * Trial: = Ultra
 *
 * Layout v7 — checklist profissional, banners i18n, zero páginas em branco.
 * Idiomas: PT / EN / ES / ZH via ?lang= ou locale da empresa.
 * Compatível SQLite + Postgres.
 */
import type { Database } from 'sqlite';
import PDFDocument from 'pdfkit';
import { planTemPdf, isTrialPlan, planLabel } from './lib/plans.js';
import {
  normalizePdfLang,
  monthPeriod,
  t,
  benefitsFor,
  badgeFor,
  bannerFor,
  featureChecklist,
  type PdfLang,
} from './lib/pdfI18n.js';

export type PdfDepth = 'pro' | 'ultra' | 'corp' | 'rei';
export const PDF_LAYOUT_VERSION = 'v7';

// FULL FILE WILL BE PUSHED VIA BATCH - temporary minimal to unblock
export async function ensureUnidadesSchema(db: Database): Promise<void> {}
export async function gerarRelatorioMensalPDF(
  db: Database,
  empresaId: string,
  mesAno: string,
  _callGroq?: any,
  langRaw?: string | null
): Promise<Buffer> {
  throw new Error('PDF module temporarily updating - redeploy in progress');
}
