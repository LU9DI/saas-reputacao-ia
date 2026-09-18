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

const LIMITS: Record<Depth, number> = {
  inicial: 100,
  pro: 300,
  ultra: 800,
  corp: 2500,
  rei: 8000,
};

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

function planHero(depth: Depth, lang: string, displayName: string): { title: string; subtitle: string } {
  const map: Record<Depth, Record<string, { title: string; subtitle: string }>> = {
    inicial: {
      pt: { title: `PLANO ${displayName.toUpperCase()}`, subtitle: 'KPIs essenciais · volume de avaliações · visão objetiva do ciclo' },
      en: { title: `${displayName.toUpperCase()} PLAN`, subtitle: 'Essential KPIs · review volume · clear cycle overview' },
      es: { title: `PLAN ${displayName.toUpperCase()}`, subtitle: 'KPIs esenciales · volumen · visión clara del ciclo' },
      zh: { title: `${displayName} 套餐`, subtitle: '核心 KPI · 评价量 · 周期概览' },
    },
    pro: {
      pt: { title: `PLANO ${displayName.toUpperCase()}`, subtitle: 'KPIs · distribuição de notas · positivas vs críticas · relatório inteligente' },
      en: { title: `${displayName.toUpperCase()} PLAN`, subtitle: 'KPIs · rating distribution · positive vs critical · smart report' },
      es: { title: `PLAN ${displayName.toUpperCase()}`, subtitle: 'KPIs · distribución · positivas vs críticas · informe inteligente' },
      zh: { title: `${displayName} 套餐`, subtitle: 'KPI · 评分分布 · 好评 vs 差评 · 智能报告' },
    },
    ultra: {
      pt: { title: `PLANO ${displayName.toUpperCase()}`, subtitle: 'KPIs + sentimento (IA) + temas detectados + analytics' },
      en: { title: `${displayName.toUpperCase()} PLAN`, subtitle: 'KPIs + sentiment (AI) + detected themes + analytics' },
      es: { title: `PLAN ${displayName.toUpperCase()}`, subtitle: 'KPIs + sentimiento (IA) + temas + analytics' },
      zh: { title: `${displayName} 套餐`, subtitle: 'KPI + 情感分析 (AI) + 主题 + 分析' },
    },
    corp: {
      pt: { title: `PLANO ${displayName.toUpperCase()}`, subtitle: 'Ultra + multi-unidades + ranking de filiais + suporte prioritário' },
      en: { title: `${displayName.toUpperCase()} PLAN`, subtitle: 'Ultra + multi-unit + branch ranking + priority support' },
      es: { title: `PLAN ${displayName.toUpperCase()}`, subtitle: 'Ultra + multiunidad + ranking + soporte prioritario' },
      zh: { title: `${displayName} 套餐`, subtitle: 'Ultra + 多门店 + 排名 + 优先支持' },
    },
    rei: {
      pt: { title: `PLANO ${displayName.toUpperCase()}`, subtitle: 'Relatório executivo completo · gargalos · visão premium multi-unidade' },
      en: { title: `${displayName.toUpperCase()} PLAN`, subtitle: 'Full executive report · bottlenecks · premium multi-unit view' },
      es: { title: `PLAN ${displayName.toUpperCase()}`, subtitle: 'Informe ejecutivo completo · cuellos de botella · vista premium' },
      zh: { title: `${displayName} 套餐`, subtitle: '完整高管报告 · 瓶颈 · 多门店高级视图' },
    },
  };
  const l = ['pt', 'en', 'es', 'zh'].includes(lang) ? lang : 'pt';
  return map[depth][l] || map[depth].pt;
}

type Feature = { key: string; min: Depth; label: string };

function features(depth: Depth, lang: string): { included: Feature[]; locked: Feature[] } {
  const rank: Record<Depth, number> = { inicial: 1, pro: 2, ultra: 3, corp: 4, rei: 5 };
  const cur = rank[depth];
  const limit = LIMITS[depth].toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR');

  const labels: Record<string, Record<string, string>> = {
    pt: {
      volume: `Até ${limit} feedbacks / mês`,
      wpp: 'WhatsApp integrado',
      dash: 'Dashboard operacional',
      report: 'Relatório inteligente (PDF)',
      kpis: 'KPIs e volume de avaliações',
      dist: 'Distribuição de notas (1★–5★)',
      poscrit: 'Positivas vs críticas',
      ai: 'IA integrada (sentimento e temas)',
      sent: 'Análise de sentimento (IA)',
      themes: 'Temas mais citados (IA)',
      analytics: 'Dashboard com análises avançadas',
      multi: 'Dashboard multi-unidades / filiais',
      ranking: 'Ranking de unidades',
      branch: 'Visão dedicada por filial',
      support: 'Suporte prioritário',
      early: 'Acesso antecipado a novas funções',
      donut: 'Visão executiva (participação pos/neu/neg)',
      bottleneck: 'Gargalos e barras de temas',
      rich: 'Detalhe rico por filial (IA)',
    },
    en: {
      volume: `Up to ${limit} feedbacks / month`,
      wpp: 'Integrated WhatsApp',
      dash: 'Operational dashboard',
      report: 'Smart report (PDF)',
      kpis: 'KPIs and review volume',
      dist: 'Rating distribution (1★–5★)',
      poscrit: 'Positive vs critical',
      ai: 'Integrated AI (sentiment & themes)',
      sent: 'Sentiment analysis (AI)',
      themes: 'Top themes (AI)',
      analytics: 'Dashboard with advanced analytics',
      multi: 'Multi-unit / branch dashboard',
      ranking: 'Unit ranking',
      branch: 'Dedicated branch view',
      support: 'Priority support',
      early: 'Early access to new features',
      donut: 'Executive view (pos/neu/neg share)',
      bottleneck: 'Bottlenecks and theme bars',
      rich: 'Rich branch detail (AI)',
    },
    es: {
      volume: `Hasta ${limit} feedbacks / mes`,
      wpp: 'WhatsApp integrado',
      dash: 'Dashboard operativo',
      report: 'Informe inteligente (PDF)',
      kpis: 'KPIs y volumen de reseñas',
      dist: 'Distribución de notas (1★–5★)',
      poscrit: 'Positivas vs críticas',
      ai: 'IA integrada (sentimiento y temas)',
      sent: 'Análisis de sentimiento (IA)',
      themes: 'Temas más citados (IA)',
      analytics: 'Dashboard con análisis avanzados',
      multi: 'Dashboard multiunidad / sucursales',
      ranking: 'Ranking de unidades',
      branch: 'Vista dedicada por sucursal',
      support: 'Soporte prioritario',
      early: 'Acceso anticipado a nuevas funciones',
      donut: 'Visión ejecutiva (pos/neu/neg)',
      bottleneck: 'Cuellos de botella y barras de temas',
      rich: 'Detalle rico por sucursal (IA)',
    },
    zh: {
      volume: `每月最多 ${limit} 条反馈`,
      wpp: '集成 WhatsApp',
      dash: '运营仪表盘',
      report: '智能报告 (PDF)',
      kpis: 'KPI 与评价量',
      dist: '评分分布 (1★–5★)',
      poscrit: '好评 vs 差评',
      ai: '集成 AI（情感与主题）',
      sent: '情感分析 (AI)',
      themes: '热门主题 (AI)',
      analytics: '高级分析仪表盘',
      multi: '多门店仪表盘',
      ranking: '门店排名',
      branch: '分店专属视图',
      support: '优先支持',
      early: '新功能抢先体验',
      donut: '高管视图（积极/中性/消极）',
      bottleneck: '瓶颈与主题条',
      rich: '丰富门店详情 (AI)',
    },
  };

  const l = ['pt', 'en', 'es', 'zh'].includes(lang) ? lang : 'pt';
  const lab = labels[l] || labels.pt;

  const order: { key: string; min: Depth }[] = [
    { key: 'volume', min: 'inicial' },
    { key: 'wpp', min: 'inicial' },
    { key: 'dash', min: 'inicial' },
    { key: 'kpis', min: 'inicial' },
    { key: 'report', min: 'pro' },
    { key: 'dist', min: 'pro' },
    { key: 'poscrit', min: 'pro' },
    { key: 'ai', min: 'ultra' },
    { key: 'sent', min: 'ultra' },
    { key: 'themes', min: 'ultra' },
    { key: 'analytics', min: 'ultra' },
    { key: 'multi', min: 'corp' },
    { key: 'ranking', min: 'corp' },
    { key: 'branch', min: 'corp' },
    { key: 'support', min: 'corp' },
    { key: 'early', min: 'corp' },
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
  const pt = {
    benefitsIn: 'Incluído neste plano',
    benefitsOut: 'Não incluso (faça upgrade para liberar)',
    benefitsTier: 'Benefícios do seu plano',
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
    rankingEmpty: 'Cadastre filiais para ver o ranking multi-unidade. Disponível nos planos Corporativo e Rei.',
    executive: 'Visão executiva (Rei)',
    bottlenecks: 'Gargalos principais (Rei)',
    footerBrand: 'Filtra.AI',
    footerPlan: 'Plano {{plan}}',
    footerCompany: '{{company}}',
    footerCycle: 'Relatório do ciclo · {{period}}',
    rights: '© Filtra.AI — Todos os direitos reservados. Documento confidencial. Uso exclusivo do assinante.',
    planLine: 'Plano',
  };
  if (lang === 'en')
    return {
      ...pt,
      benefitsIn: 'Included in this plan',
      benefitsOut: 'Not in this plan (upgrade to unlock)',
      benefitsTier: 'Plan benefits',
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
      rankingEmpty: 'Register branches to see multi-unit ranking.',
      executive: 'Executive view (Rei)',
      bottlenecks: 'Main bottlenecks (Rei)',
      footerPlan: 'Plan {{plan}}',
      footerCycle: 'Cycle report · {{period}}',
      rights: '© Filtra.AI — All rights reserved. Confidential document. Subscriber use only.',
      planLine: 'Plan',
    };
  if (lang === 'es')
    return {
      ...pt,
      benefitsIn: 'Incluido en este plan',
      benefitsOut: 'No incluido (mejora el plan)',
      benefitsTier: 'Beneficios del plan',
      summary: 'Resumen del ciclo',
      volume: 'Volumen',
      volumeSub: 'reseñas',
      avg: 'Nota media',
      positive: 'Positivas',
      critical: 'Críticas',
      dist: 'Distribución de notas',
      sentiment: 'Análisis de sentimiento (IA)',
      themes: 'Temas principales (IA)',
      themesEmpty: 'Ningún tema de IA aún.',
      ranking: 'Ranking de unidades (Corporativo+)',
      rankingEmpty: 'Registre sucursales para ranking multiunidad.',
      executive: 'Visión ejecutiva (Rei)',
      bottlenecks: 'Cuellos de botella (Rei)',
      footerPlan: 'Plan {{plan}}',
      footerCycle: 'Informe del ciclo · {{period}}',
      rights: '© Filtra.AI — Todos los derechos reservados. Documento confidencial.',
      planLine: 'Plan',
    };
  if (lang === 'zh')
    return {
      ...pt,
      benefitsIn: '本套餐包含',
      benefitsOut: '本套餐不含',
      benefitsTier: '套餐权益',
      summary: '周期摘要',
      volume: '数量',
      volumeSub: '评价',
      avg: '平均分',
      positive: '好评',
      critical: '差评',
      dist: '评分分布',
      sentiment: '情感分析 (AI)',
      themes: '热门主题 (AI)',
      themesEmpty: '暂无主题',
      ranking: '门店排名',
      rankingEmpty: '请登记分店',
      executive: '高管视图 (Rei)',
      bottlenecks: '主要瓶颈 (Rei)',
      footerPlan: '套餐 {{plan}}',
      footerCycle: '周期报告 · {{period}}',
      rights: '© Filtra.AI — 保留所有权利。机密文件。',
      planLine: '套餐',
    };
  return pt;
}

function distOf(p: ClientReportPayload): number[] {
  const anyStats = p.stats as { distribution?: number[] };
  if (Array.isArray(anyStats.distribution) && anyStats.distribution.length === 5)
    return anyStats.distribution.map((n) => Number(n) || 0);
  return [0, 0, 0, 0, 0];
}

const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="40" height="40" role="img" aria-label="Filtra.AI">' +
  '<defs><linearGradient id="g" x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">' +
  '<stop stop-color="#60a5fa"/><stop offset="0.45" stop-color="#3b82f6"/><stop offset="0.75" stop-color="#6366f1"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>' +
  '<linearGradient id="g2" x1="160" y1="160" x2="400" y2="420" gradientUnits="userSpaceOnUse">' +
  '<stop stop-color="#93c5fd"/><stop offset="0.5" stop-color="#6366f1"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs>' +
  '<rect width="512" height="512" rx="112" fill="#05050a"/>' +
  '<path d="M112 128c0-35 29-64 64-64h176c26 0 42 30 26 51L272 230c-10 13-25 20-41 20h-55c-35 0-64-29-64-64v-58Z" fill="url(#g)"/>' +
  '<path d="M112 224h112c19 0 36 11 44 28l102 210c11 23-6 50-31 50h-66c-12 0-23-6-29-17L146 290c-21-40-34-58-34-66Z" fill="url(#g2)"/>' +
  '<path d="M176 272h112c14 0 25 9 29 22l10 30c3 10-5 20-15 20H208c-18 0-32-14-32-32v-40Z" fill="url(#g)" opacity="0.95"/></svg>';

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
  const showSent = depth === 'ultra' || depth === 'corp' || depth === 'rei';
  const showThemes = showSent;
  const showRanking = depth === 'corp' || depth === 'rei';
  const showRei = depth === 'rei';
  const company = String(p.companyName || '').trim() || 'Empresa';
  const period = String(p.periodLabel || '').trim();
  const rights = p.labels.rights || L.rights;
  const now = new Date();
  const genLabel =
    lang === 'en'
      ? `Generated ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC · Confidential`
      : lang === 'es'
        ? `Generado ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC · Confidencial`
        : lang === 'zh'
          ? `生成于 ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC · 机密`
          : `Gerado em ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC · Confidencial`;

  const tierClass =
    depth === 'rei' ? 'tier-rei' : depth === 'corp' ? 'tier-corp' : depth === 'ultra' ? 'tier-ultra' : depth === 'pro' ? 'tier-pro' : 'tier-inicial';

  const tierLabel =
    depth === 'rei'
      ? lang === 'en'
        ? 'Premium executive tier'
        : lang === 'es'
          ? 'Nivel ejecutivo premium'
          : 'Nível executivo premium'
      : depth === 'corp'
        ? lang === 'en'
          ? 'Multi-unit tier'
          : lang === 'es'
            ? 'Nivel multiunidad'
            : 'Nível multi-unidade'
        : depth === 'ultra'
          ? lang === 'en'
            ? 'AI analytics tier'
            : lang === 'es'
              ? 'Nivel con análisis IA'
              : 'Nível com análise de IA'
          : depth === 'pro'
            ? lang === 'en'
              ? 'Smart report tier'
              : lang === 'es'
                ? 'Nivel informe inteligente'
                : 'Nível relatório inteligente'
            : lang === 'en'
              ? 'Essential tier'
              : lang === 'es'
                ? 'Nivel esencial'
                : 'Nível essencial';

  const includedCount = feats.included.length;
  const countLabel =
    lang === 'en'
      ? `${includedCount} benefits included`
      : lang === 'es'
        ? `${includedCount} beneficios incluidos`
        : lang === 'zh'
          ? `含 ${includedCount} 项权益`
          : `${includedCount} benefícios inclusos`;

  const bars = dist
    .map((v, i) => {
      const w = Math.max(v > 0 ? 4 : 0, Math.round((v / maxD) * 100));
      const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
      return `<div class="bar-row"><span class="star">${i + 1}★</span><div class="track"><div class="fill" style="width:${w}%;background:${colors[i]}"></div></div><span class="cnt">${v}</span></div>`;
    })
    .join('');

  const benIn = feats.included
    .map((x) => {
      const premium = x.min === 'ultra' || x.min === 'corp' || x.min === 'rei';
      const elite = x.min === 'corp' || x.min === 'rei';
      const cls = elite ? 'feat elite' : premium ? 'feat premium' : 'feat';
      const badge =
        x.min === 'rei'
          ? '<span class="tag tag-rei">REI</span>'
          : x.min === 'corp'
            ? '<span class="tag tag-corp">CORP</span>'
            : x.min === 'ultra'
              ? '<span class="tag tag-ultra">ULTRA</span>'
              : x.min === 'pro'
                ? '<span class="tag tag-pro">PRO</span>'
                : '';
      return `<li class="${cls}"><span class="ok">✓</span><span class="feat-text">${esc(x.label)}</span>${badge}</li>`;
    })
    .join('');

  const benOut = feats.locked.length
    ? feats.locked
        .map((x) => {
          const badge =
            x.min === 'rei'
              ? '<span class="tag tag-muted">REI</span>'
              : x.min === 'corp'
                ? '<span class="tag tag-muted">CORP</span>'
                : x.min === 'ultra'
                  ? '<span class="tag tag-muted">ULTRA</span>'
                  : x.min === 'pro'
                    ? '<span class="tag tag-muted">PRO</span>'
                    : '';
          return `<li class="feat locked"><span class="no">○</span><span class="feat-text">${esc(x.label)}</span>${badge}</li>`;
        })
        .join('')
    : '<li class="feat"><span class="ok">✓</span><span class="feat-text">—</span></li>';

  const themesHtml =
    s.themes && s.themes.length
      ? s.themes.map((t) => `<div class="theme">• ${esc(t.name)} <b>(${t.count})</b></div>`).join('')
      : `<div class="themes-empty">${esc(L.themesEmpty)}</div>`;

  const sentTotal = s.sentiment.positivo + s.sentiment.neutro + s.sentiment.negativo || 1;
  const donutNote =
    lang === 'en'
      ? `Share: +${pct(s.sentiment.positivo, sentTotal)} · ~${pct(s.sentiment.neutro, sentTotal)} · −${pct(s.sentiment.negativo, sentTotal)}`
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
    ? `<h2 class="sec">${esc(L.sentiment)}</h2><section class="sent-grid">
  <div class="sent-card"><small class="g">${esc(p.labels.sentPos)}</small><b>${s.sentiment.positivo}</b><span>${pct(s.sentiment.positivo, total)}</span></div>
  <div class="sent-card"><small class="a">${esc(p.labels.sentNeu)}</small><b>${s.sentiment.neutro}</b><span>${pct(s.sentiment.neutro, total)}</span></div>
  <div class="sent-card"><small class="r">${esc(p.labels.sentNeg)}</small><b>${s.sentiment.negativo}</b><span>${pct(s.sentiment.negativo, total)}</span></div>
</section>`
    : '';

  const themesBlock = showThemes ? `<h2 class="sec">${esc(L.themes)}</h2><div class="themes-box">${themesHtml}</div>` : '';
  const rankingBlock = showRanking
    ? `<h2 class="sec">${esc(L.ranking)}</h2><div class="themes-box"><div class="themes-empty">${esc(L.rankingEmpty)}</div></div>`
    : '';
  const reiBlock = showRei
    ? `<h2 class="sec">${esc(L.executive)}</h2><section class="sent-grid">
  <div class="sent-card"><small class="g">${esc(p.labels.sentPos)}</small><b>${pct(s.sentiment.positivo, sentTotal)}</b><span>${s.sentiment.positivo}</span></div>
  <div class="sent-card"><small class="a">${esc(p.labels.sentNeu)}</small><b>${pct(s.sentiment.neutro, sentTotal)}</b><span>${s.sentiment.neutro}</span></div>
  <div class="sent-card"><small class="r">${esc(p.labels.sentNeg)}</small><b>${pct(s.sentiment.negativo, sentTotal)}</b><span>${s.sentiment.negativo}</span></div>
</section><p class="donut-note">${esc(donutNote)}</p>
<h2 class="sec">${esc(L.bottlenecks)}</h2><div class="themes-box">${bottleneckHtml}</div>`
    : '';

  const footerPlan = L.footerPlan.replace('{{plan}}', displayName);
  const footerCompany = L.footerCompany.replace('{{company}}', company);
  const footerCycle = L.footerCycle.replace('{{period}}', period || '—');

  return `<main class="report">
  <div class="watermark" aria-hidden="true">
    <div class="wm-brand">FILTRA.AI</div>
    <div class="wm-plan">${esc(displayName.toUpperCase())}</div>
    <div class="wm-company">${esc(company)}</div>
  </div>
  <div class="hero">
    <div class="brand-row"><span class="logo-wrap">${LOGO_SVG}</span><span class="brand">Filtra.AI</span></div>
    <div class="plan-title">${esc(hero.title)}</div>
    <div class="plan-sub">${esc(hero.subtitle)}</div>
    <div class="hero-meta">
      <div class="company">${esc(company)}</div>
      <div class="cycle">${esc(period)} · ${esc(L.planLine)}: <strong>${esc(displayName)}</strong></div>
      <span class="badge-plan">${esc(displayName)}</span>
    </div>
  </div>
  <section class="benefits ${tierClass}">
    <div class="ben-head">
      <div class="ben-head-left">
        <span class="ben-title">${esc(L.benefitsTier)}</span>
        <span class="ben-count">${esc(countLabel)}</span>
      </div>
      <span class="ben-tier">${esc(tierLabel)}</span>
    </div>
    <div class="ben-grid">
      <div class="ben in"><h3>${esc(L.benefitsIn)}</h3><ul>${benIn}</ul></div>
      <div class="ben out"><h3>${esc(L.benefitsOut)}</h3><ul>${benOut}</ul></div>
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
  ${sentBlock}${themesBlock}${rankingBlock}${reiBlock}
  <footer>
    <div class="foot-grid">
      <div class="foot-col">
        <div class="foot-brand">${esc(L.footerBrand)}</div>
        <div class="foot-plan">${esc(footerPlan)}</div>
      </div>
      <div class="foot-col foot-center">
        <div class="foot-company">${esc(footerCompany)}</div>
        <div class="foot-cycle">${esc(footerCycle)}</div>
      </div>
      <div class="foot-col foot-right">
        <div class="foot-gen">${esc(genLabel)}</div>
      </div>
    </div>
    <div class="foot-rights">${esc(rights)}</div>
  </footer>
  <style>
    @page{size:A4;margin:12mm 12mm 16mm 12mm}
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:#fff}
    body{font-family:"Segoe UI",system-ui,-apple-system,Arial,Helvetica,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased}
    .report{position:relative;width:100%;max-width:170mm;margin:0 auto;padding:0 0 8mm;background:#fff;overflow:visible}
    .watermark{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;z-index:0;transform:rotate(-32deg);user-select:none}
    .wm-brand{font-size:48px;font-weight:900;letter-spacing:8px;color:#1e3a8a;opacity:.04;line-height:1}
    .wm-plan{font-size:18px;font-weight:800;letter-spacing:5px;color:#1e40af;opacity:.045;margin-top:6px}
    .wm-company{font-size:12px;font-weight:600;letter-spacing:1.5px;color:#334155;opacity:.035;margin-top:4px;max-width:420px;text-align:center}
    .hero,.benefits,.kpis,.bars,.sent-grid,.themes-box,.sec,.kpi,.sent-card,.ben{page-break-inside:avoid;break-inside:avoid}
    .hero{position:relative;z-index:1;background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 45%,#3b82f6 100%);border-radius:12px;padding:14px 16px 12px;color:#fff;margin:0 0 10px;box-shadow:0 6px 18px rgba(37,99,235,.22);border:1px solid rgba(255,255,255,.12)}
    .brand-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
    .logo-wrap{display:inline-flex;width:34px;height:34px;border-radius:9px;overflow:hidden;flex-shrink:0;box-shadow:0 3px 10px rgba(15,23,42,.3);background:#05050a;border:1px solid rgba(255,255,255,.15)}
    .logo-wrap svg{display:block;width:34px;height:34px}
    .hero .brand{font-size:12px;font-weight:800;color:#fff;letter-spacing:.4px}
    .hero .plan-title{font-size:18px;font-weight:800;line-height:1.15;letter-spacing:-.02em}
    .hero .plan-sub{font-size:10px;color:#dbeafe;margin-top:4px;line-height:1.35;max-width:100%}
    .hero-meta{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.18);align-items:center}
    .hero .company{font-size:11px;font-weight:700;margin:0}
    .hero .cycle{font-size:9.5px;color:#bfdbfe;margin:0}
    .hero .cycle strong{color:#fff;font-weight:800}
    .badge-plan{margin-left:auto;font-size:8px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);color:#fff}
    .benefits{position:relative;z-index:1;margin:0 0 10px;border-radius:12px;padding:10px;border:1px solid #e2e8f0;background:#fff}
    .benefits.tier-ultra{border-color:#93c5fd;background:linear-gradient(180deg,#eff6ff 0%,#fff 55%)}
    .benefits.tier-corp{border-color:#818cf8;background:linear-gradient(180deg,#eef2ff 0%,#fff 55%)}
    .benefits.tier-rei{border-color:#c4b5fd;background:linear-gradient(180deg,#f5f3ff 0%,#fff 50%);border-width:1.5px}
    .benefits.tier-ultra,.benefits.tier-corp,.benefits.tier-rei,.benefits.tier-pro{overflow:hidden}
    .benefits.tier-ultra::before,.benefits.tier-corp::before,.benefits.tier-rei::before,.benefits.tier-pro::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px}
    .benefits.tier-pro::before{background:linear-gradient(180deg,#0ea5e9,#38bdf8)}
    .benefits.tier-ultra::before{background:linear-gradient(180deg,#2563eb,#60a5fa)}
    .benefits.tier-corp::before{background:linear-gradient(180deg,#4f46e5,#818cf8)}
    .benefits.tier-rei::before{background:linear-gradient(180deg,#7c3aed,#a78bfa)}
    .ben-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;padding:0 2px 8px;border-bottom:1px solid #e2e8f0}
    .ben-head-left{display:flex;flex-direction:column;gap:2px}
    .ben-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#1e40af}
    .benefits.tier-corp .ben-title{color:#4338ca}
    .benefits.tier-rei .ben-title{color:#6d28d9}
    .ben-count{font-size:9px;font-weight:600;color:#64748b}
    .ben-tier{font-size:8.5px;font-weight:700;color:#64748b;padding:3px 8px;border-radius:999px;background:#f1f5f9;border:1px solid #e2e8f0}
    .benefits.tier-ultra .ben-tier{background:#dbeafe;border-color:#93c5fd;color:#1d4ed8}
    .benefits.tier-corp .ben-tier{background:#e0e7ff;border-color:#a5b4fc;color:#3730a3}
    .benefits.tier-rei .ben-tier{background:#ede9fe;border-color:#c4b5fd;color:#5b21b6}
    .ben-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .ben{border-radius:10px;padding:8px 10px;border:1px solid #e2e8f0;background:#fff}
    .ben.in{background:linear-gradient(180deg,#f0fdf4 0%,#fff 70%);border-color:#bbf7d0}
    .benefits.tier-ultra .ben.in{background:linear-gradient(180deg,#eff6ff 0%,#fff 70%);border-color:#93c5fd}
    .benefits.tier-corp .ben.in{background:linear-gradient(180deg,#eef2ff 0%,#fff 70%);border-color:#a5b4fc}
    .benefits.tier-rei .ben.in{background:linear-gradient(180deg,#f5f3ff 0%,#fff 70%);border-color:#c4b5fd}
    .ben.out{background:#f8fafc}
    .ben h3{margin:0 0 6px;font-size:8.5px;text-transform:uppercase;letter-spacing:.55px;color:#166534;font-weight:800}
    .benefits.tier-ultra .ben.in h3{color:#1d4ed8}
    .benefits.tier-corp .ben.in h3{color:#3730a3}
    .benefits.tier-rei .ben.in h3{color:#5b21b6}
    .ben.out h3{color:#64748b}
    .ben ul{margin:0;padding:0;list-style:none}
    .ben li.feat{font-size:9.5px;color:#1e293b;margin-bottom:5px;line-height:1.3;display:flex;gap:5px;align-items:flex-start}
    .ben li.feat.premium .feat-text{font-weight:600}
    .ben li.feat.elite .feat-text{font-weight:700}
    .ben li.feat.locked{color:#94a3b8}
    .feat-text{flex:1}
    .ok{color:#16a34a;font-weight:800;flex-shrink:0}.no{color:#94a3b8;flex-shrink:0}
    .tag{flex-shrink:0;font-size:7px;font-weight:800;letter-spacing:.4px;padding:1px 4px;border-radius:3px;line-height:1.2}
    .tag-pro{background:#e0f2fe;color:#0369a1}
    .tag-ultra{background:#dbeafe;color:#1d4ed8}
    .tag-corp{background:#e0e7ff;color:#3730a3}
    .tag-rei{background:#ede9fe;color:#5b21b6}
    .tag-muted{background:#f1f5f9;color:#94a3b8}
    .sec{position:relative;z-index:1;font-size:11px;font-weight:800;color:#0f172a;margin:10px 0 6px;padding:0 0 4px;border-bottom:2px solid #2563eb;display:inline-block;min-width:120px}
    .kpis{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:6px}
    .kpi{border:1px solid #e2e8f0;border-radius:10px;padding:10px 8px;background:#fff}
    .kpi small{display:block;font-size:7.5px;text-transform:uppercase;letter-spacing:.45px;color:#64748b;font-weight:700;margin-bottom:4px}
    .kpi b{display:block;font-size:18px;color:#0f172a;line-height:1.1;font-weight:800}
    .kpi b.g{color:#16a34a}.kpi b.r{color:#dc2626}
    .kpi span{display:block;font-size:8.5px;color:#64748b;margin-top:4px}
    .bars{position:relative;z-index:1;margin-bottom:6px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px 6px}
    .bar-row{display:grid;grid-template-columns:28px 1fr 30px;gap:8px;align-items:center;margin-bottom:6px}
    .star{font-size:10px;color:#334155;font-weight:600}
    .track{height:9px;background:#f1f5f9;border-radius:999px;overflow:hidden}
    .fill{height:100%;border-radius:999px}.fill.bn{background:linear-gradient(90deg,#2563eb,#60a5fa)}
    .cnt{font-size:10px;color:#475569;text-align:right;font-weight:700}
    .sent-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:6px}
    .sent-card{border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#fff}
    .sent-card small{display:block;font-size:7.5px;text-transform:uppercase;font-weight:800;margin-bottom:4px}
    .sent-card small.g{color:#16a34a}.sent-card small.a{color:#d97706}.sent-card small.r{color:#dc2626}
    .sent-card b{display:block;font-size:16px;color:#0f172a;font-weight:800}
    .sent-card span{display:block;font-size:8.5px;color:#64748b;margin-top:3px}
    .themes-box{position:relative;z-index:1;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;background:#fff}
    .theme{font-size:10px;color:#1e293b;margin-bottom:4px}.theme b{color:#64748b;font-weight:700}
    .themes-empty{font-size:9.5px;color:#64748b}
    .donut-note{position:relative;z-index:1;font-size:9.5px;color:#475569;margin:0 0 6px;font-weight:600}
    .bn-row{display:grid;grid-template-columns:20px minmax(70px,1.1fr) 1fr 28px;gap:6px;align-items:center;margin-bottom:5px;font-size:10px}
    .bn-n{width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;background:#2563eb;color:#fff;font-size:9px;font-weight:800}
    .bn-name{color:#1e293b;font-weight:600}
    footer{position:relative;z-index:1;margin-top:12px;border-top:1px solid #e2e8f0;padding-top:8px;page-break-inside:avoid;break-inside:avoid}
    .foot-grid{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:8px;align-items:start}
    .foot-brand{font-size:10px;font-weight:800;color:#1e40af}
    .foot-plan{font-size:8.5px;color:#475569;font-weight:600;margin-top:1px}
    .foot-company{font-size:9.5px;font-weight:700;color:#0f172a}
    .foot-cycle{font-size:8px;color:#64748b;margin-top:1px}
    .foot-center{text-align:center}
    .foot-right{text-align:right}
    .foot-gen{font-size:7.5px;color:#94a3b8}
    .foot-rights{font-size:7px;color:#94a3b8;margin-top:6px;text-align:center;line-height:1.35;border-top:1px dashed #e2e8f0;padding-top:5px}
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
  host.style.cssText = 'position:fixed;left:-100000px;top:0;width:794px;background:#fff;z-index:-1;padding:0;margin:0';
  host.innerHTML = makeHtml(p);
  document.body.appendChild(host);
  try {
    await waitImages(host);
    const mod = await import('html2pdf.js');
    const planSlug = slug(planDisplayName(p.plan || 'pro', p.lang || 'pt'));
    const worker = (mod.default as any)()
      .set({
        margin: [10, 10, 12, 10],
        filename: `relatorio-${planSlug}-${slug(p.companyName)}-${slug(p.periodLabel)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.hero', '.benefits', '.kpis', '.kpi', '.bars', '.sent-grid', '.sent-card', '.themes-box', 'footer', '.sec'] },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
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
