import type { ClientReportPayload } from './reportPdfClient';

export const esc = (s: string) =>
  String(s || '')
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;');

export const pct = (n: number, t: number) => (t ? `${Math.round((n / t) * 100)}%` : '0%');

export const slug = (s: string) =>
  String(s || 'empresa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'empresa';

export type Depth = 'pro' | 'ultra' | 'corp' | 'rei';

export function planDisplayName(plan: string, lang: string): string {
  const p = String(plan || '').toLowerCase();
  if (p.includes('rei')) return 'Rei';
  if (p.includes('corp') || p.includes('empres')) return lang === 'en' ? 'Corporate' : 'Corporativo';
  if (p.includes('ultra') || p.includes('premium')) return 'Ultra';
  if (p.includes('trial') || p.includes('teste') || p.includes('trialing')) return 'Trial (Ultra)';
  if (p.includes('pro')) return 'Pro';
  if (p.includes('inicial') || p.includes('basic') || p.includes('starter')) return lang === 'en' ? 'Starter' : 'Inicial';
  return plan || 'Pro';
}

export function depthOf(plan: string): Depth {
  const p = String(plan || '').toLowerCase();
  if (p.includes('rei')) return 'rei';
  if (p.includes('corp') || p.includes('empres')) return 'corp';
  if (p.includes('ultra') || p.includes('premium') || p.includes('trial') || p.includes('teste') || p.includes('trialing')) return 'ultra';
  if (p.includes('pro')) return 'pro';
  return 'pro';
}

export function planHero(depth: Depth, lang: string, displayName: string): { title: string; subtitle: string } {
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

export type Feature = { key: string; min: Depth; label: string };

export function features(depth: Depth, lang: string): { included: Feature[]; locked: Feature[] } {
  const rank: Record<Depth, number> = { pro: 1, ultra: 2, corp: 3, rei: 4 };
  const cur = rank[depth];
  const labels: Record<string, Record<string, string>> = {
    pt: {
      kpis: 'KPIs e volume de avaliações', dist: 'Distribuição de notas (1★–5★)', poscrit: 'Positivas vs críticas',
      sent: 'Análise de sentimento (IA)', themes: 'Temas mais citados (IA)', ranking: 'Ranking de unidades / filiais',
      branch: 'Página dedicada por filial', donut: 'Visão executiva (donut pos/neu/neg)', bottleneck: 'Gargalos e barras de temas', rich: 'Detalhe rico por filial (IA)',
    },
    en: {
      kpis: 'KPIs and review volume', dist: 'Rating distribution (1★–5★)', poscrit: 'Positive vs critical',
      sent: 'Sentiment analysis (AI)', themes: 'Top themes (AI)', ranking: 'Unit / branch ranking',
      branch: 'Dedicated page per branch', donut: 'Executive view (donut)', bottleneck: 'Bottlenecks and theme bars', rich: 'Rich branch detail (AI)',
    },
    es: {
      kpis: 'KPIs y volumen de reseñas', dist: 'Distribución de notas (1★–5★)', poscrit: 'Positivas vs críticas',
      sent: 'Análisis de sentimiento (IA)', themes: 'Temas más citados (IA)', ranking: 'Ranking de unidades / sucursales',
      branch: 'Página dedicada por sucursal', donut: 'Visión ejecutiva (donut)', bottleneck: 'Cuellos de botella y barras de temas', rich: 'Detalle rico por sucursal (IA)',
    },
    zh: {
      kpis: 'KPI 与评价量', dist: '评分分布 (1★–5★)', poscrit: '好评 vs 差评',
      sent: '情感分析 (AI)', themes: '热门主题 (AI)', ranking: '门店排名',
      branch: '每店专属页', donut: '高管圆环图', bottleneck: '瓶颈与主题条', rich: '丰富门店详情 (AI)',
    },
  };
  const l = ['pt', 'en', 'es', 'zh'].includes(lang) ? lang : 'pt';
  const lab = labels[l] || labels.pt;
  const order: { key: string; min: Depth }[] = [
    { key: 'kpis', min: 'pro' }, { key: 'dist', min: 'pro' }, { key: 'poscrit', min: 'pro' },
    { key: 'sent', min: 'ultra' }, { key: 'themes', min: 'ultra' },
    { key: 'ranking', min: 'corp' }, { key: 'branch', min: 'corp' },
    { key: 'donut', min: 'rei' }, { key: 'bottleneck', min: 'rei' }, { key: 'rich', min: 'rei' },
  ];
  const all = order.map((o) => ({ key: o.key, min: o.min, label: lab[o.key] }));
  return { included: all.filter((f) => cur >= rank[f.min]), locked: all.filter((f) => cur < rank[f.min]) };
}

export function sectionLabels(lang: string) {
  const pt = {
    benefitsIn: 'Incluído neste plano',
    benefitsOut: 'Não incluso (faça upgrade para liberar)',
    benefitsTier: 'Benefícios do seu plano',
    summary: 'Resumo do ciclo',
    volume: 'Volume', volumeSub: 'avaliações', avg: 'Nota média', avgSub: 'escala 1–5',
    positive: 'Positivas', positiveSub: '4–5★', critical: 'Críticas', criticalSub: '1–3★',
    dist: 'Distribuição de notas', sentiment: 'Análise de sentimento (IA)', themes: 'Temas mais citados (IA)',
    themesEmpty: 'Nenhum tema de IA neste ciclo ainda.',
    ranking: 'Ranking de unidades (Corporativo+)',
    rankingEmpty: 'Cadastre filiais para ver o ranking multi-unidade. Disponível nos planos Corporativo e Rei.',
    executive: 'Visão executiva (Rei)', bottlenecks: 'Gargalos principais (Rei)',
    footer: 'Filtra.AI · Plano {{plan}} · {{company}} · relatório do ciclo',
    rights: '© Filtra.AI — Todos os direitos reservados. Documento confidencial.',
    planLine: 'Plano',
  };
  if (lang === 'en') return { ...pt, benefitsIn: 'Included in this plan', benefitsOut: 'Not in this plan (upgrade to unlock)', benefitsTier: 'Plan benefits', summary: 'Cycle summary', volume: 'Volume', volumeSub: 'reviews', avg: 'Average', avgSub: 'scale 1–5', positive: 'Positive', positiveSub: '4–5★', critical: 'Critical', criticalSub: '1–3★', dist: 'Rating distribution', sentiment: 'Sentiment analysis (AI)', themes: 'Top themes (AI)', themesEmpty: 'No AI themes in this cycle yet.', ranking: 'Unit ranking (Corporate+)', rankingEmpty: 'Register branches to see multi-unit ranking.', executive: 'Executive view (Rei)', bottlenecks: 'Main bottlenecks (Rei)', footer: 'Filtra.AI · Plan {{plan}} · {{company}} · cycle report', rights: '© Filtra.AI — All rights reserved. Confidential document.', planLine: 'Plan' };
  if (lang === 'es') return { ...pt, benefitsIn: 'Incluido en este plan', benefitsOut: 'No incluido (mejora el plan)', benefitsTier: 'Beneficios del plan', summary: 'Resumen del ciclo', volume: 'Volumen', volumeSub: 'reseñas', avg: 'Nota media', avgSub: 'escala 1–5', positive: 'Positivas', critical: 'Críticas', dist: 'Distribución de notas', sentiment: 'Análisis de sentimiento (IA)', themes: 'Temas principales (IA)', themesEmpty: 'Ningún tema de IA aún.', ranking: 'Ranking de unidades (Corporativo+)', rankingEmpty: 'Registre sucursales para ranking multiunidad.', executive: 'Visión ejecutiva (Rei)', bottlenecks: 'Cuellos de botella (Rei)', footer: 'Filtra.AI · Plan {{plan}} · {{company}} · informe del ciclo', rights: '© Filtra.AI — Todos los derechos reservados.', planLine: 'Plan' };
  if (lang === 'zh') return { ...pt, benefitsIn: '本套餐包含', benefitsOut: '本套餐不含', benefitsTier: '套餐权益', summary: '周期摘要', volume: '数量', volumeSub: '评价', avg: '平均分', avgSub: '1–5', positive: '好评', critical: '差评', dist: '评分分布', sentiment: '情感分析 (AI)', themes: '热门主题 (AI)', themesEmpty: '暂无主题', ranking: '门店排名', rankingEmpty: '请登记分店', executive: '高管视图 (Rei)', bottlenecks: '主要瓶颈 (Rei)', footer: 'Filtra.AI · 套餐 {{plan}} · {{company}} · 周期报告', rights: '© Filtra.AI', planLine: '套餐' };
  return pt;
}

export function distOf(p: ClientReportPayload): number[] {
  const anyStats = p.stats as { distribution?: number[] };
  if (Array.isArray(anyStats.distribution) && anyStats.distribution.length === 5) return anyStats.distribution.map((n) => Number(n) || 0);
  return [0, 0, 0, 0, 0];
}

export const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="40" height="40" role="img" aria-label="Filtra.AI">' +
  '<defs><linearGradient id="g" x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">' +
  '<stop stop-color="#60a5fa"/><stop offset="0.45" stop-color="#3b82f6"/><stop offset="0.75" stop-color="#6366f1"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>' +
  '<linearGradient id="g2" x1="160" y1="160" x2="400" y2="420" gradientUnits="userSpaceOnUse">' +
  '<stop stop-color="#93c5fd"/><stop offset="0.5" stop-color="#6366f1"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs>' +
  '<rect width="512" height="512" rx="112" fill="#05050a"/>' +
  '<path d="M112 128c0-35 29-64 64-64h176c26 0 42 30 26 51L272 230c-10 13-25 20-41 20h-55c-35 0-64-29-64-64v-58Z" fill="url(#g)"/>' +
  '<path d="M112 224h112c19 0 36 11 44 28l102 210c11 23-6 50-31 50h-66c-12 0-23-6-29-17L146 290c-21-40-34-58-34-66Z" fill="url(#g2)"/>' +
  '<path d="M176 272h112c14 0 25 9 29 22l10 30c3 10-5 20-15 20H208c-18 0-32-14-32-32v-40Z" fill="url(#g)" opacity="0.95"/></svg>';
