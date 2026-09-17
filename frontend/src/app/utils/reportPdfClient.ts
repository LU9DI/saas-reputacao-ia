/**
 * PDF leve no cliente — sem API, sem pdfkit, sem travar o servidor.
 * Usa janela de impressão do navegador (Salvar como PDF).
 */

export type ClientReportStats = {
  total: number;
  ratedCount: number;
  positive: number;
  critical: number;
  average: number;
  sentiment: { positivo: number; neutro: number; negativo: number };
  themes: { name: string; count: number }[];
};

export type ClientReportPayload = {
  companyName: string;
  periodLabel: string;
  lang: string;
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
  };
};

function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function pct(value: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/**
 * Abre uma página de impressão com o relatório.
 * No diálogo do navegador o usuário escolhe "Salvar como PDF".
 * Retorna true se a janela abriu.
 */
export function openReportPrintWindow(payload: ClientReportPayload): boolean {
  if (typeof window === 'undefined') return false;

  const { companyName, periodLabel, stats, evolution, recommendations, labels } = payload;
  const avg = stats.average ? stats.average.toFixed(1) : '—';
  const themesHtml = stats.themes.length
    ? `<ul>${stats.themes
        .map((t) => `<li>${esc(t.name)} (${t.count})</li>`)
        .join('')}</ul>`
    : `<p class="muted">—</p>`;

  const recHtml = recommendations.length
    ? `<ul>${recommendations.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`
    : `<p class="muted">—</p>`;

  const evoHtml =
    evolution === null
      ? `<p class="muted">${esc(labels.evolutionEmpty)}</p>`
      : `<p>${esc(labels.evolutionText)} <strong>${evolution > 0 ? '+' : ''}${evolution.toFixed(1)}</strong></p>`;

  const html = `<!DOCTYPE html>
<html lang="${esc(payload.lang)}">
<head>
  <meta charset="utf-8" />
  <title>${esc(labels.title)} — ${esc(companyName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; margin: 0; padding: 32px; line-height: 1.45; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 20px 0 8px; color: #312e81; text-transform: uppercase; letter-spacing: 0.04em; }
    .brand { color: #4f46e5; font-weight: 700; font-size: 12px; margin-bottom: 12px; }
    .sub { color: #64748b; font-size: 12px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
    .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #f8fafc; }
    .card span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; }
    .card strong { font-size: 22px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    ul { margin: 0; padding-left: 18px; }
    li { margin: 4px 0; font-size: 13px; }
    .muted { color: #94a3b8; font-size: 13px; }
    footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
    @media print {
      body { padding: 12mm; }
      .no-print { display: none !important; }
    }
    .hint { margin-bottom: 16px; padding: 10px 12px; background: #eef2ff; border-radius: 8px; font-size: 12px; color: #3730a3; }
  </style>
</head>
<body>
  <div class="no-print hint">Use <strong>Salvar como PDF</strong> / <strong>Save as PDF</strong> no diálogo de impressão.</div>
  <div class="brand">${esc(labels.brand)}</div>
  <h1>${esc(labels.title)}</h1>
  <p class="sub">${esc(companyName)} · ${esc(periodLabel)}</p>

  <div class="grid">
    <div class="card"><span>${esc(labels.avg)}</span><strong>${esc(avg)}</strong></div>
    <div class="card"><span>${esc(labels.reviews)}</span><strong>${stats.total}</strong></div>
    <div class="card"><span>${esc(labels.positive)}</span><strong>${pct(stats.positive, stats.ratedCount)}</strong></div>
    <div class="card"><span>${esc(labels.critical)}</span><strong>${pct(stats.critical, stats.ratedCount)}</strong></div>
  </div>

  <div class="row">
    <div>
      <h2>${esc(labels.evolution)}</h2>
      ${evoHtml}
    </div>
    <div>
      <h2>${esc(labels.sentiment)}</h2>
      <p>${esc(labels.sentPos)}: <strong>${stats.sentiment.positivo}</strong> ·
         ${esc(labels.sentNeu)}: <strong>${stats.sentiment.neutro}</strong> ·
         ${esc(labels.sentNeg)}: <strong>${stats.sentiment.negativo}</strong></p>
    </div>
  </div>

  <h2>${esc(labels.pointsPos)} / ${esc(labels.pointsCrit)}</h2>
  <p>${esc(labels.positive)}: ${stats.positive} · ${esc(labels.critical)}: ${stats.critical}</p>

  <h2>${esc(labels.themes)}</h2>
  ${themesHtml}

  <h2>${esc(labels.recommendations)}</h2>
  ${recHtml}

  <footer>${esc(labels.footer)}</footer>
  <script>
    window.onload = function () {
      setTimeout(function () { window.focus(); window.print(); }, 250);
    };
  </script>
</body>
</html>`;

  const w = window.open('', '_blank', 'noopener,noreferrer,width=820,height=900');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
