/**
 * i18n + benefícios diferenciados por plano para o PDF mensal Filtra.AI
 * PT / EN / ES / ZH
 */

export type PdfLang = 'pt' | 'en' | 'es' | 'zh';
export type PdfDepth = 'pro' | 'ultra' | 'corp' | 'rei';

const DICT: Record<PdfLang, Record<string, string>> = {
  pt: {
    subtitle: 'Relatório de reputação inteligente',
    page: 'Pág. {{n}} / {{t}}',
    benefits_title: 'Benefícios do seu plano',
    period: 'Período',
    plan: 'Plano',
    summary: 'Resumo do período',
    volume: 'Avaliações',
    volume_sub: 'no período',
    avg: 'Média',
    avg_sub: 'de 1 a 5',
    critical: 'Críticas',
    critical_sub: 'nota ≤ 3',
    positive: 'Positivas',
    dist: 'Distribuição de notas',
    pos_vs_crit: 'Positivas: {{p}} ({{pp}})  ·  Críticas: {{c}} ({{cp}})',
    sentiment: 'Análise de sentimento',
    sent_pos: 'Positivo',
    sent_neu: 'Neutro',
    sent_neg: 'Negativo',
    themes: 'Temas mais citados (IA)',
    vision_rei: 'Visão executiva Rei',
    positives: 'Positivas',
    critiques: 'Críticas',
    total_label: 'Total',
    total: 'total',
    bottlenecks: 'Gargalos principais',
    empty: 'Nenhuma avaliação registrada neste período.',
    no_units: 'Nenhuma unidade cadastrada. Cadastre filiais para ranking multi-unidade.',
    ranking: 'Ranking de unidades',
    unit: 'Unidade',
    volume_col: 'Volume',
    avg_col: 'Média',
    crit_col: 'Críticas',
    branch: 'Filial',
    this_period: 'neste período',
    dist_unit: 'Distribuição na unidade',
    themes_unit: 'Temas da unidade',
    banner_pro: 'PRO · KPIs essenciais',
    banner_ultra: 'ULTRA · KPIs + Inteligência Artificial',
    banner_corp: 'CORPORATIVO · Multi-unidade + Ranking',
    banner_rei: 'REI · Relatório executivo completo',
    benefits_pro: 'Inclui: KPIs + distribuição de notas + positivas vs críticas',
    benefits_ultra: 'Inclui: KPIs + sentimento + temas IA',
    benefits_corp: 'Inclui: tudo Ultra + ranking de unidades + página por filial',
    benefits_rei: 'Inclui: tudo Corp + visão donut + gargalos + detalhe rico por filial',
    f_kpis: 'KPIs e volume de avaliações',
    f_dist: 'Distribuição de notas (1★–5★)',
    f_poscrit: 'Positivas vs críticas',
    f_sent: 'Análise de sentimento (IA)',
    f_themes: 'Temas mais citados (IA)',
    f_ranking: 'Ranking de unidades / filiais',
    f_branch: 'Página dedicada por filial',
    f_donut: 'Visão executiva (donut)',
    f_bottleneck: 'Gargalos e barras de temas',
    f_rich: 'Detalhe rico por filial (IA)',
  },
  en: {
    subtitle: 'Intelligent reputation report',
    page: 'Page {{n}} / {{t}}',
    benefits_title: 'Your plan benefits',
    period: 'Period',
    plan: 'Plan',
    summary: 'Period summary',
    volume: 'Reviews',
    volume_sub: 'in the period',
    avg: 'Average',
    avg_sub: 'from 1 to 5',
    critical: 'Critical',
    critical_sub: 'rating ≤ 3',
    positive: 'Positive',
    dist: 'Rating distribution',
    pos_vs_crit: 'Positive: {{p}} ({{pp}})  ·  Critical: {{c}} ({{cp}})',
    sentiment: 'Sentiment analysis',
    sent_pos: 'Positive',
    sent_neu: 'Neutral',
    sent_neg: 'Negative',
    themes: 'Top themes (AI)',
    vision_rei: 'Rei executive view',
    positives: 'Positive',
    critiques: 'Critical',
    total_label: 'Total',
    total: 'total',
    bottlenecks: 'Main bottlenecks',
    empty: 'No reviews recorded in this period.',
    no_units: 'No units registered. Add branches for multi-unit ranking.',
    ranking: 'Unit ranking',
    unit: 'Unit',
    volume_col: 'Volume',
    avg_col: 'Avg',
    crit_col: 'Critical',
    branch: 'Branch',
    this_period: 'this period',
    dist_unit: 'Unit distribution',
    themes_unit: 'Unit themes',
    banner_pro: 'PRO · Essential KPIs',
    banner_ultra: 'ULTRA · KPIs + Artificial Intelligence',
    banner_corp: 'CORPORATE · Multi-unit + Ranking',
    banner_rei: 'REI · Full executive report',
    benefits_pro: 'Includes: KPIs + rating distribution + positive vs critical',
    benefits_ultra: 'Includes: KPIs + sentiment + AI themes',
    benefits_corp: 'Includes: all Ultra + unit ranking + page per branch',
    benefits_rei: 'Includes: all Corp + donut view + bottlenecks + rich branch detail',
    f_kpis: 'KPIs and review volume',
    f_dist: 'Rating distribution (1★–5★)',
    f_poscrit: 'Positive vs critical',
    f_sent: 'Sentiment analysis (AI)',
    f_themes: 'Top themes (AI)',
    f_ranking: 'Unit / branch ranking',
    f_branch: 'Dedicated page per branch',
    f_donut: 'Executive view (donut)',
    f_bottleneck: 'Bottlenecks and theme bars',
    f_rich: 'Rich branch detail (AI)',
  },
  es: {
    subtitle: 'Informe de reputación inteligente',
    page: 'Pág. {{n}} / {{t}}',
    benefits_title: 'Beneficios de tu plan',
    period: 'Período',
    plan: 'Plan',
    summary: 'Resumen del período',
    volume: 'Reseñas',
    volume_sub: 'en el período',
    avg: 'Promedio',
    avg_sub: 'de 1 a 5',
    critical: 'Críticas',
    critical_sub: 'nota ≤ 3',
    positive: 'Positivas',
    dist: 'Distribución de notas',
    pos_vs_crit: 'Positivas: {{p}} ({{pp}})  ·  Críticas: {{c}} ({{cp}})',
    sentiment: 'Análisis de sentimiento',
    sent_pos: 'Positivo',
    sent_neu: 'Neutro',
    sent_neg: 'Negativo',
    themes: 'Temas más citados (IA)',
    vision_rei: 'Visión ejecutiva Rei',
    positives: 'Positivas',
    critiques: 'Críticas',
    total_label: 'Total',
    total: 'total',
    bottlenecks: 'Principales cuellos de botella',
    empty: 'No hay reseñas registradas en este período.',
    no_units: 'Ninguna unidad registrada. Agregue sucursales para ranking multiunidad.',
    ranking: 'Ranking de unidades',
    unit: 'Unidad',
    volume_col: 'Volumen',
    avg_col: 'Prom.',
    crit_col: 'Críticas',
    branch: 'Sucursal',
    this_period: 'en este período',
    dist_unit: 'Distribución en la unidad',
    themes_unit: 'Temas de la unidad',
    banner_pro: 'PRO · KPIs esenciales',
    banner_ultra: 'ULTRA · KPIs + Inteligencia Artificial',
    banner_corp: 'CORPORATIVO · Multiunidad + Ranking',
    banner_rei: 'REI · Informe ejecutivo completo',
    benefits_pro: 'Incluye: KPIs + distribución de notas + positivas vs críticas',
    benefits_ultra: 'Incluye: KPIs + sentimiento + temas IA',
    benefits_corp: 'Incluye: todo Ultra + ranking de unidades + página por sucursal',
    benefits_rei: 'Incluye: todo Corp + visión donut + cuellos de botella + detalle rico por sucursal',
    f_kpis: 'KPIs y volumen de reseñas',
    f_dist: 'Distribución de notas (1★–5★)',
    f_poscrit: 'Positivas vs críticas',
    f_sent: 'Análisis de sentimiento (IA)',
    f_themes: 'Temas más citados (IA)',
    f_ranking: 'Ranking de unidades / sucursales',
    f_branch: 'Página dedicada por sucursal',
    f_donut: 'Visión ejecutiva (donut)',
    f_bottleneck: 'Cuellos de botella y barras de temas',
    f_rich: 'Detalle rico por sucursal (IA)',
  },
  zh: {
    subtitle: '智能声誉报告',
    page: '第 {{n}} / {{t}} 页',
    benefits_title: '您的套餐权益',
    period: '周期',
    plan: '套餐',
    summary: '周期摘要',
    volume: '评价数',
    volume_sub: '本周期',
    avg: '平均分',
    avg_sub: '1 至 5',
    critical: '差评',
    critical_sub: '评分 ≤ 3',
    positive: '好评',
    dist: '评分分布',
    pos_vs_crit: '好评: {{p}} ({{pp}})  ·  差评: {{c}} ({{cp}})',
    sentiment: '情感分析',
    sent_pos: '正面',
    sent_neu: '中性',
    sent_neg: '负面',
    themes: '热门主题 (AI)',
    vision_rei: 'Rei 高管视图',
    positives: '好评',
    critiques: '差评',
    total_label: '总计',
    total: '总计',
    bottlenecks: '主要瓶颈',
    empty: '本周期无评价记录。',
    no_units: '未登记门店。请添加分店以启用多门店排名。',
    ranking: '门店排名',
    unit: '门店',
    volume_col: '数量',
    avg_col: '均分',
    crit_col: '差评',
    branch: '分店',
    this_period: '本周期',
    dist_unit: '门店评分分布',
    themes_unit: '门店主题',
    banner_pro: 'PRO · 核心 KPI',
    banner_ultra: 'ULTRA · KPI + 人工智能',
    banner_corp: '企业版 · 多门店 + 排名',
    banner_rei: 'REI · 完整高管报告',
    benefits_pro: '包含：KPI + 评分分布 + 好评 vs 差评',
    benefits_ultra: '包含：KPI + 情感分析 + AI 主题',
    benefits_corp: '包含：全部 Ultra + 门店排名 + 每店一页',
    benefits_rei: '包含：全部 Corp + 圆环图 + 瓶颈 + 丰富门店详情',
    f_kpis: 'KPI 与评价量',
    f_dist: '评分分布 (1★–5★)',
    f_poscrit: '好评 vs 差评',
    f_sent: '情感分析 (AI)',
    f_themes: '热门主题 (AI)',
    f_ranking: '门店排名',
    f_branch: '每店专属页',
    f_donut: '高管圆环图',
    f_bottleneck: '瓶颈与主题条',
    f_rich: '丰富门店详情 (AI)',
  },
};

export function normalizePdfLang(raw?: string | null): PdfLang {
  const s = String(raw || '').toLowerCase().trim();
  if (s.startsWith('en')) return 'en';
  if (s.startsWith('es')) return 'es';
  if (s.startsWith('zh') || s.startsWith('cn')) return 'zh';
  return 'pt';
}

export function monthPeriod(mesAno: string, lang: PdfLang): string {
  const [y, m] = String(mesAno || '').split('-');
  const month = Number(m) || 1;
  const year = y || String(new Date().getFullYear());
  const names: Record<PdfLang, string[]> = {
    pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  };
  return `${names[lang][month - 1] || month}/${year}`;
}

export function t(lang: PdfLang, key: string, vars?: Record<string, string | number>): string {
  let s = DICT[lang]?.[key] ?? DICT.pt[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split('{{' + k + '}}').join(String(v));
    }
  }
  return s;
}

export function benefitsFor(depth: PdfDepth, lang: PdfLang): string {
  if (depth === 'rei') return t(lang, 'benefits_rei');
  if (depth === 'corp') return t(lang, 'benefits_corp');
  if (depth === 'ultra') return t(lang, 'benefits_ultra');
  return t(lang, 'benefits_pro');
}

export function badgeFor(depth: PdfDepth, lang: PdfLang): string {
  if (depth === 'rei') return 'REI';
  if (depth === 'corp') return lang === 'en' ? 'CORP' : 'CORPORATIVO';
  if (depth === 'ultra') return 'ULTRA';
  return 'PRO';
}

export function bannerFor(depth: PdfDepth, lang: PdfLang): string {
  if (depth === 'rei') return t(lang, 'banner_rei');
  if (depth === 'corp') return t(lang, 'banner_corp');
  if (depth === 'ultra') return t(lang, 'banner_ultra');
  return t(lang, 'banner_pro');
}

export function featureChecklist(
  depth: PdfDepth,
  lang: PdfLang
): { label: string; included: boolean }[] {
  const order: { key: string; min: PdfDepth }[] = [
    { key: 'f_kpis', min: 'pro' },
    { key: 'f_dist', min: 'pro' },
    { key: 'f_poscrit', min: 'pro' },
    { key: 'f_sent', min: 'ultra' },
    { key: 'f_themes', min: 'ultra' },
    { key: 'f_ranking', min: 'corp' },
    { key: 'f_branch', min: 'corp' },
    { key: 'f_donut', min: 'rei' },
    { key: 'f_bottleneck', min: 'rei' },
    { key: 'f_rich', min: 'rei' },
  ];
  const rank: Record<PdfDepth, number> = { pro: 1, ultra: 2, corp: 3, rei: 4 };
  const current = rank[depth] || 1;
  return order.map((o) => ({
    label: t(lang, o.key),
    included: current >= rank[o.min],
  }));
}
