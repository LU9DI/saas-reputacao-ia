export type ClientReportStats = {
  total: number;
  ratedCount: number;
  positive: number;
  critical: number;
  average: number;
  sentiment: { positivo: number; neutro: number; negativo: number };
  themes: { name: string; count: number }[];
  /** Contagem por estrela 1–5 (opcional; barras do sample). */
  distribution?: number[];
};

export type ClientReportPayload = {
  companyName: string;
  periodLabel: string;
  lang: string;
  logoUrl?: string;
  plan?: string;
  stats: ClientReportStats;
  evolution: number | null;
  recommendations: string[];
  labels: {
    title: string;
    avg: string;
    reviews: string;
    positive: string;
    critical: string;
    evolution: string;
    evolutionEmpty: string;
    evolutionText: string;
    sentiment: string;
    sentPos: string;
    sentNeu: string;
    sentNeg: string;
    pointsPos: string;
    pointsCrit: string;
    recommendations: string;
    themes: string;
    footer: string;
    brand: string;
    [key: string]: any;
  };
};

export type ReportExportResult = { ok: boolean; mode: 'pdf-download' | 'failed' };

import { exportReportPdfDirect, previewReportPdfDirect } from './reportPdfDirect';

export function openReportPrintWindow(_payload: ClientReportPayload) {
  return false;
}

/** Abre nova aba, gera PDF no browser e exibe para visualização/download. */
export function exportReportClient(payload: ClientReportPayload): ReportExportResult {
  if (typeof window === 'undefined') return { ok: false, mode: 'failed' };
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) return { ok: false, mode: 'failed' };
  try {
    previewWindow.document.title = `${payload.labels.title} — ${payload.companyName}`;
    previewWindow.document.body.innerHTML =
      '<div style="font-family:Arial,sans-serif;padding:40px;color:#64748b">Gerando relatório…</div>';
  } catch {
    /* */
  }
  void previewReportPdfDirect(payload, previewWindow).catch(() => undefined);
  return { ok: true, mode: 'pdf-download' };
}

export { exportReportPdfDirect };
