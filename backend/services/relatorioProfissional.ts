/**
 * Relatório profissional — JSON-first, determinístico e pronto para canais.
 *
 * O relatório é um objeto de negócio, não um arquivo. A mesma estrutura
 * alimenta painel, e-mail, WhatsApp, SMS/WeChat e futuras camadas de IA.
 */
import type { Database } from 'sqlite';
import { planLabel, PLANOS_OFICIAIS } from '../lib/plans.js';
import { planTemIA } from '../lib/quota.js';
import { aiConfigured, gerarNarrativaRelatorio } from '../groqService.js';

export type ReportChannel = 'email' | 'whatsapp' | 'sms' | 'wechat';

export type RelatorioDestino = {
  canal: ReportChannel;
  destino: string;
};

type Review = {
  id?: string;
  rating?: unknown;
  unidade_id?: string | null;
  createdAt?: unknown;
  created_at?: unknown;
  createdat?: unknown;
  is_test?: unknown;
  ai_tags?: unknown;
  sentiment?: unknown;
  treated_at?: unknown;
};

const PLAN_BENEFITS: Record<string, string[]> = {
  inicial: [
    'Até 100 feedbacks por mês',
    'Dashboard para acompanhar avaliações e indicadores essenciais',
    'Integração com WhatsApp',
  ],
  pro: [
    'Até 300 feedbacks por mês',
    'Dashboard para acompanhar avaliações e indicadores essenciais',
    'Integração com WhatsApp',
    'Relatório profissional mensal com indicadores do período',
  ],
  ultra: [
    'Até 800 feedbacks por mês',
    'Relatório profissional mensal com análise de sentimento e temas recorrentes',
    'Análises com inteligência artificial',
    'Indicadores avançados para acompanhar a reputação',
  ],
  corporativo: [
    'Até 2.500 feedbacks por mês',
    'Relatório profissional mensal com análise de sentimento e temas recorrentes',
    'Gestão consolidada de múltiplas unidades',
    'Ranking comparativo de desempenho por unidade',
    'Análise dos temas operacionais de cada unidade',
    'Prioridades de ação baseadas nas avaliações do período',
    'Links de avaliação exclusivos para cada unidade',
    'Suporte prioritário',
    'Acesso antecipado a funcionalidades selecionadas',
  ],
  rei: [
    'Até 8.000 feedbacks por mês',
    'Todos os recursos do Corporativo',
    'Relatório executivo mensal preparado para a diretoria',
    'Radar estratégico de riscos e tendências de reputação',
    'Oportunidades de crescimento identificadas nos dados',
    'Recomendações executivas priorizadas por evidência e urgência',
  ],
};

const PLAN_ORDER = ['inicial', 'pro', 'ultra', 'corporativo', 'rei'];

function normalizePlan(value: unknown): string {
  const p = String(value || '').trim().toLowerCase();
  if (p === 'corp' || p === 'corporate') return 'corporativo';
  if (p === 'teste' || p === 'test' || p.startsWith('trial')) return 'rei';
  return PLANOS_OFICIAIS.includes(p as any) ? p : 'pro';
}

function planBenefits(plan: string): string[] {
  const normalized = normalizePlan(plan);
  return PLAN_BENEFITS[normalized] || PLAN_BENEFITS.pro;
}

function nextPlan(plan: string): string | null {
  const normalized = normalizePlan(plan);
  const index = PLAN_ORDER.indexOf(normalized);
  return index >= 0 && index < PLAN_ORDER.length - 1 ? PLAN_ORDER[index + 1] : null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dateOf(row: Review): string {
  return String(row.createdAt ?? row.createdat ?? row.created_at ?? '');
}

function isTest(row: Review): boolean {
  return Number(row.is_test) === 1 || row.is_test === true || String(row.is_test).toLowerCase() === 'true';
}

function percent(value: number, total: number): number {
  return total ? Math.round((value / total) * 100) : 0;
}

function tags(value: unknown): string[] {
  let parsed = value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed || '[]'); } catch { parsed = []; }
  }
  return Array.isArray(parsed)
    ? parsed.map(String).map((x) => x.trim()).filter(Boolean)
    : [];
}

function sentiment(row: Review): 'positivo' | 'neutro' | 'negativo' {
  const raw = String(row.sentiment || '').toLowerCase();
  if (raw.includes('pos')) return 'positivo';
  if (raw.includes('neg')) return 'negativo';
  if (raw.includes('neu')) return 'neutro';
  const rating = Number(row.rating);
  if (rating >= 4) return 'positivo';
  if (rating <= 2) return 'negativo';
  return 'neutro';
}

function summarizeThemes(rows: Review[], positive: boolean): Array<{ tema: string; volume: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const rating = Number(row.rating);
    const belongs = positive ? rating >= 4 : rating <= 3;
    if (!belongs) continue;
    for (const tag of tags(row.ai_tags)) map.set(tag, (map.get(tag) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([tema, volume]) => ({ tema, volume }));
}

function buildSummary(plan: string, kpi: any): string {
  if (!kpi.avaliacoes) {
    return 'Não houve avaliações válidas no período. O relatório está pronto para receber dados assim que novas avaliações entrarem no painel.';
  }
  const quality =
    kpi.nota_media >= 4.5 ? 'desempenho excelente' :
    kpi.nota_media >= 4 ? 'desempenho positivo' :
    kpi.nota_media >= 3 ? 'desempenho estável, com pontos de atenção' :
    'cenário que merece atenção prioritária';
  const plan = planLabel(plan);
  return `No período analisado, o ${plan} registrou ${kpi.avaliacoes} avaliações, nota média de ${kpi.nota_media.toFixed(1)} e ${kpi.percentual_positivas}% de avaliações positivas. O cenário indica ${quality}.`;
}

function buildRecommendations(kpi: any, themes: any): string[] {
  const out: string[] = [];
  if (kpi.criticas > 0) out.push(`Priorizar o tratamento das ${kpi.criticas} avaliações críticas (1–2 estrelas).`);
  if (kpi.percentual_positivas < 80) out.push('Investigar os principais temas associados às avaliações não positivas.');
  if (themes.length) out.push(`Acompanhar o tema recorrente “${themes[0].tema}” e validar a causa na operação.`);
  if (!out.length) out.push('Manter o acompanhamento periódico e comparar a evolução com o próximo ciclo.');
  return out.slice(0, 4);
}

function channelTexts(report: any) {
  const k = report.kpis;
  const li = (items: any[], render: (item: any) => string) => items.length ? '<ul>' + items.map(render).join('') + '</ul>' : '<p>Sem evidência suficiente para destacar itens neste período.</p>';
  const themes = [...(report.temas?.atencao || []), ...(report.temas?.positivos || [])].slice(0, 8);
  const units = (report.unidades || []).slice().sort((a: any, b: any) => a.nota_media - b.nota_media);
  const recs = report.recomendacoes || [];
  const textParts = [
    'FILTRA.AI | RELATÓRIO MENSAL DE REPUTAÇÃO',
    report.empresa.nome + ' · ' + report.periodo + ' · Plano ' + report.plano.nome,
    '', 'RESUMO EXECUTIVO', report.resumo_executivo,
    '', 'INDICADORES DO PERÍODO',
    'Avaliações: ' + k.avaliacoes + ' | Nota média: ' + Number(k.nota_media).toFixed(1) + '/5 | Positivas: ' + k.percentual_positivas + '% | Críticas: ' + k.criticas,
    '', 'POR QUE ISSO IMPORTA', report.narrativa.por_que_importa,
    '', 'ONDE ATUAR', report.narrativa.onde_atuar,
    '', 'TEMAS RECORRENTES', themes.map((x: any) => '• ' + x.tema + ': ' + x.volume + ' ocorrência(s)').join('\n') || 'Não há temas recorrentes suficientes para uma leitura confiável.',
    '', 'RISCOS A ACOMPANHAR', (report.riscos || []).map((x: any) => '• ' + x.titulo + ': ' + x.evidencias).join('\n') || 'Nenhum risco relevante sinalizado pelos critérios disponíveis.',
    '', 'OPORTUNIDADES', (report.oportunidades || []).map((x: any) => '• ' + x.titulo + ': ' + x.evidencias).join('\n') || 'Não há evidência suficiente para destacar oportunidades específicas.',
    '', 'PLANO DE AÇÃO RECOMENDADO', recs.map((x: string) => '• ' + x).join('\n') || 'Acompanhar a evolução no próximo ciclo.',
  ];
  if (units.length) textParts.push('', 'COMPARATIVO ENTRE UNIDADES', units.map((u: any) => '• ' + u.nome + ': média ' + Number(u.nota_media).toFixed(1) + ', ' + u.avaliacoes + ' avaliações, ' + u.criticas + ' críticas').join('\n'));
  textParts.push('', 'ESCOPO DO PLANO ' + String(report.plano.nome).toUpperCase(), report.plano.beneficios_incluidos.map((x: string) => '• ' + x).join('\n'));
  textParts.push('', 'Metodologia: análise baseada nas avaliações válidas registradas no período. Os sinais apontam temas a investigar e não comprovam, isoladamente, relações de causa e efeito.');
  const text = textParts.join('\n');
  const cards = [[String(k.avaliacoes), 'Avaliações'], [Number(k.nota_media).toFixed(1) + '/5', 'Nota média'], [String(k.percentual_positivas) + '%', 'Positivas'], [String(k.criticas), 'Críticas']];
  const cardsHtml = cards.map(([value, label]) => '<td style="width:25%;padding:6px"><div style="background:#f3f6fb;border:1px solid #e0e7f0;border-radius:8px;padding:14px"><div style="font-size:22px;font-weight:700;color:#183b62">' + escapeHtml(value) + '</div><div style="font-size:12px;color:#64748b;margin-top:5px">' + escapeHtml(label) + '</div></div></td>').join('');
  const section = (title: string, body: string) => '<h2 style="font-size:17px;color:#12304a;margin:26px 0 8px">' + title + '</h2>' + body;
  const html = '<div style="background:#f3f6fb;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#172033"><article style="max-width:760px;margin:auto;background:#fff;border:1px solid #e0e7f0;border-radius:12px;overflow:hidden"><header style="background:#11243b;padding:28px 30px;color:#fff"><div style="font-size:12px;letter-spacing:1.4px;color:#b9d5ff">FILTRA.AI · INTELIGÊNCIA DE REPUTAÇÃO</div><h1 style="font-size:25px;line-height:1.25;margin:12px 0 8px">Relatório mensal de reputação</h1><p style="margin:0;color:#d8e5f5">' + escapeHtml(report.empresa.nome) + ' · ' + escapeHtml(report.periodo) + ' · Plano ' + escapeHtml(report.plano.nome) + '</p></header><main style="padding:26px 30px">' + section('Resumo executivo', '<p style="font-size:15px;line-height:1.65">' + escapeHtml(report.resumo_executivo) + '</p>') + '<table role="presentation" style="width:100%;border-collapse:separate;margin:18px 0"><tr>' + cardsHtml + '</tr></table>' + section('Por que isso importa', '<p style="line-height:1.65">' + escapeHtml(report.narrativa.por_que_importa) + '</p>') + section('Onde atuar', '<p style="line-height:1.65">' + escapeHtml(report.narrativa.onde_atuar) + '</p>') + section('Temas recorrentes', li(themes, (x: any) => '<li><strong>' + escapeHtml(x.tema) + '</strong> — ' + Number(x.volume) + ' ocorrência(s)</li>')) + section('Riscos a acompanhar', li(report.riscos || [], (x: any) => '<li><strong>' + escapeHtml(x.titulo) + '</strong> — ' + escapeHtml(x.evidencias) + '</li>')) + section('Oportunidades', li(report.oportunidades || [], (x: any) => '<li><strong>' + escapeHtml(x.titulo) + '</strong> — ' + escapeHtml(x.evidencias) + '</li>')) + section('Plano de ação recomendado', li(recs, (x: string) => '<li>' + escapeHtml(x) + '</li>')) + (units.length ? section('Comparativo entre unidades', '<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th align="left" style="padding:9px;border-bottom:1px solid #dbe3ee">Unidade</th><th align="right" style="padding:9px;border-bottom:1px solid #dbe3ee">Média</th><th align="right" style="padding:9px;border-bottom:1px solid #dbe3ee">Avaliações</th><th align="right" style="padding:9px;border-bottom:1px solid #dbe3ee">Críticas</th></tr></thead><tbody>' + units.map((u: any) => '<tr><td style="padding:9px;border-bottom:1px solid #edf1f6">' + escapeHtml(u.nome) + '</td><td align="right" style="padding:9px;border-bottom:1px solid #edf1f6">' + Number(u.nota_media).toFixed(1) + '</td><td align="right" style="padding:9px;border-bottom:1px solid #edf1f6">' + u.avaliacoes + '</td><td align="right" style="padding:9px;border-bottom:1px solid #edf1f6">' + u.criticas + '</td></tr>').join('') + '</tbody></table>') : '') + section('Recursos incluídos no plano ' + escapeHtml(report.plano.nome), li(report.plano.beneficios_incluidos, (x: string) => '<li>' + escapeHtml(x) + '</li>')) + '<p style="font-size:11px;color:#64748b;border-top:1px solid #e0e7f0;padding-top:16px;margin-top:28px">Análise baseada nas avaliações válidas registradas no período. Os sinais indicam pontos a investigar e não comprovam, isoladamente, relações de causa e efeito.</p></main></article></div>';
  const compact = 'Filtra.AI | ' + report.empresa.nome + ' | ' + report.periodo + ': ' + k.avaliacoes + ' avaliações, média ' + Number(k.nota_media).toFixed(1) + '/5, ' + k.percentual_positivas + '% positivas, ' + k.criticas + ' críticas. ' + (recs[0] || 'Acompanhe a evolução no próximo ciclo.');
  const whatsapp = text.length > 3800 ? text.slice(0, 3700) + '…' : text;
  const sms = compact.length > 300 ? compact.slice(0, 297) + '…' : compact;
  return {
    email: { subject: 'Filtra.AI — Relatório mensal de reputação · ' + report.periodo + ' · ' + report.empresa.nome, text, html },
    whatsapp, sms, wechat: whatsapp,
  };
}
export async function buildRelatorioProfissional(
  db: Database,
  empresa: { id: string; nome_empresa?: string; plan?: string; slug?: string; locale?: string; idioma?: string; language?: string },
  mesAno?: string | null,
  localeRaw?: string | null,
) {
  const periodo = mesAno && /^\d{4}-\d{2}$/.test(mesAno)
    ? mesAno
    : new Date().toISOString().slice(0, 7);
  const plan = normalizePlan(empresa.plan);
  let rows: Review[] = [];
  try {
    rows = await db.all(
      'SELECT * FROM reviews WHERE empresa_id = ? ORDER BY createdAt DESC LIMIT 10000',
      [empresa.id],
    ) as Review[];
  } catch {
    try {
      rows = await db.all(
        'SELECT * FROM reviews WHERE empresa_id = ? ORDER BY created_at DESC LIMIT 10000',
        [empresa.id],
      ) as Review[];
    } catch { rows = []; }
  }

  const reais = rows.filter((row) => !isTest(row) && dateOf(row).startsWith(periodo));
  const avaliacoes = reais.length;
  const soma = reais.reduce((sum, row) => sum + Number(row.rating || 0), 0);
  const notaMedia = avaliacoes ? Math.round((soma / avaliacoes) * 10) / 10 : 0;
  const positivas = reais.filter((row) => Number(row.rating) >= 4).length;
  const criticas = reais.filter((row) => Number(row.rating) <= 2).length;
  const tratadas = reais.filter((row) => row.treated_at && Number(row.rating) <= 3).length;
  const distribuicao = [1, 2, 3, 4, 5].map((rating) => reais.filter((row) => Number(row.rating) === rating).length);
  const sent = reais.reduce((acc, row) => {
    const key = sentiment(row);
    acc[key] += 1;
    return acc;
  }, { positivo: 0, neutro: 0, negativo: 0 } as Record<string, number>);
  const temasPositivos = summarizeThemes(reais, true);
  const temasAtencao = summarizeThemes(reais, false);
  const kpis = {
    avaliacoes,
    nota_media: notaMedia,
    positivas,
    criticas,
    tratadas,
    percentual_positivas: percent(positivas, avaliacoes),
    percentual_criticas: percent(criticas, avaliacoes),
  };

  let unidades: any[] = [];
  if (['corporativo', 'rei'].includes(plan)) {
    try {
      const raw = await db.all(
        'SELECT id, nome FROM unidades WHERE empresa_id = ? AND (ativo IS NULL OR ativo = 1 OR ativo = true) ORDER BY nome',
        [empresa.id],
      ) as any[];
      unidades = raw.map((u) => {
        const reviews = reais.filter((r) => String(r.unidade_id || '') === String(u.id));
        const total = reviews.length;
        const avg = total ? Math.round((reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total) * 10) / 10 : 0;
        return { id: u.id, nome: u.nome, avaliacoes: total, nota_media: avg, criticas: reviews.filter((r) => Number(r.rating) <= 2).length };
      }).filter((u) => u.avaliacoes > 0);
    } catch { unidades = []; }
  }

  const riscos = [];
  if (kpis.percentual_criticas >= 20) riscos.push({ nivel: 'alto', titulo: 'Concentração de avaliações críticas', evidencias: `${kpis.percentual_criticas}% das avaliações são críticas.` });
  if (sent.negativo > sent.positivo) riscos.push({ nivel: 'medio', titulo: 'Sentimento negativo predominante', evidencias: 'O volume de sinais negativos supera o positivo no período.' });
  if (plan === 'rei' && unidades.length) {
    const worst = [...unidades].sort((a, b) => a.nota_media - b.nota_media)[0];
    if (worst) riscos.push({ nivel: 'medio', titulo: `Unidade com menor nota: ${worst.nome}`, evidencias: `Média ${worst.nota_media.toFixed(1)} com ${worst.avaliacoes} avaliações.` });
  }

  const oportunidades = [];
  if (kpis.percentual_positivas >= 80) oportunidades.push({ titulo: 'Fortalecer os pontos positivos', evidencias: `${kpis.percentual_positivas}% das avaliações estão em 4–5 estrelas.` });
  if (temasPositivos.length) oportunidades.push({ titulo: `Escalar o tema positivo “${temasPositivos[0].tema}”`, evidencias: `${temasPositivos[0].volume} ocorrências associadas.` });
  if (plan === 'rei') oportunidades.push({ titulo: 'Conectar sinais de reputação a decisões de gestão', evidencias: 'O plano REI consolida indicadores, riscos, oportunidades e recomendações em visão executiva.' });

  const baseReport: any = {
    schema_version: '2.0',
    tipo: 'relatorio_profissional',
    geracao: { modo: 'deterministico', modelo_ia: null, tokens: 0 },
    empresa: { id: String(empresa.id), nome: String(empresa.nome_empresa || 'Empresa'), slug: empresa.slug || null },
    periodo,
    plano: {
      codigo: plan,
      nome: planLabel(plan),
      beneficios_incluidos: planBenefits(plan),
      proximo_plano: nextPlan(plan),
      comparativo: PLAN_ORDER.map((p) => ({
        codigo: p,
        nome: planLabel(p),
        beneficios: PLAN_BENEFITS[p],
      })),
    },
    resumo_executivo: buildSummary(plan, kpis),
    kpis,
    distribuicao_estrelas: distribuicao,
    sentimento: sent,
    temas: { positivos: temasPositivos, atencao: temasAtencao },
    unidades,
    riscos,
    oportunidades,
    recomendacoes: buildRecommendations(kpis, temasAtencao),
    narrativa: {
      o_que_aconteceu: buildSummary(plan, kpis),
      por_que_importa: kpis.percentual_criticas > 0
        ? `Há ${kpis.criticas} avaliações críticas que podem indicar pontos de atrito na experiência.`
        : 'Os sinais disponíveis não mostram concentração relevante de avaliações críticas.',
      onde_atuar: unidades.length
        ? `Priorizar a leitura comparativa das ${unidades.length} unidades com avaliações no período.`
        : 'Atuar primeiro sobre os temas recorrentes e avaliações críticas do conjunto da empresa.',
      riscos: riscos.map((x: any) => x.titulo),
      oportunidades: oportunidades.map((x: any) => x.titulo),
      o_que_fazer_agora: buildRecommendations(kpis, temasAtencao),
    },
    origem: 'dados_reais_do_painel',
  };

  // A IA interpreta apenas métricas agregadas. O servidor continua sendo a fonte de verdade dos números.
  // Se o provedor falhar, a narrativa determinística existente continua disponível.
  if (planTemIA(plan) && aiConfigured() && avaliacoes > 0) {
    try {
      const ai = await gerarNarrativaRelatorio({
        empresa: baseReport.empresa.nome,
        periodo,
        plano: baseReport.plano.nome,
        kpis,
        sentimento: sent,
        temas: { positivos: temasPositivos, atencao: temasAtencao },
        unidades: unidades.map(({ nome, avaliacoes, nota_media, criticas }: any) => ({ nome, avaliacoes, nota_media, criticas })),
        riscos: riscos.map((x: any) => ({ nivel: x.nivel, titulo: x.titulo, evidencias: x.evidencias })),
        oportunidades: oportunidades.map((x: any) => ({ titulo: x.titulo, evidencias: x.evidencias })),
      }, String(empresa.id), localeRaw || empresa.locale || empresa.idioma || empresa.language || 'pt');
      baseReport.resumo_executivo = ai.narrativa.resumo_executivo;
      baseReport.narrativa = {
        o_que_aconteceu: ai.narrativa.resumo_executivo,
        por_que_importa: ai.narrativa.por_que_importa,
        onde_atuar: ai.narrativa.onde_atuar,
        riscos: ai.narrativa.riscos,
        oportunidades: ai.narrativa.oportunidades,
        o_que_fazer_agora: ai.narrativa.recomendacoes,
      };
      baseReport.recomendacoes = ai.narrativa.recomendacoes;
      baseReport.geracao = { modo: 'ia', modelo_ia: ai.provider, tokens: ai.tokens };
    } catch (error: any) {
      console.warn('[relatorio mensal] IA indisponível; usando fallback determinístico:', error?.message || error);
    }
  }
  baseReport.canais = channelTexts(baseReport);
  return baseReport;
}

export function normalizeDestinatarios(body: any): RelatorioDestino[] {
  const out: RelatorioDestino[] = [];
  const seen = new Set<string>();
  const push = (canal: string, destino: string) => {
    const c = String(canal || '').toLowerCase().trim();
    const d = String(destino || '').trim();
    if (!d) return;
    const canalOk =
      c === 'email' || c === 'whatsapp' || c === 'sms' || c === 'wechat' || c === 'wpp'
        ? c === 'wpp' ? 'whatsapp' : c as ReportChannel
        : null;
    if (!canalOk) return;
    const key = `${canalOk}|${d.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ canal: canalOk, destino: d });
  };
  const list = body?.destinatarios || body?.destinations || [];
  if (Array.isArray(list)) for (const item of list) {
    if (typeof item === 'string') push(item.includes('@') ? 'email' : 'whatsapp', item);
    else if (item && typeof item === 'object') push(item.canal || item.channel || item.tipo, item.destino || item.to || item.value);
  }
  if (body?.email) push('email', String(body.email));
  if (body?.whatsapp) push('whatsapp', String(body.whatsapp));
  if (body?.sms) push('sms', String(body.sms));
  if (body?.wechat) push('wechat', String(body.wechat));
  return out.slice(0, 20);
}
