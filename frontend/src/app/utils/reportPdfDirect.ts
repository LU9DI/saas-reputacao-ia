import type { ClientReportPayload, ReportExportResult } from './reportPdfClient';
import { makeHtml } from './reportPdfMakeHtml';

const waitImages = (root: HTMLElement) =>
  Promise.all(
    Array.from(root.querySelectorAll('img')).map((i) =>
      i.complete ? Promise.resolve() : new Promise<void>((r) => { i.onload = () => r(); i.onerror = () => r(); })
    )
  ).then(() => undefined);

async function createReportPdfBlob(p: ClientReportPayload): Promise<Blob | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;width:794px;background:#fff;z-index:-1';
  host.innerHTML = makeHtml(p);
  document.body.appendChild(host);
  try {
    await waitImages(host);
    const mod = await import('html2pdf.js');
    const planSlug = String(p.plan || 'pro').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const companySlug = String(p.companyName || 'empresa').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const periodSlug = String(p.periodLabel || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const worker = mod.default().set({
      margin: 0,
      filename: `relatorio-${planSlug}-${companySlug}-${periodSlug}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false, letterRendering: true, windowWidth: 794 },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
    }).from(host.querySelector('.report') as HTMLElement) as any;
    const blob = await worker.outputPdf('blob');
    return blob instanceof Blob ? blob : null;
  } catch {
    return null;
  } finally {
    try { host.remove(); } catch { /* */ }
  }
}

export async function previewReportPdfDirect(p: ClientReportPayload, previewWindow: Window | null): Promise<ReportExportResult> {
  const blob = await createReportPdfBlob(p);
  if (!blob || !previewWindow) return { ok: false, mode: 'failed' };
  try {
    const url = URL.createObjectURL(blob);
    previewWindow.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { ok: true, mode: 'pdf-download' };
  } catch {
    return { ok: false, mode: 'failed' };
  }
}

export async function exportReportPdfDirect(p: ClientReportPayload): Promise<ReportExportResult> {
  const blob = await createReportPdfBlob(p);
  if (!blob) return { ok: false, mode: 'failed' };
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const planSlug = String(p.plan || 'pro').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const companySlug = String(p.companyName || 'empresa').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `relatorio-${planSlug}-${companySlug}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { ok: true, mode: 'pdf-download' };
  } catch {
    return { ok: false, mode: 'failed' };
  }
}
