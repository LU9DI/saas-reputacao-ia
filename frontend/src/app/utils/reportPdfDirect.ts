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

/** Nome oficial do plano (como no produto). */
function planDisplayName(plan: string, lang: string): string {
  const p = String(plan || '').toLowerCase();
  if (p.includes('rei')) return 'Rei';
  if (p.includes('corp') || p.includes('empres')) return lang === 'en' ? 'Corporate' : 'Corporativo';
  if (p.includes('ultra') || p.includes('premium')) return 'Ultra';
  if (p.includes('trial') || p.includes('teste') || p.includes('trialing')) {
    return lang === 'en' ? 'Trial (Ultra)' : lang === 'es' ? 'Trial (Ultra)' : lang === 'zh' ? '试用 (Ultra)' : 'Trial (Ultra)';
  }
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
  return 'pro';
}

function planHero(depth: Depth, lang: string, displayName: string): { title: string; subtitle: string } {
  const map: Record<Depth, Record<string, { title: string; subtitle: string }>> = {
    pro: {
      pt: { title: `PLANO ${displayName.toUpperCase()}`, subtitle: 'KPIs essenciais · distribuição de notas · positivas vs críticas' },
      en: { title: `${displayName.toUpperCase()} PLAN`, subtitle: 'Essential KPIs · rating distribution · positive vs critical' },
      es: { title: `PLAN ${displayName.toUpperCase()}`, subtitle: 'KPIs esenciales · distribución · positivas vs críticas' },
      zh: { title: `${displayName} 套餐`, subtitle: '核心 KPI · 评分分布 · 好评 vs 差评' },
    },
    ultra: {
      pt: { title: `PLANO ${displayName.toUpperCase()}`, subtitle: 'KPIs + sentimento (IA) + temas detectados' },
      en: { title: `${displayName.toUpperCase()} PLAN`, subtitle: 'KPIs + sentiment (AI) + detected themes' },
      es: { title: `PLAN ${displayName.toUpperCase()}`, subtitle: 'KPIs + sentimiento (IA) + temas detectados' },
      zh: { title: `${displayName} 套餐`, subtitle: 'KPI + 情感分析 (AI) + 主题' },
    },
    corp: {
      pt: { title: `PLANO ${displayName.toUpperCase()}`, subtitle: 'Ultra + ranking multi-unidade + visão por filial' },
      en: { title: `${displayName.toUpperCase()} PLAN`, subtitle: 'Ultra + multi-unit ranking + per-branch view' },
      es: { title: `PLAN ${displayName.toUpperCase()}`, subtitle: 'Ultra + ranking multiunidad + vista por sucursal' },
      zh: { title: `${displayName} 套餐`, subtitle: 'Ultra + 多门店排名 + 分店视图' },
    },
    rei: {
      pt: { title: `PLANO ${displayName.toUpperCase()}`, subtitle: 'Relatório executivo completo · donut · gargalos · detalhe por filial' },
      en: { title: `${displayName.toUpperCase()} PLAN`, subtitle: 'Full executive report · donut · bottlenecks · rich branch detail' },
      es: { title: `PLAN ${displayName.toUpperCase()}`, subtitle: 'Informe ejecutivo completo · donut · cuellos de botella' },
      zh: { title: `${displayName} 套餐`, subtitle: '完整高管报告 · 圆环图 · 瓶颈 · 门店详情' },
    },
  };
  const l = ['pt', 'en', 'es', 'zh'].includes(lang) ? lang : 'pt';
  return map[depth][l] || map[depth].pt;
}

type Feature = { key: string; min: Depth; label: string };

function features(depth: Depth, lang: string): { included: Feature[]; locked: Feature[] } {
  const rank: Record<Depth, number> = { pro: 1, ultra: 2, corp: 3, rei: 4 };
  const cur = rank[depth];
  const labels: Record<string, Record<string, string>> = {
    pt: {
      kpis: 'KPIs e volume de avaliações',
      dist: 'Distribuição de notas (1★–5★)',
      poscrit: 'Positivas vs críticas',
      sent: 'Análise de sentimento (IA)',
      themes: 'Temas mais citados (IA)',
      ranking: 'Ranking de unidades / filiais',
      branch: 'Página dedicada por filial',
      donut: 'Visão executiva (donut pos/neu/neg)',
      bottleneck: 'Gargalos e barras de temas',
      rich: 'Detalhe rico por filial (IA)',
    },
    en: {
      kpis: 'KPIs and review volume',
      dist: 'Rating distribution (1★–5★)',
      poscrit: 'Positive vs critical',
      sent: 'Sentiment analysis (AI)',
      themes: 'Top themes (AI)',
      ranking: 'Unit / branch ranking',
      branch: 'Dedicated page per branch',
      donut: 'Executive view (donut)',
      bottleneck: 'Bottlenecks and theme bars',
      rich: 'Rich branch detail (AI)',
    },
    es: {
      kpis: 'KPIs y volumen de reseñas',
      dist: 'Distribución de notas (1★–5★)',
      poscrit: 'Positivas vs críticas',
      sent: 'Análisis de sentimiento (IA)',
      themes: 'Temas más citados (IA)',
      ranking: 'Ranking de unidades / sucursales',
      branch: 'Página dedicada por sucursal',
      donut: 'Visión ejecutiva (donut)',
      bottleneck: 'Cuellos de botella y barras de temas',
      rich: 'Detalle rico por sucursal (IA)',
    },
    zh: {
      kpis: 'KPI 与评价量',
      dist: '评分分布 (1★–5★)',
      poscrit: '好评 vs 差评',
      sent: '情感分析 (AI)',
      themes: '热门主题 (AI)',
      ranking: '门店排名',
      branch: '每店专属页',
      donut: '高管圆环图',
      bottleneck: '瓶颈与主题条',
      rich: '丰富门店详情 (AI)',
    },
  };
  const l = ['pt', 'en', 'es', 'zh'].includes(lang) ? lang : 'pt';
  const lab = labels[l] || labels.pt;
  const order: { key: string; min: Depth }[] = [
    { key: 'kpis', min: 'pro' },
    { key: 'dist', min: 'pro' },
    { key: 'poscrit', min: 'pro' },
    { key: 'sent', min: 'ultra' },
    { key: 'themes', min: 'ultra' },
    { key: 'ranking', min: 'corp' },
    { key: 'branch', min: 'corp' },
    { key: 'donut', min: 'rei' },
    { key: 'bottleneck', min: 'rei' },
    { key: 'rich', min: 'rei' },
  ];
  const all = order.map((o) => ({ key: o.key, min: o.min, label: lab[o.key] }));
  return {
    included: all.filter((f) => cur >= rank[f.min]),
    locked: all.filter((f) => cur < rank[f.min]),
  };
}

function sectionLabels(lang: string) {
  if (lang === 'en') {
    return {
      benefitsIn: 'Included in this plan',
      benefitsOut: 'Not in this plan (upgrade to unlock)',
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
      sentiment: 'Sentiment analysis (AI)',
      themes: 'Top themes (AI)',
      themesEmpty: 'No AI themes in this cycle yet.',
      ranking: 'Unit ranking (Corporate+)',
      rankingEmpty: 'Register branches to see multi-unit ranking. Available on Corporate and Rei.',
      executive: 'Executive view (Rei)',
      bottlenecks: 'Main bottlenecks (Rei)',
      lockedNote: 'Section available on a higher plan.',
      footer: 'Filtra.AI · Plan {{plan}} · benefits of your subscription · cycle report',
      rights: '© Filtra.AI — All rights reserved. Confidential document.',
      planLine: 'Plan',
    };
  }
  if (lang === 'es') {
    return {
      benefitsIn: 'Incluido en este plan',
      benefitsOut: 'No incluido (mejora el plan para desbloquear)',
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
      sentiment: 'Análisis de sentimiento (IA)',
      themes: 'Temas principales (IA)',
      themesEmpty: 'Ningún tema de IA en este ciclo aún.',
      ranking: 'Ranking de unidades (Corporativo+)',
      rankingEmpty: 'Registre sucursales para ver ranking multiunidad. Disponible en Corporativo y Rei.',
      executive: 'Visión ejecutiva (Rei)',
      bottlenecks: 'Principales cuellos de botella (Rei)',
      lockedNote: 'Sección disponible en un plan superior.',
      footer: 'Filtra.AI · Plan {{plan}} · beneficios de tu suscripción · informe del ciclo',
      rights: '© Filtra.AI — Todos los derechos reservados. Documento confidencial.',
      planLine: 'Plan',
    };
  }
  if (lang === 'zh') {
    return {
      benefitsIn: '本套餐包含',
      benefitsOut: '本套餐不含（升级可解锁）',
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
      sentiment: '情感分析 (AI)',
      themes: '热门主题 (AI)',
      themesEmpty: '本周期暂无 AI 主题。',
      ranking: '门店排名（企业版+）',
      rankingEmpty: '登记分店后可查看多门店排名。企业版与 Rei 可用。',
      executive: '高管视图 (Rei)',
      bottlenecks: '主要瓶颈 (Rei)',
      lockedNote: '更高套餐可用。',
      footer: 'Filtra.AI · 套餐 {{plan}} · 订阅权益 · 周期报告',
      rights: '© Filtra.AI — 保留所有权利。机密文件。',
      planLine: '套餐',
    };
  }
  return {
    benefitsIn: 'Incluído neste plano',
    benefitsOut: 'Não incluso (faça upgrade para liberar)',
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
    sentiment: 'Análise de sentimento (IA)',
    themes: 'Temas mais citados (IA)',
    themesEmpty: 'Nenhum tema de IA neste ciclo ainda.',
    ranking: 'Ranking de unidades (Corporativo+)',
    rankingEmpty:
      'Cadastre filiais para ver o ranking multi-unidade. Disponível nos planos Corporativo e Rei.',
    executive: 'Visão executiva (Rei)',
    bottlenecks: 'Gargalos principais (Rei)',
    lockedNote: 'Seção disponível em um plano superior.',
    footer: 'Filtra.AI · Plano {{plan}} · benefícios da sua assinatura · relatório do ciclo',
    rights: '© Filtra.AI — Todos os direitos reservados. Documento confidencial.',
    planLine: 'Plano',
  };
}

function distOf(p: ClientReportPayload): number[] {
  const anyStats = p.stats as { distribution?: number[] };
  if (Array.isArray(anyStats.distribution) && anyStats.distribution.length === 5) {
    return anyStats.distribution.map((n) => Number(n) || 0);
  }
  return [0, 0, 0, 0, 0];
}

const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" role="img" aria-label="Filtra.AI">' +
  '<defs>' +
  '<linearGradient id="g" x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">' +
  '<stop stop-color="#60a5fa"/><stop offset="0.45" stop-color="#3b82f6"/>' +
  '<stop offset="0.75" stop-color="#6366f1"/><stop offset="1" stop-color="#7c3aed"/>' +
  '</linearGradient>' +
  '<linearGradient id="g2" x1="160" y1="160" x2="400" y2="420" gradientUnits="userSpaceOnUse">' +
  '<stop stop-color="#93c5fd"/><stop offset="0.5" stop-color="#6366f1"/><stop offset="1" stop-color="#4f46e5"/>' +
  '</linearGradient></defs>' +
  '<rect width="512" height="512" rx="112" fill="#05050a"/>' +
  '<path d="M112 128c0-35 29-64 64-64h176c26 0 42 30 26 51L272 230c-10 13-25 20-41 20h-55c-35 0-64-29-64-64v-58Z" fill="url(#g)"/>' +
  '<path d="M112 224h112c19 0 36 11 44 28l102 210c11 23-6 50-31 50h-66c-12 0-23-6-29-17L146 290c-21-40-34-58-34-66Z" fill="url(#g2)"/>' +
  '<path d="M176 272h112c14 0 25 9 29 22l10 30c3 10-5 20-15 20H208c-18 0-32-14-32-32v-40Z" fill="url(#g)" opacity="0.95"/>' +
  '</svg>';

function makeHtml(p: ClientReportPayload): string {
  const lang = String(p.lang || 'pt');
  const rawPlan = p.plan || 'trial';
  const depth = depthOf(rawPlan);
  const displayName = planDisplayName(rawPlan, lang);
  const hero = planHero(depth, lang, displayName);
  const feats = features(depth, lang);
  const L = sectionLabels(lang);
  const s = p.stats;
  const total = s.ratedCount || s.total || 0;
  const avg = s.average ? s.average.toFixed(1) : '—';
  const dist = distOf(p);
  const maxD = Math.max(...dist, 1);
  const showSent = depth !== 'pro';
  const showThemes = depth !== 'pro';
  const showRanking = depth === 'corp' || depth === 'rei';
  const showRei = depth === 'rei';
  const footerLine = L.footer.replace('{{plan}}', displayName);
  const rights = p.labels.rights || L.rights;

  const bars = dist
    .map((v, i) => {
      const w = Math.max(v > 0 ? 4 : 0, Math.round((v / maxD) * 100));
      const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
      return `<div class="bar-row"><span class="star">${i + 1}★</span><div class="track"><div class="fill" style="width:${w}%;background:${colors[i]}"></div></div><span class="cnt">${v}</span></div>`;
    })
    .join('');

  const benIn = feats.included.map((x) => `<li><span class="ok">✓</span> ${esc(x.label)}</li>`).join('');
  const benOut = feats.locked.length
    ? feats.locked.map((x) => `<li><span class="no">○</span> ${esc(x.label)}</li>`).join('')
    : '<li><span class="ok">✓</span> —</li>';

  const themesHtml =
    s.themes && s.themes.length
      ? s.themes.map((t) => `<div class="theme">• ${esc(t.name)} <b>(${t.count})</b></div>`).join('')
      : `<div class="themes-empty">${esc(L.themesEmpty)}</div>`;

  const sentTotal = s.sentiment.positivo + s.sentiment.neutro + s.sentiment.negativo || 1;
  const donutNote =
    lang === 'en'
      ? `Share: +${pct(s.sentiment.positivo, sentTotal)} · ~${pct(s.sentiment.neutro, sentTotal)} · −${pct(s.sentiment.negativo, sentTotal)}`
      : lang === 'es'
        ? `Participación: +${pct(s.sentiment.positivo, sentTotal)} · ~${pct(s.sentiment.neutro, sentTotal)} · −${pct(s.sentiment.negativo, sentTotal)}`
        : lang === 'zh'
          ? `占比：+${pct(s.sentiment.positivo, sentTotal)} · ~${pct(s.sentiment.neutro, sentTotal)} · −${pct(s.sentiment.negativo, sentTotal)}`
          : `Participação: +${pct(s.sentiment.positivo, sentTotal)} · ~${pct(s.sentiment.neutro, sentTotal)} · −${pct(s.sentiment.negativo, sentTotal)}`;

  const bottleneckHtml =
    s.themes && s.themes.length
      ? s.themes
          .slice(0, 4)
          .map((t, i) => {
            const w = Math.max(8, Math.round((t.count / (s.themes[0].count || 1)) * 100));
            return `<div class="bn-row"><span class="bn-n">${i + 1}</span><span class="bn-name">${esc(t.name)}</span><div class="track"><div class="fill bn" style="width:${w}%"></div></div><span class="cnt">${t.count}</span></div>`;
          })
          .join('')
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

  const rankingBlock = showRanking
    ? `<h2 class="sec">${esc(L.ranking)}</h2><div class="themes-box"><div class="themes-empty">${esc(L.rankingEmpty)}</div></div>`
    : '';

  const reiBlock = showRei
    ? `<h2 class="sec">${esc(L.executive)}</h2>
<section class="sent-grid">
  <div class="sent-card"><small class="g">${esc(p.labels.sentPos)}</small><b>${pct(s.sentiment.positivo, sentTotal)}</b><span>${s.sentiment.positivo}</span></div>
  <div class="sent-card"><small class="a">${esc(p.labels.sentNeu)}</small><b>${pct(s.sentiment.neutro, sentTotal)}</b><span>${s.sentiment.neutro}</span></div>
  <div class="sent-card"><small class="r">${esc(p.labels.sentNeg)}</small><b>${pct(s.sentiment.negativo, sentTotal)}</b><span>${s.sentiment.negativo}</span></div>
</section>
<p class="donut-note">${esc(donutNote)}</p>
<h2 class="sec">${esc(L.bottlenecks)}</h2>
<div class="themes-box">${bottleneckHtml}</div>`
    : '';

  return `<main class="report">
  <div class="watermark">FILTRA.AI · ${esc(displayName.toUpperCase())}</div>

  <div class="hero">
    <div class="brand-row"><span class="logo-wrap">${LOGO_SVG}</span><span class="brand">Filtra.AI</span></div>
    <div class="plan-title">${esc(hero.title)}</div>
    <div class="plan-sub">${esc(hero.subtitle)}</div>
    <div class="company">${esc(p.companyName)}</div>
    <div class="cycle">${esc(p.periodLabel)} · ${esc(L.planLine)}: <strong>${esc(displayName)}</strong></div>
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
  ${rankingBlock}
  ${reiBlock}

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
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #1e40af;
      opacity: 0.055;
      pointer-events: none;
      z-index: 0;
    }
    .hero {
      position: relative;
      z-index: 1;
      background: #2563eb;
      border-radius: 14px;
      padding: 18px 22px 16px;
      color: #fff;
      margin-bottom: 16px;
    }
    .brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .logo-wrap {
      display: inline-flex;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
      background: #05050a;
    }
    .logo-wrap svg { display: block; width: 36px; height: 36px; }
    .hero .brand { font-size: 13px; font-weight: 800; color: #fff; letter-spacing: 0.3px; margin-bottom: 0; }
    .hero .plan-title { font-size: 22px; font-weight: 800; line-height: 1.15; }
    .hero .plan-sub { font-size: 11px; color: #dbeafe; margin-top: 4px; }
    .hero .company { font-size: 12px; font-weight: 700; margin-top: 10px; }
    .hero .cycle { font-size: 10px; color: #93c5fd; margin-top: 2px; }
    .hero .cycle strong { color: #fff; }

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
    .ben.in { background: #eff6ff; }
    .ben.out { background: #f8fafc; }
    .ben h3 {
      margin: 0 0 8px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #1e40af;
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
      border-bottom: 2px solid #2563eb;
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
    .fill.bn { background: #2563eb; }
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
    .donut-note { position: relative; z-index: 1; font-size: 10px; color: #64748b; margin: 0 0 8px; }

    .bn-row {
      display: grid;
      grid-template-columns: 22px 1fr 1fr 28px;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
      font-size: 11px;
    }
    .bn-n {
      width: 18px; height: 18px; line-height: 18px; text-align: center;
      border-radius: 50%; background: #2563eb; color: #fff; font-size: 10px; font-weight: 700;
    }
    .bn-name { color: #1e293b; }

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
    const planSlug = slug(planDisplayName(p.plan || 'pro', p.lang || 'pt'));
    const worker = mod
      .default()
      .set({
        margin: 0,
        filename: `relatorio-${planSlug}-${slug(p.companyName)}-${slug(p.periodLabel)}.pdf`,
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
  a.download = `relatorio-${slug(planDisplayName(p.plan || 'pro', p.lang || 'pt'))}-${slug(p.companyName)}-${slug(p.periodLabel)}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { ok: true, mode: 'pdf-download' };
}
