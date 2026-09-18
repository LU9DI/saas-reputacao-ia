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

type Depth = 'pro' | 'ultra' | 'corp' | 'rei';

function depthOf(plan: string): Depth {
  const p = String(plan || '').toLowerCase();
  if (p.includes('rei')) return 'rei';
  if (p.includes('corp') || p.includes('empres')) return 'corp';
  if (p.includes('ultra') || p.includes('trial') || p.includes('teste') || p.includes('premium')) return 'ultra';
  if (p.includes('pro')) return 'pro';
  return 'ultra';
}

function planHero(depth: Depth, lang: string): { title: string; subtitle: string } {
  const map: Record<Depth, Record<string, { title: string; subtitle: string }>> = {
    pro: {
      pt: { title: 'PLANO PRO', subtitle: 'Essencial — KPIs e distribuição' },
      en: { title: 'PRO PLAN', subtitle: 'Essential — KPIs and distribution' },
      es: { title: 'PLAN PRO', subtitle: 'Esencial — KPIs y distribución' },
      zh: { title: 'PRO 套餐', subtitle: '基础 — KPI 与分布' },
    },
    ultra: {
      pt: { title: 'PLANO ULTRA', subtitle: 'Essencial + inteligência de sentimento' },
      en: { title: 'ULTRA PLAN', subtitle: 'Essential + sentiment intelligence' },
      es: { title: 'PLAN ULTRA', subtitle: 'Esencial + inteligencia de sentimiento' },
      zh: { title: 'ULTRA 套餐', subtitle: '基础 + 情感智能' },
    },
    corp: {
      pt: { title: 'PLANO CORPORATIVO', subtitle: 'Ultra + multi-unidade e ranking' },
      en: { title: 'CORPORATE PLAN', subtitle: 'Ultra + multi-unit ranking' },
      es: { title: 'PLAN CORPORATIVO', subtitle: 'Ultra + multiunidad y ranking' },
      zh: { title: '企业版', subtitle: 'Ultra + 多门店排名' },
    },
    rei: {
      pt: { title: 'PLANO REI', subtitle: 'Executivo completo — filiais e visão avançada' },
      en: { title: 'REI PLAN', subtitle: 'Full executive — branches and advanced view' },
      es: { title: 'PLAN REI', subtitle: 'Ejecutivo completo — sucursales y visión avanzada' },
      zh: { title: 'REI 套餐', subtitle: '完整高管版 — 门店与高级视图' },
    },
  };
  const l = ['pt', 'en', 'es', 'zh'].includes(lang) ? lang : 'pt';
  return map[depth][l] || map[depth].pt;
}

function benefits(depth: Depth, lang: string): { in: string[]; out: string[] } {
  const all: Record<string, { label: string; min: Depth }[]> = {
    pt: [
      { label: 'Tudo do Pro', min: 'pro' },
      { label: 'Sentimento: positivo / neutro / negativo', min: 'ultra' },
      { label: 'Temas principais detectados pela IA', min: 'ultra' },
      { label: 'Ranking de filiais (Corporativo+)', min: 'corp' },
      { label: 'Ficha detalhada por unidade (Rei)', min: 'rei' },
    ],
    en: [
      { label: 'Everything in Pro', min: 'pro' },
      { label: 'Sentiment: positive / neutral / negative', min: 'ultra' },
      { label: 'Main themes detected by AI', min: 'ultra' },
      { label: 'Branch ranking (Corporate+)', min: 'corp' },
      { label: 'Detailed page per unit (Rei)', min: 'rei' },
    ],
    es: [
      { label: 'Todo de Pro', min: 'pro' },
      { label: 'Sentimiento: positivo / neutro / negativo', min: 'ultra' },
      { label: 'Temas principales detectados por IA', min: 'ultra' },
      { label: 'Ranking de sucursales (Corporativo+)', min: 'corp' },
      { label: 'Ficha detallada por unidad (Rei)', min: 'rei' },
    ],
    zh: [
      { label: '含 Pro', min: 'pro' },
      { label: '情感：正面 / 中性 / 负面', min: 'ultra' },
      { label: 'AI 检测的主要主题', min: 'ultra' },
      { label: '门店排名（企业版+）', min: 'corp' },
      { label: '每店详情页（Rei）', min: 'rei' },
    ],
  };
  const rank: Record<Depth, number> = { pro: 1, ultra: 2, corp: 3, rei: 4 };
  const cur = rank[depth];
  const l = ['pt', 'en', 'es', 'zh'].includes(lang) ? lang : 'pt';
  const items = all[l] || all.pt;
  return {
    in: items.filter((i) => cur >= rank[i.min]).map((i) => i.label),
    out: items.filter((i) => cur < rank[i.min]).map((i) => i.label),
  };
}

function sectionLabels(lang: string) {
  if (lang === 'en') {
    return {
      benefitsIn: 'Benefits in this PDF',
      benefitsOut: 'Not included in this plan',
      summary: 'Cycle summary',
      volume: 'Volume',
      volumeSub: 'reviews',
      avg: 'Average',
      avgSub: 'scale 1–5',
      positive: 'Positive',
      positiveSub: '4–5★',
      critical: 'Critical',
      criticalSub: '1–3★',
      dist: 'Rating distribution',
      sentiment: 'Sentiment (Ultra+ benefit)',
      themes: 'AI themes (Ultra+ benefit)',
      themesEmpty: 'No themes in this cycle yet — this section is part of your plan and appears when AI tags exist.',
      footer: 'Filtra.AI · PDF {{plan}} · plan benefits · subscription cycle',
      rights: '© Filtra.AI — All rights reserved. Confidential document.',
    };
  }
  if (lang === 'es') {
    return {
      benefitsIn: 'Beneficios de este PDF',
      benefitsOut: 'No incluido en este plan',
      summary: 'Resumen del ciclo',
      volume: 'Volumen',
      volumeSub: 'reseñas',
      avg: 'Nota media',
      avgSub: 'escala 1–5',
      positive: 'Positivas',
      positiveSub: '4–5★',
      critical: 'Críticas',
      criticalSub: '1–3★',
      dist: 'Distribución de notas',
      sentiment: 'Sentimiento (beneficio Ultra+)',
      themes: 'Temas de IA (beneficio Ultra+)',
      themesEmpty: 'Ningún tema en este ciclo aún — la sección forma parte de tu plan y aparece con tags de IA.',
      footer: 'Filtra.AI · PDF {{plan}} · beneficios del plan · ciclo de suscripción',
      rights: '© Filtra.AI — Todos los derechos reservados. Documento confidencial.',
    };
  }
  if (lang === 'zh') {
    return {
      benefitsIn: '本 PDF 权益',
      benefitsOut: '本套餐不含',
      summary: '周期摘要',
      volume: '数量',
      volumeSub: '评价',
      avg: '平均分',
      avgSub: '1–5 分',
      positive: '好评',
      positiveSub: '4–5★',
      critical: '差评',
      criticalSub: '1–3★',
      dist: '评分分布',
      sentiment: '情感分析（Ultra+）',
      themes: 'AI 主题（Ultra+）',
      themesEmpty: '本周期暂无主题 — 该板块属于您的套餐，有 AI 标签时显示。',
      footer: 'Filtra.AI · PDF {{plan}} · 套餐权益 · 订阅周期',
      rights: '© Filtra.AI — 保留所有权利。机密文件。',
    };
  }
  return {
    benefitsIn: 'Benefícios deste PDF',
    benefitsOut: 'Não incluso neste plano',
    summary: 'Resumo do ciclo',
    volume: 'Volume',
    volumeSub: 'avaliações',
    avg: 'Nota média',
    avgSub: 'escala 1–5',
    positive: 'Positivas',
    positiveSub: '4–5★',
    critical: 'Críticas',
    criticalSub: '1–3★',
    dist: 'Distribuição de notas',
    sentiment: 'Sentimento (benefício Ultra+)',
    themes: 'Temas da IA (benefício Ultra+)',
    themesEmpty:
      'Nenhum tema neste ciclo ainda — a seção faz parte do seu plano e aparece assim que houver tags de IA.',
    footer: 'Filtra.AI · PDF {{plan}} · benefícios do plano · ciclo de assinatura',
    rights: '© Filtra.AI — Todos os direitos reservados. Documento confidencial.',
  };
}

function distOf(p: ClientReportPayload): number[] {
  const anyStats = p.stats as { distribution?: number[] };
  if (Array.isArray(anyStats.distribution) && anyStats.distribution.length === 5) {
    return anyStats.distribution.map((n) => Number(n) || 0);
  }
  return [0, 0, 0, 0, 0];
}

function makeHtml(p: ClientReportPayload): string {
  const lang = String(p.lang || 'pt');
  const depth = depthOf(p.plan || 'trial');
  const hero = planHero(depth, lang);
  const bens = benefits(depth, lang);
  const L = sectionLabels(lang);
  const s = p.stats;
  const total = s.ratedCount || s.total || 0;
  const avg = s.average ? s.average.toFixed(1) : '—';
  const dist = distOf(p);
  const maxD = Math.max(...dist, 1);
  const showSent = depth !== 'pro';
  const showThemes = depth !== 'pro';
  const planKey = depth === 'corp' ? 'CORPORATIVO' : depth.toUpperCase();
  const footerLine = L.footer.replace('{{plan}}', planKey);
  const rights = p.labels.rights || L.rights;

  const bars = dist
    .map((v, i) => {
      const w = Math.max(v > 0 ? 4 : 0, Math.round((v / maxD) * 100));
      const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
      return `<div class="bar-row"><span class="star">${i + 1}★</span><div class="track"><div class="fill" style="width:${w}%;background:${colors[i]}"></div></div><span class="cnt">${v}</span></div>`;
    })
    .join('');

  const benIn = bens.in.map((x) => `<li><span class="ok">✓</span> ${esc(x)}</li>`).join('');
  const benOut = bens.out.length
    ? bens.out.map((x) => `<li><span class="no">○</span> ${esc(x)}</li>`).join('')
    : '<li><span class="no">—</span></li>';

  const themesHtml =
    s.themes && s.themes.length
      ? s.themes.map((t) => `<div class="theme">• ${esc(t.name)} <b>(${t.count})</b></div>`).join('')
      : `<div class="themes-empty">${esc(L.themesEmpty)}</div>`;

  const sentBlock = showSent
    ? `<h2 class="sec">${esc(L.sentiment)}</h2>
<section class="sent-grid">
  <div class="sent-card"><small class="g">${esc(p.labels.sentPos)}</small><b>${s.sentiment.positivo}</b><span>${pct(s.sentiment.positivo, total)}</span></div>
  <div class="sent-card"><small class="a">${esc(p.labels.sentNeu)}</small><b>${s.sentiment.neutro}</b><span>${pct(s.sentiment.neutro, total)}</span></div>
  <div class="sent-card"><small class="r">${esc(p.labels.sentNeg)}</small><b>${s.sentiment.negativo}</b><span>${pct(s.sentiment.negativo, total)}</span></div>
</section>`
    : '';

  const themesBlock = showThemes
    ? `<h2 class="sec">${esc(L.themes)}</h2><div class="themes-box">${themesHtml}</div>`
    : '';

  return `<main class="report">
  <div class="watermark">FILTRA.AI</div>

  <div class="hero">
    <div class="brand">Filtra.AI</div>
    <div class="plan-title">${esc(hero.title)}</div>
    <div class="plan-sub">${esc(hero.subtitle)}</div>
    <div class="company">${esc(p.companyName)}</div>
    <div class="cycle">${esc(p.periodLabel)} · Conta: ${esc(p.plan || 'Trial')}</div>
  </div>

  <section class="benefits">
    <div class="ben in">
      <h3>${esc(L.benefitsIn)}</h3>
      <ul>${benIn}</ul>
    </div>
    <div class="ben out">
      <h3>${esc(L.benefitsOut)}</h3>
      <ul>${benOut}</ul>
    </div>
  </section>

  <h2 class="sec">${esc(L.summary)}</h2>
  <section class="kpis">
    <div class="kpi"><small>${esc(L.volume)}</small><b>${s.total}</b><span>${esc(L.volumeSub)}</span></div>
    <div class="kpi"><small>${esc(L.avg)}</small><b>${esc(avg)}</b><span>${esc(L.avgSub)}</span></div>
    <div class="kpi"><small>${esc(L.positive)}</small><b class="g">${s.positive}</b><span>${pct(s.positive, total)} · ${esc(L.positiveSub)}</span></div>
    <div class="kpi"><small>${esc(L.critical)}</small><b class="r">${s.critical}</b><span>${pct(s.critical, total)} · ${esc(L.criticalSub)}</span></div>
  </section>

  <h2 class="sec">${esc(L.dist)}</h2>
  <section class="bars">${bars}</section>

  ${sentBlock}
  ${themesBlock}

  <footer>
    <div class="foot-main">${esc(footerLine)}</div>
    <div class="foot-rights">${esc(rights)}</div>
  </footer>

  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #1e293b; }
    .report {
      position: relative;
      width: 794px;
      min-height: 1123px;
      padding: 28px 40px 56px;
      background: #fff;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      top: 48%;
      left: 50%;
      width: 640px;
      margin-left: -320px;
      text-align: center;
      transform: rotate(-28deg);
      font-size: 52px;
      font-weight: 800;
      letter-spacing: 4px;
      color: #0a5555;
      opacity: 0.055;
      pointer-events: none;
      z-index: 0;
    }
    .hero {
      position: relative;
      z-index: 1;
      background: #0d6e6e;
      border-radius: 14px;
      padding: 18px 22px 16px;
      color: #fff;
      margin-bottom: 16px;
    }
    .hero .brand { font-size: 9px; font-weight: 700; color: #99f6e4; letter-spacing: 0.5px; margin-bottom: 6px; }
    .hero .plan-title { font-size: 22px; font-weight: 800; line-height: 1.15; }
    .hero .plan-sub { font-size: 11px; color: #d1fae5; margin-top: 4px; }
    .hero .company { font-size: 12px; font-weight: 700; margin-top: 10px; }
    .hero .cycle { font-size: 10px; color: #a7f3d0; margin-top: 2px; }

    .benefits {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .ben {
      border-radius: 12px;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      min-height: 88px;
    }
    .ben.in { background: #ecfdf5; }
    .ben.out { background: #f8fafc; }
    .ben h3 {
      margin: 0 0 8px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0a5555;
    }
    .ben.out h3 { color: #64748b; }
    .ben ul { margin: 0; padding: 0; list-style: none; }
    .ben li { font-size: 10px; color: #1e293b; margin-bottom: 5px; line-height: 1.35; }
    .ok { color: #16a34a; font-weight: 800; margin-right: 4px; }
    .no { color: #94a3b8; margin-right: 4px; }

    .sec {
      position: relative;
      z-index: 1;
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      margin: 14px 0 8px;
      padding-bottom: 4px;
      border-bottom: 2px solid #0d6e6e;
      display: inline-block;
      min-width: 120px;
    }

    .kpis {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 8px;
    }
    .kpi {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 10px;
      background: #fff;
      min-height: 78px;
    }
    .kpi small {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .kpi b { display: block; font-size: 22px; color: #0f172a; line-height: 1.1; }
    .kpi b.g { color: #16a34a; }
    .kpi b.r { color: #dc2626; }
    .kpi span { display: block; font-size: 9px; color: #64748b; margin-top: 6px; }

    .bars { position: relative; z-index: 1; margin-bottom: 6px; }
    .bar-row {
      display: grid;
      grid-template-columns: 28px 1fr 28px;
      gap: 8px;
      align-items: center;
      margin-bottom: 7px;
    }
    .star { font-size: 11px; color: #1e293b; }
    .track {
      height: 11px;
      background: #f1f5f9;
      border-radius: 6px;
      overflow: hidden;
    }
    .fill { height: 100%; border-radius: 6px; min-width: 0; }
    .cnt { font-size: 11px; color: #64748b; text-align: right; }

    .sent-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 8px;
    }
    .sent-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      text-align: left;
      background: #fff;
    }
    .sent-card small {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.4px;
      margin-bottom: 4px;
    }
    .sent-card small.g { color: #16a34a; }
    .sent-card small.a { color: #d97706; }
    .sent-card small.r { color: #dc2626; }
    .sent-card b { display: block; font-size: 20px; color: #0f172a; }
    .sent-card span { display: block; font-size: 9px; color: #64748b; margin-top: 4px; }

    .themes-box {
      position: relative;
      z-index: 1;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      background: #f8fafc;
      min-height: 40px;
    }
    .theme { font-size: 11px; color: #1e293b; margin-bottom: 4px; }
    .theme b { color: #64748b; font-weight: 600; }
    .themes-empty { font-size: 10px; color: #64748b; line-height: 1.45; }

    footer {
      position: absolute;
      left: 40px;
      right: 40px;
      bottom: 22px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      text-align: center;
      z-index: 1;
    }
    .foot-main { font-size: 9px; color: #64748b; }
    .foot-rights { font-size: 7.5px; color: #94a3b8; margin-top: 4px; }
  </style>
</main>`;
}

const waitImages = (root: HTMLElement) =>
  Promise.all(
    Array.from(root.querySelectorAll('img')).map((i) =>
      i.complete
        ? Promise.resolve()
        : new Promise<void>((r) => {
            i.onload = () => r();
            i.onerror = () => r();
          })
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
    const worker = mod
      .default()
      .set({
        margin: 0,
        filename: `relatorio-${slug(p.companyName)}-${slug(p.periodLabel)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#fff',
          logging: false,
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
      })
      .from(host.querySelector('.report') as HTMLElement) as any;
    const blob = await worker.outputPdf('blob');
    return blob instanceof Blob ? blob : null;
  } catch {
    return null;
  } finally {
    host.remove();
  }
}

export async function previewReportPdfDirect(
  p: ClientReportPayload,
  previewWindow: Window | null
): Promise<ReportExportResult> {
  if (!previewWindow || previewWindow.closed) return { ok: false, mode: 'failed' };
  const blob = await createReportPdfBlob(p);
  if (!blob) {
    try {
      previewWindow.document.body.innerHTML =
        '<p style="font-family:Arial,sans-serif;padding:40px;color:#991b1b">Não foi possível gerar o relatório PDF. Feche esta aba e tente novamente.</p>';
    } catch {
      /* */
    }
    return { ok: false, mode: 'failed' };
  }
  const url = URL.createObjectURL(blob);
  try {
    previewWindow.location.href = url;
    return { ok: true, mode: 'pdf-download' };
  } catch {
    URL.revokeObjectURL(url);
    return { ok: false, mode: 'failed' };
  }
}

export async function exportReportPdfDirect(p: ClientReportPayload): Promise<ReportExportResult> {
  const blob = await createReportPdfBlob(p);
  if (!blob) return { ok: false, mode: 'failed' };
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-${slug(p.companyName)}-${slug(p.periodLabel)}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { ok: true, mode: 'pdf-download' };
}
