import type { ClientReportPayload, ReportExportResult } from './reportPdfClient';

const esc = (s: string) =>
  String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');

const pct = (n: number, t: number) => (t ? `${Math.round((n / t) * 100)}%` : '0%');

const slug = (s: string) =>
  String(s || 'empresa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'empresa';

type Depth = 'inicial' | 'pro' | 'ultra' | 'corp' | 'rei';

function planDisplayName(plan: string, lang: string): string {
  const p = String(plan || '').toLowerCase();
  if (p.includes('rei')) return 'Rei';
  if (p.includes('corp') || p.includes('empres')) return lang === 'en' ? 'Corporate' : 'Corporativo';
  if (p.includes('ultra') || p.includes('premium')) return 'Ultra';
  if (p.includes('trial') || p.includes('teste') || p.includes('trialing')) return 'Trial (Ultra)';
  if (p.includes('pro')) return 'Pro';
  if (p.includes('inicial') || p.includes('basic') || p.includes('starter')) return lang === 'en' ? 'Starter' : 'Inicial';
  return plan || 'Pro';
}

function depthOf(plan: string): Depth {
  const p = String(plan || '').toLowerCase();
  if (p.includes('rei')) return 'rei';
  if (p.includes('corp') || p.includes('empres')) return 'corp';
  if (p.includes('ultra') || p.includes('premium') || p.includes('trial') || p.includes('teste') || p.includes('trialing'))
    return 'ultra';
  if (p.includes('pro')) return 'pro';
  if (p.includes('inicial') || p.includes('basic') || p.includes('starter')) return 'inicial';
  return 'pro';
}

/** HTML do relatório — sem bloco de benefícios incluído/não incluso. */
function makeHtml(p: ClientReportPayload): string {
  const lang = String(p.lang || 'pt');
  const rawPlan = p.plan || 'trial';
  const depth = depthOf(rawPlan);
  const displayName = planDisplayName(rawPlan, lang);
  const s = p.stats;
  const total = s.ratedCount || s.total || 0;
  const avg = s.average ? s.average.toFixed(1) : '—';
  const company = String(p.companyName || '').trim() || 'Empresa';
  const period = String(p.periodLabel || '').trim();
  const rights =
    p.labels?.rights ||
    '© Filtra.AI — Todos os direitos reservados. Documento confidencial. Uso exclusivo do assinante.';

  const dist =
    Array.isArray((s as any).distribution) && (s as any).distribution.length === 5
      ? (s as any).distribution.map((n: number) => Number(n) || 0)
      : [0, 0, 0, 0, 0];
  const maxD = Math.max(...dist, 1);
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
  const bars = dist
    .map((v: number, i: number) => {
      const w = Math.max(v > 0 ? 4 : 0, Math.round((v / maxD) * 100));
      return `<div class="bar-row"><span class="star">${i + 1}★</span><div class="track"><div class="fill" style="width:${w}%;background:${colors[i]}"></div></div><span class="cnt">${v}</span></div>`;
    })
    .join('');

  const showSent = depth === 'ultra' || depth === 'corp' || depth === 'rei';
  const sent = (s as any).sentiment || { positivo: 0, neutro: 0, negativo: 0 };
  const sentTotal = (sent.positivo || 0) + (sent.neutro || 0) + (sent.negativo || 0) || 1;
  const sentBlock = showSent
    ? `<h2 class="sec">Análise de sentimento (IA)</h2>
       <section class="kpis">
         <div class="kpi"><small>Positivo</small><b class="g">${sent.positivo || 0}</b><span>${pct(sent.positivo || 0, sentTotal)}</span></div>
         <div class="kpi"><small>Neutro</small><b>${sent.neutro || 0}</b><span>${pct(sent.neutro || 0, sentTotal)}</span></div>
         <div class="kpi"><small>Negativo</small><b class="r">${sent.negativo || 0}</b><span>${pct(sent.negativo || 0, sentTotal)}</span></div>
       </section>`
    : '';

  const themes = Array.isArray((s as any).themes) ? (s as any).themes : [];
  const themesBlock = showSent
    ? `<h2 class="sec">Temas mais citados (IA)</h2>
         <section class="themes">${
           themes.length
             ? themes
                 .map((t: any) => `<div class="theme">• ${esc(t.name)} <b>(${t.count})</b></div>`)
                 .join('')
             : '<div class="themes-empty">Nenhum tema de IA neste ciclo ainda.</div>'
         }</section>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #18181b; background: #fff; }
  .report { width: 794px; min-height: 1123px; padding: 40px 48px 56px; display: flex; flex-direction: column; position: relative; }
  .hero { margin-bottom: 28px; }
  .brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .brand { font-weight: 700; font-size: 14px; letter-spacing: 0.06em; color: #3b82f6; }
  .plan-title { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
  .plan-sub { font-size: 12px; color: #71717a; margin-bottom: 14px; }
  .company { font-size: 16px; font-weight: 600; }
  .cycle { font-size: 12px; color: #52525b; margin-top: 4px; }
  .badge-plan { display: inline-block; margin-top: 10px; padding: 4px 10px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; }
  h2.sec { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #52525b; margin: 22px 0 12px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .kpi { border: 1px solid #e4e4e7; border-radius: 12px; padding: 12px; }
  .kpi small { display: block; font-size: 10px; color: #71717a; text-transform: uppercase; }
  .kpi b { display: block; font-size: 22px; margin: 6px 0 2px; }
  .kpi span { font-size: 11px; color: #71717a; }
  .kpi b.g { color: #16a34a; }
  .kpi b.r { color: #dc2626; }
  .bar-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 12px; }
  .star { width: 28px; }
  .track { flex: 1; height: 8px; background: #f4f4f5; border-radius: 99px; overflow: hidden; }
  .fill { height: 100%; border-radius: 99px; }
  .cnt { width: 28px; text-align: right; color: #52525b; }
  .theme { font-size: 13px; margin: 4px 0; }
  .themes-empty { font-size: 12px; color: #71717a; }
  footer { margin-top: auto; padding-top: 24px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #71717a; }
  .foot-grid { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
  .foot-brand { font-weight: 700; color: #3b82f6; }
</style></head><body>
<div class="report" id="filtra-report">
  <div class="hero">
    <div class="brand-row"><span class="brand">Filtra.AI</span></div>
    <div class="plan-title">PLANO ${esc(displayName.toUpperCase())}</div>
    <div class="plan-sub">Relatório do ciclo</div>
    <div class="company">${esc(company)}</div>
    <div class="cycle">${esc(period)} · Plano: <strong>${esc(displayName)}</strong></div>
    <span class="badge-plan">${esc(displayName)}</span>
  </div>
  <h2 class="sec">Resumo do ciclo</h2>
  <section class="kpis">
    <div class="kpi"><small>Volume</small><b>${s.total || 0}</b><span>avaliações</span></div>
    <div class="kpi"><small>Nota média</small><b>${esc(avg)}</b><span>escala 1–5</span></div>
    <div class="kpi"><small>Positivas</small><b class="g">${s.positive || 0}</b><span>${pct(s.positive || 0, total)} · 4–5★</span></div>
    <div class="kpi"><small>Críticas</small><b class="r">${s.critical || 0}</b><span>${pct(s.critical || 0, total)} · 1–3★</span></div>
  </section>
  <h2 class="sec">Distribuição de notas</h2>
  <section class="bars">${bars}</section>
  ${sentBlock}${themesBlock}
  <footer>
    <div class="foot-grid">
      <div><div class="foot-brand">Filtra.AI</div><div>Plano ${esc(displayName)}</div></div>
      <div>${esc(company)} · ${esc(period)}</div>
    </div>
    <div>${esc(rights)}</div>
  </footer>
</div>
</body></html>`;
}

type Html2PdfFactory = (() => any) & { default?: () => any };

function loadHtml2Pdf(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('PDF generation requires a browser'));
  const current = (window as any).html2pdf as Html2PdfFactory | undefined;
  if (current) return Promise.resolve(current);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-filtra-html2pdf="1"]') as HTMLScriptElement | null;
    if (existing) {
      const onReady = () => {
        const factory = (window as any).html2pdf;
        if (factory) resolve(factory); else reject(new Error('html2pdf não carregou'));
      };
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar html2pdf')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.14.0/html2pdf.bundle.min.js';
    script.async = true;
    script.dataset.filtraHtml2pdf = '1';
    script.onload = () => {
      const factory = (window as any).html2pdf;
      if (factory) resolve(factory); else reject(new Error('html2pdf não carregou'));
    };
    script.onerror = () => reject(new Error('Falha ao carregar html2pdf'));
    document.head.appendChild(script);
  });
}

async function waitImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
            setTimeout(() => res(), 2000);
          })
    )
  );
}

function toBlob(value: unknown): Blob {
  if (value instanceof Blob) return value;
  if (typeof value === 'string') {
    // data URL ou base64
    if (value.startsWith('data:')) {
      const [meta, data] = value.split(',');
      const isBase64 = /;base64/i.test(meta || '');
      const bytes = isBase64 ? atob(data || '') : decodeURIComponent(data || '');
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      return new Blob([arr], { type: 'application/pdf' });
    }
    return new Blob([value], { type: 'application/pdf' });
  }
  throw new Error('html2pdf não retornou Blob');
}

export async function createReportPdfBlob(payload: ClientReportPayload): Promise<Blob> {
  const html = makeHtml(payload);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-100000px;top:0;width:794px;height:1123px;border:0;';
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
    await new Promise((r) => setTimeout(r, 50));
    const reportEl = doc.getElementById('filtra-report') as HTMLElement;
    if (reportEl) await waitImages(reportEl);
    if (reportEl && reportEl.scrollHeight < 1123) {
      reportEl.style.minHeight = '1123px';
      reportEl.style.height = '1123px';
    }
    const html2pdf = await loadHtml2Pdf();
    const opt = {
      margin: 0,
      filename: `filtra-relatorio-${slug(payload.companyName || 'empresa')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: {
        unit: 'px' as const,
        format: [794, 1123] as [number, number],
        orientation: 'portrait' as const,
      },
    };
    const worker = html2pdf().set(opt).from(reportEl);
    const raw = await worker.outputPdf('blob');
    return toBlob(raw);
  } finally {
    try {
      document.body.removeChild(iframe);
    } catch {
      /* */
    }
  }
}

/** Usado pelo exportReportClient: gera PDF e exibe na aba aberta. */
export async function previewReportPdfDirect(
  payload: ClientReportPayload,
  previewWindow: Window
): Promise<void> {
  try {
    const blob = await createReportPdfBlob(payload);
    const url = URL.createObjectURL(blob);
    try {
      previewWindow.location.href = url;
    } catch {
      previewWindow.document.open();
      previewWindow.document.write(
        `<!DOCTYPE html><html><body style="margin:0">
         <iframe src="${url}" style="border:0;width:100%;height:100vh"></iframe>
         <p style="font-family:system-ui;padding:12px">
           <a href="${url}" download="filtra-relatorio-${slug(payload.companyName || 'empresa')}.pdf">Baixar PDF</a>
         </p></body></html>`
      );
      previewWindow.document.close();
    }
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  } catch (e: any) {
    try {
      previewWindow.document.body.innerHTML =
        `<div style="font-family:system-ui;padding:40px;color:#b91c1c">Falha ao gerar PDF: ${esc(
          String(e?.message || e)
        )}</div>`;
    } catch {
      /* */
    }
  }
}

export async function exportReportPdfDirect(payload: ClientReportPayload): Promise<ReportExportResult> {
  try {
    const blob = await createReportPdfBlob(payload);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtra-relatorio-${slug(payload.companyName || 'empresa')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { ok: true, mode: 'pdf-download' };
  } catch {
    return { ok: false, mode: 'failed' };
  }
}
