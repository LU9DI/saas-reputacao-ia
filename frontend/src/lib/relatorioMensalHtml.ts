/**
 * Gera o documento HTML autônomo do Relatório Inteligente Mensal no navegador.
 *
 * Regras importantes:
 * - Recebe apenas o snapshot já carregado no painel (nada de fetch/backend).
 * - Não inclui tokens, modelo de IA, credenciais ou chamadas de rede.
 * - Escapa todo conteúdo dinâmico antes de interpolar no HTML.
 * - Renderiza somente os módulos presentes no snapshot; o backend já os
 *   adapta ao plano da empresa antes de enviar o payload do painel.
 */

export type RelatorioMensalSnapshot = {
  empresa?: { id?: string; nome?: string | null } | null;
  periodo?: string | null;
  kpis?: {
    avaliacoes?: number | string | null;
    nota_media?: number | string | null;
    positivas?: number | string | null;
    criticas?: number | string | null;
    tratadas?: number | string | null;
    percentual_positivas?: number | string | null;
    percentual_criticas?: number | string | null;
  } | null;
  resumo_executivo?: string | null;
  sentimento?: { positivo?: number | string | null; neutro?: number | string | null; negativo?: number | string | null } | null;
  temas?: {
    atencao?: Array<{ tema?: string | null; volume?: number | string | null }> | null;
    positivos?: Array<{ tema?: string | null; volume?: number | string | null }> | null;
  } | null;
  riscos?: Array<{ nivel?: string | null; titulo?: string | null; evidencias?: string | null }> | null;
  oportunidades?: Array<{ titulo?: string | null; evidencias?: string | null; acao_recomendada?: string | null }> | null;
  recomendacoes?: string[] | null;
  narrativa?: {
    o_que_aconteceu?: string | null;
    por_que_importa?: string | null;
    onde_atuar?: string | null;
    riscos?: string[] | null;
    oportunidades?: string[] | null;
    o_que_fazer_agora?: string[] | null;
  } | null;
  unidades?: Array<{ id?: string; nome?: string | null; avaliacoes?: number | string | null; nota_media?: number | string | null; criticas?: number | string | null }> | null;
  ranking_unidades?: Array<{ id?: string; nome?: string | null; posicao?: number | string | null; avaliacoes?: number | string | null; nota_media?: number | string | null; criticas?: number | string | null }> | null;
  prioridades_operacionais?: Array<{ prioridade?: string | null; unidade?: string | null; evidencia?: string | null; acao_recomendada?: string | null }> | null;
  radar_estrategico?: Array<{ nivel?: string | null; sinal?: string | null; evidencia?: string | null; acao?: string | null }> | null;
  oportunidades_crescimento?: Array<{ titulo?: string | null; evidencias?: string | null; acao_recomendada?: string | null }> | null;
  geracao?: { modo?: string | null } | null;
};

export type RelatorioMensalHtmlOptions = {
  plan?: string | null;
  demo?: boolean;
  showPlanSelector?: boolean;
};

type ThemeItem = NonNullable<NonNullable<RelatorioMensalSnapshot['temas']>['atencao']>[number];
type RankingItem = NonNullable<RelatorioMensalSnapshot['ranking_unidades']>[number];
type RiskItem = NonNullable<RelatorioMensalSnapshot['riscos']>[number];
type OpportunityItem = NonNullable<RelatorioMensalSnapshot['oportunidades']>[number];
type PriorityItem = NonNullable<RelatorioMensalSnapshot['prioridades_operacionais']>[number];
type RadarItem = NonNullable<RelatorioMensalSnapshot['radar_estrategico']>[number];

const PLAN_LABELS: Record<string, string> = {
  pro: 'Pro',
  ultra: 'Ultra',
  corporativo: 'Corporativo',
  rei: 'REI',
};

const PLAN_BENEFITS: Record<string, string[]> = {
  pro: ['Resumo executivo', 'Indicadores do período', 'Conclusão executiva'],
  ultra: ['Análise de sentimento', 'Temas recorrentes', 'Pontos fortes', 'Riscos e oportunidades', 'Plano de ação'],
  corporativo: ['Ranking de unidades', 'Prioridades operacionais'],
  rei: ['Radar estratégico', 'Oportunidades de crescimento'],
};

function normalizePlan(plan: unknown): string {
  const raw = String(plan || '').trim().toLowerCase();
  if (raw === 'corporate' || raw === 'corp') return 'corporativo';
  return raw;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function count(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function oneDecimal(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(1) : '—';
}

function percentOf(part: unknown, total: unknown): number {
  const t = count(total);
  return t > 0 ? Math.round((count(part) / t) * 100) : 0;
}

function priorityLabel(value: unknown): string {
  const label = String(value ?? '').trim();
  return label ? label.toUpperCase() : 'NÃO CLASSIFICADA';
}

function priorityClass(value: unknown): string {
  const label = String(value ?? '').trim().toLowerCase();
  if (label === 'alta' || label === 'high') return 'high';
  if (label === 'media' || label === 'média' || label === 'medium') return 'medium';
  return 'neutral';
}

function buildThemeList(themes: Array<ThemeItem & { kind?: string }>): string {
  if (!themes.length) {
    return '<p class="section-sub" style="margin-top:14px">Sem temas identificados nos dados deste período.</p>';
  }
  return `<ul class="theme-list">${themes.map((theme) => `
      <li class="theme-item">
        <span class="theme-dot ${theme.kind === 'positive' ? 'positive' : 'attention'}"></span>
        <span class="theme-name">${escapeHtml(theme.tema || 'Tema')}</span>
        <span class="theme-volume">${count(theme.volume)}</span>
      </li>`).join('')}</ul>`;
}

export function buildRelatorioMensalHtml(
  report: RelatorioMensalSnapshot,
  options: RelatorioMensalHtmlOptions = {},
): string {
  const kpis = report.kpis || {};
  const reviews = count(kpis.avaliacoes);
  const average = reviews > 0 ? `${oneDecimal(kpis.nota_media)}/5` : '—';
  const positivePct = kpis.percentual_positivas !== undefined && kpis.percentual_positivas !== null
    ? count(kpis.percentual_positivas)
    : percentOf(kpis.positivas, reviews);
  const criticals = count(kpis.criticas);
  const company = String(report.empresa?.nome || 'Empresa');
  const period = String(report.periodo || '—');
  const demo = Boolean(options.demo);
  const showPlanSelector = Boolean(options.showPlanSelector) && demo;
  const planKey = normalizePlan(options.plan);
  const knownPlan = Boolean(PLAN_LABELS[planKey]);
  const planLabel = knownPlan ? PLAN_LABELS[planKey] : (planKey ? planKey.toUpperCase() : 'Plano contratado');
  const dataPlan = knownPlan ? planKey : 'full';
  // Em produção o documento renderiza somente os módulos do plano. A prévia demo
  // mantém todos os blocos no HTML para o seletor de plano ocultar por CSS.
  const planAllowsUltra = demo || ['ultra', 'corporativo', 'rei'].includes(planKey);
  const planAllowsCorporate = demo || ['corporativo', 'rei'].includes(planKey);
  const planAllowsRei = demo || planKey === 'rei';

  const summary = String(
    report.resumo_executivo
    || report.narrativa?.o_que_aconteceu
    || (reviews > 0
      ? `No período, a empresa registrou ${reviews} avaliações válidas, com nota média de ${oneDecimal(kpis.nota_media)}/5.`
      : 'Não houve avaliações válidas no período. O relatório está pronto para receber dados assim que novas avaliações forem registradas.'),
  ).trim();

  const sentiment = report.sentimento || {};
  const positiveCount = count(sentiment.positivo);
  const neutralCount = count(sentiment.neutro);
  const negativeCount = count(sentiment.negativo);
  const sentimentTotal = positiveCount + neutralCount + negativeCount;
  const sentimentRows = [
    ['Positivas', positiveCount, 'var(--green)'],
    ['Neutras', neutralCount, 'var(--slate)'],
    ['Negativas', negativeCount, 'var(--rose)'],
  ].map(([label, value, color]) => {
    const numeric = Number(value);
    const width = sentimentTotal > 0 ? Math.round((numeric / sentimentTotal) * 100) : 0;
    return `<div class="sent-row">
        <span class="sent-label">${escapeHtml(label)}</span>
        <div class="sent-bar"><span style="width:${width}%;background:${color}"></span></div>
        <strong>${numeric}</strong>
      </div>`;
  }).join('');

  const themeItems = [
    ...list<ThemeItem>(report.temas?.atencao).map((theme) => ({ ...theme, kind: 'attention' })),
    ...list<ThemeItem>(report.temas?.positivos).map((theme) => ({ ...theme, kind: 'positive' })),
  ].slice(0, 8);

  const strengths: string[] = [];
  for (const theme of list<ThemeItem>(report.temas?.positivos).slice(0, 4)) {
    if (theme?.tema) strengths.push(`${theme.tema}: ${count(theme.volume)} ocorrência(s) em avaliações de 4–5★.`);
  }
  const bestUnit = planAllowsCorporate
    ? list<RankingItem>(report.ranking_unidades)
      .slice()
      .sort((a, b) => count(b.nota_media) - count(a.nota_media))[0]
    : undefined;
  if (bestUnit?.nome && count(bestUnit.nota_media) > 0) {
    strengths.push(`${bestUnit.nome}: melhor média do período (${oneDecimal(bestUnit.nota_media)}/5).`);
  }

  const risks = list<RiskItem>(report.riscos);
  const opportunities = list<OpportunityItem>(report.oportunidades);
  const recommendations = list<string>(report.recomendacoes).filter((item) => typeof item === 'string' && item.trim());
  const ranking = list<RankingItem>(report.ranking_unidades);
  const priorities = list<PriorityItem>(report.prioridades_operacionais);
  const radar = list<RadarItem>(report.radar_estrategico);
  const growth = list<OpportunityItem>(report.oportunidades_crescimento);

  const reasoning = String(report.narrativa?.por_que_importa || '').trim();
  const whereToAct = String(report.narrativa?.onde_atuar || '').trim();

  const kpiCards = [
    [String(reviews), 'Avaliações'],
    [average, 'Nota média'],
    [`${positivePct}%`, 'Positivas'],
    [String(criticals), 'Críticas (1–3★)'],
  ].map(([value, label]) => `
    <div class="kpi">
      <div class="kpi-value">${escapeHtml(value)}</div>
      <div class="kpi-label">${escapeHtml(label)}</div>
    </div>`).join('');

  const readItems = [
    ['Avaliações', 'Total de avaliações válidas do mês (notas de 1 a 5; registros de teste ficam fora).'],
    ['Nota média', 'Média simples das notas do período, de 1 a 5.'],
    ['Positivas', 'Avaliações de 4 e 5 estrelas.'],
    ['Críticas (1–3★)', 'Avaliações de 1 a 3 estrelas; são o primeiro lugar para investigar causas.'],
    ...(planAllowsUltra && (report.sentimento || themeItems.length)
      ? [
          ['Sentimento', 'Leitura agregada de cada avaliação: positivo, neutro ou negativo.'],
          ['Temas', 'Assuntos mais citados; ajudam a localizar o que puxa a nota para cima ou para baixo.'],
        ]
      : []),
    ...(planAllowsUltra && risks.length
      ? [['Riscos', 'Sinais que merecem acompanhamento. Apontam o que investigar, não provam causa isoladamente.']]
      : []),
    ...(planAllowsUltra && recommendations.length
      ? [['Recomendações', 'Próximos passos sugeridos a partir das evidências do período.']]
      : []),
    ...(planAllowsRei && (radar.length || growth.length)
      ? [['Radar estratégico', 'Comparação com o mês anterior e diferenças entre unidades, quando há dados suficientes.']]
      : []),
    ['Relatório salvo', 'Abrir, baixar ou reabrir não gera nova análise de IA nem consome tokens.'],
  ].map(([title, text]) => `
    <li class="read-item">
      <strong>${escapeHtml(title)}</strong>
      <span class="muted">${escapeHtml(text)}</span>
    </li>`).join('');

  const sentimentCard = `
    <section class="card block" aria-labelledby="sentiment-title">
      <h2 class="section-title" id="sentiment-title">Sentimento e temas</h2>
      <p class="section-sub">Leitura agregada das avaliações válidas do período.</p>
      <div class="sent-list">${sentimentRows}</div>
      <h3 class="subhead">Temas recorrentes</h3>
      ${buildThemeList(themeItems)}
    </section>`;

  const strengthsCard = `
    <section class="card block" aria-labelledby="strengths-title">
      <h2 class="section-title" id="strengths-title">Pontos fortes</h2>
      <p class="section-sub">Sinais positivos sustentados pelos dados do período.</p>
      ${strengths.length
        ? `<ul class="bullet-list">${strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '<p class="section-sub" style="margin-top:14px">Não há pontos fortes específicos registrados neste ciclo.</p>'}
      ${reasoning ? `<h3 class="subhead">Por que isso importa</h3><p class="summary-text" style="font-size:13.5px">${escapeHtml(reasoning)}</p>` : ''}
    </section>`;

  const risksCard = `
    <section class="card block" aria-labelledby="risks-title">
      <h2 class="section-title" id="risks-title">Riscos a acompanhar</h2>
      <p class="section-sub">Pontos de atenção que podem afetar a experiência e a reputação.</p>
      ${risks.length
        ? `<ul class="risk-list">${risks.map((risk) => `
          <li class="risk-item">
            <span class="risk-title">${escapeHtml(risk.titulo || 'Ponto de atenção')}</span>
            <span class="risk-evidence">${escapeHtml(risk.evidencias || '')}</span>
          </li>`).join('')}</ul>`
        : '<p class="section-sub" style="margin-top:14px">Nenhum risco específico registrado para este período.</p>'}
    </section>`;

  const recommendationsCard = `
    <section class="card block" aria-labelledby="recommendations-title">
      <h2 class="section-title" id="recommendations-title">Plano de ação recomendado</h2>
      <p class="section-sub">Recomendações priorizadas a partir das evidências disponíveis.</p>
      ${recommendations.length
        ? `<ol class="rec-list" style="list-style:none">${recommendations.map((item, index) => `
          <li class="rec-item">
            <span class="rec-index">${index + 1}</span>
            <span>${escapeHtml(item)}</span>
          </li>`).join('')}</ol>`
        : '<p class="section-sub" style="margin-top:14px">Sem recomendações registradas.</p>'}
    </section>`;

  const opportunitiesSection = opportunities.length
    ? `<section class="card block" aria-labelledby="opportunities-title" style="margin-top:14px">
        <h2 class="section-title" id="opportunities-title">Oportunidades</h2>
        <p class="section-sub">Caminhos de melhoria e de replicação do que já funciona.</p>
        <ul class="opportunity-list">${opportunities.map((item) => `
          <li class="opportunity-item">
            <span class="opportunity-title">${escapeHtml(item.titulo || 'Oportunidade')}</span>
            <span class="muted">${escapeHtml(item.evidencias || '')}</span>
            ${item.acao_recomendada ? `<span class="action-line">${escapeHtml(item.acao_recomendada)}</span>` : ''}
          </li>`).join('')}</ul>
      </section>`
    : '';

  const unitsSection = ranking.length
    ? `<section class="card block" aria-labelledby="units-title" style="margin-top:14px">
        <h2 class="section-title" id="units-title">Desempenho por unidade</h2>
        <p class="section-sub">${escapeHtml(whereToAct || 'Comparativo das unidades com avaliações no período.')}</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Posição</th><th>Unidade</th><th>Avaliações</th><th>Nota média</th><th>Críticas</th></tr></thead>
            <tbody>${ranking.map((unit, index) => `
              <tr>
                <td class="pos">${escapeHtml(unit.posicao ?? index + 1)}º</td>
                <td>${escapeHtml(unit.nome || 'Unidade')}</td>
                <td>${count(unit.avaliacoes)}</td>
                <td>${oneDecimal(unit.nota_media)}/5</td>
                <td>${count(unit.criticas)}</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>
        ${priorities.length ? `<h3 class="subhead">Prioridades operacionais</h3>
        <div class="priority-list">${priorities.map((item) => `
          <article class="priority-item">
            <div class="priority-head">
              <span class="priority-badge ${priorityClass(item.prioridade)}">${escapeHtml(priorityLabel(item.prioridade))}</span>
              <strong>${escapeHtml(item.unidade || 'Unidade')}</strong>
            </div>
            <p class="muted">${escapeHtml(item.evidencia || '')}</p>
            ${item.acao_recomendada ? `<p class="action-line">${escapeHtml(item.acao_recomendada)}</p>` : ''}
          </article>`).join('')}</div>` : ''}
      </section>`
    : (priorities.length
      ? `<section class="card block" aria-labelledby="priorities-title" style="margin-top:14px">
          <h2 class="section-title" id="priorities-title">Prioridades operacionais</h2>
          <p class="section-sub">Ações priorizadas a partir das evidências do período.</p>
          <div class="priority-list">${priorities.map((item) => `
            <article class="priority-item">
              <div class="priority-head">
                <span class="priority-badge ${priorityClass(item.prioridade)}">${escapeHtml(priorityLabel(item.prioridade))}</span>
                <strong>${escapeHtml(item.unidade || 'Unidade')}</strong>
              </div>
              <p class="muted">${escapeHtml(item.evidencia || '')}</p>
              ${item.acao_recomendada ? `<p class="action-line">${escapeHtml(item.acao_recomendada)}</p>` : ''}
            </article>`).join('')}</div>
        </section>`
      : '');

  const radarSection = (radar.length || growth.length)
    ? `<section class="card block" aria-labelledby="radar-title" style="margin-top:14px">
        <h2 class="section-title" id="radar-title">Radar estratégico</h2>
        <p class="section-sub">Sinais comparativos e tendências para a liderança.</p>
        ${radar.length
          ? `<div class="radar-list">${radar.map((item) => `
            <article class="radar-item">
              <span class="radar-signal">${escapeHtml(item.sinal || 'Sinal estratégico')}</span>
              <p class="muted">${escapeHtml(item.evidencia || '')}</p>
              ${item.acao ? `<p class="action-line">${escapeHtml(item.acao)}</p>` : ''}
            </article>`).join('')}</div>`
          : '<p class="section-sub" style="margin-top:14px">Sem sinais estratégicos adicionais neste ciclo.</p>'}
        ${growth.length ? `<h3 class="subhead">Oportunidades de crescimento</h3>
        <div class="growth-list">${growth.map((item) => `
          <article class="growth-item">
            <span class="growth-title">${escapeHtml(item.titulo || 'Oportunidade de crescimento')}</span>
            <p class="muted">${escapeHtml(item.evidencias || '')}</p>
            ${item.acao_recomendada ? `<p class="action-line">${escapeHtml(item.acao_recomendada)}</p>` : ''}
          </article>`).join('')}</div>` : ''}
      </section>`
    : '';

  const conclusionTail = criticals > 0
    ? `O próximo ciclo deve priorizar o tratamento ${criticals === 1 ? 'da avaliação crítica registrada' : `das ${criticals} avaliações críticas`} e o acompanhamento dos temas associados.`
    : 'O próximo ciclo deve manter o acompanhamento dos indicadores e consolidar o que já funciona.';

  // Módulos fora do plano não são serializados no HTML; o CSS de [data-plan]
  // permanece apenas como salvaguarda da prévia demonstrativa.
  const hasSentimentCard = planAllowsUltra && (Boolean(report.sentimento) || themeItems.length > 0);
  const hasStrengthsCard = planAllowsUltra && (strengths.length > 0 || Boolean(reasoning));
  const hasRisksCard = planAllowsUltra && risks.length > 0;
  const hasRecommendationsCard = planAllowsUltra && recommendations.length > 0;
  const firstUltraRow = [hasSentimentCard ? sentimentCard : '', hasStrengthsCard ? strengthsCard : ''].join('');
  const secondUltraRow = [hasRisksCard ? risksCard : '', hasRecommendationsCard ? recommendationsCard : ''].join('');
  const ultraBlock = planAllowsUltra && (firstUltraRow || secondUltraRow || opportunitiesSection)
    ? `<div class="module-ultra">${firstUltraRow ? `<div class="two-col" style="margin-top:14px">${firstUltraRow}</div>` : ''}${secondUltraRow ? `<div class="two-col" style="margin-top:14px">${secondUltraRow}</div>` : ''}${opportunitiesSection}</div>`
    : '';
  const corporateBlock = planAllowsCorporate && unitsSection ? `<div class="module-corporate">${unitsSection}</div>` : '';
  const reiBlock = planAllowsRei && radarSection ? `<div class="module-rei">${radarSection}</div>` : '';

  const planButtons = ['pro', 'ultra', 'corporativo', 'rei']
    .map((plan) => `<button type="button" data-plan-btn="${plan}" aria-pressed="${plan === (knownPlan ? planKey : 'rei') ? 'true' : 'false'}">${PLAN_LABELS[plan]}</button>`)
    .join('');

  const planArea = showPlanSelector
    ? `<div class="plan-area">
        <div class="plan-head">
          <span class="plan-title">Módulos incluídos conforme o plano</span>
          <div class="plan-switch" role="group" aria-label="Selecionar plano para visualizar a progressão">
            ${planButtons}
          </div>
        </div>
        <div class="plan-benefits" id="plan-benefits" aria-live="polite"></div>
        <div class="notice">
          Esta prévia usa dados fictícios de uma fixture de teste. A empresa, os números e os textos não representam resultados reais do Filtra.AI nem de clientes. No painel, o botão abre o relatório do plano contratado em uma nova aba, a partir do snapshot já salvo, sem chamada ao backend. O seletor acima é apenas demonstrativo.
        </div>
        <div class="saved-note">
          <span>Relatório salvo · abrir, baixar e reabrir são ilimitados e não consomem tokens.</span>
          <span>Análise baseada nos dados do período</span>
        </div>
      </div>`
    : `<div class="plan-area">
        <div class="saved-note">
          <span>Relatório salvo · abrir, baixar e reabrir são ilimitados e não consomem tokens.</span>
          <span>Análise baseada nos dados do período</span>
        </div>
      </div>`;

  const selectorScript = showPlanSelector
    ? `<script>
  (function () {
    var benefits = ${JSON.stringify(PLAN_BENEFITS)};
    var labels = ${JSON.stringify(PLAN_LABELS)};
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-plan-btn]'));
    function applyPlan(plan) {
      if (!labels[plan]) plan = 'rei';
      document.documentElement.setAttribute('data-plan', plan);
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-plan-btn') === plan));
      });
      var visible = document.getElementById('plan-visible');
      if (visible) visible.textContent = labels[plan];
      var list = document.getElementById('plan-benefits');
      if (list) {
        list.innerHTML = benefits[plan].map(function (item) {
          return '<span class="pill">✓ ' + item + '</span>';
        }).join('');
      }
    }
    buttons.forEach(function (button) {
      button.addEventListener('click', function () { applyPlan(button.getAttribute('data-plan-btn')); });
    });
    var initial = document.documentElement.getAttribute('data-plan');
    applyPlan(labels[initial] ? initial : 'rei');
  })();
</script>`
    : '';

  return `<!doctype html>
<html lang="pt-BR" data-plan="${escapeHtml(dataPlan)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>FILTRA.AI · Relatório Inteligente Mensal · ${escapeHtml(company)} · ${escapeHtml(period)}</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #050507;
    --panel: #0b0b0f;
    --panel-2: #111118;
    --line: rgba(255,255,255,.09);
    --line-strong: rgba(129,140,248,.28);
    --text: #f4f4f5;
    --muted: #a1a1aa;
    --indigo: #818cf8;
    --indigo-soft: rgba(99,102,241,.13);
    --green: #34d399;
    --green-soft: rgba(52,211,153,.08);
    --amber: #fbbf24;
    --amber-soft: rgba(251,191,36,.08);
    --rose: #fb7185;
    --rose-soft: rgba(251,113,133,.08);
    --violet: #c4b5fd;
    --violet-soft: rgba(139,92,246,.1);
    --slate: #94a3b8;
    --radius: 18px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); }
  body {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .page { width: min(1120px, 100%); margin: 0 auto; padding: 28px 18px 48px; position: relative; }
  .watermark {
    position: fixed; inset: 0; display: grid; place-items: center; pointer-events: none; z-index: 0;
    font-size: clamp(34px, 7vw, 74px); font-weight: 800; letter-spacing: .14em; color: #fff; opacity: .028;
    transform: rotate(-24deg); white-space: nowrap; user-select: none;
  }
  .page > * { position: relative; z-index: 1; }
  .card {
    background: linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,0)) , var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--radius);
  }
  .hero {
    padding: 26px;
    background:
      radial-gradient(900px 340px at 12% -20%, rgba(99,102,241,.23), transparent 62%),
      radial-gradient(700px 300px at 95% 0%, rgba(16,185,129,.09), transparent 60%),
      var(--panel);
    border-color: var(--line-strong);
  }
  .topline { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  .brand { font-size: 12px; font-weight: 800; letter-spacing: .24em; color: var(--indigo); }
  .brand span { color: var(--text); }
  .demo-badge {
    display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: 999px;
    border: 1px solid rgba(251,191,36,.35); background: rgba(251,191,36,.09); color: #fde68a;
    font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  }
  .demo-badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--amber); }
  h1 { margin: 18px 0 8px; font-size: clamp(24px, 4vw, 36px); line-height: 1.16; letter-spacing: -.02em; }
  .subtitle { margin: 0; color: var(--muted); font-size: 15px; max-width: 720px; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
  .pill {
    display: inline-flex; align-items: center; gap: 6px; padding: 7px 11px; border-radius: 999px;
    border: 1px solid var(--line); background: rgba(0,0,0,.22); color: var(--muted); font-size: 12px;
  }
  .pill strong { color: var(--text); font-weight: 600; }
  .plan-area { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--line); display: grid; gap: 12px; }
  .plan-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; justify-content: space-between; }
  .plan-title { font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .plan-switch { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; background: rgba(0,0,0,.3); border: 1px solid var(--line); border-radius: 12px; }
  .plan-switch button {
    appearance: none; border: 0; cursor: pointer; padding: 8px 13px; border-radius: 9px;
    background: transparent; color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: .02em;
    transition: background .16s ease, color .16s ease;
  }
  .plan-switch button:hover { color: var(--text); background: rgba(255,255,255,.04); }
  .plan-switch button[aria-pressed="true"] { background: var(--indigo-soft); color: #e0e7ff; box-shadow: inset 0 0 0 1px rgba(129,140,248,.28); }
  .plan-benefits { display: flex; flex-wrap: wrap; gap: 6px; }
  .plan-benefits .pill { border-color: rgba(52,211,153,.18); background: var(--green-soft); color: #a7f3d0; }
  .notice {
    margin-top: 14px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(251,191,36,.22);
    background: rgba(251,191,36,.055); color: #fde68a; font-size: 12.5px;
  }
  .saved-note {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;
    padding: 11px 14px; border-radius: 12px; border: 1px solid rgba(52,211,153,.18); background: var(--green-soft);
    color: #a7f3d0; font-size: 12.5px;
  }
  .saved-note span:last-child { color: #d1fae5; opacity: .8; }
  .section-title { margin: 0 0 4px; font-size: 16px; letter-spacing: -.01em; }
  .section-sub { margin: 0; color: var(--muted); font-size: 12.5px; }
  .kpis { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; margin-top: 14px; }
  .read-grid { display: grid; gap: 8px; margin-top: 14px; }
  .read-item { padding: 10px 12px; border-radius: 11px; border: 1px solid var(--line); background: rgba(0,0,0,.16); font-size: 12.5px; }
  .read-item strong { display: block; color: #e4e4e7; font-size: 12.5px; }
  .read-item .muted { display: block; margin-top: 3px; }
  .kpi { padding: 16px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255,255,255,.018); }
  .kpi-value { font-size: clamp(24px, 3vw, 32px); font-weight: 700; letter-spacing: -.03em; }
  .kpi-label { margin-top: 4px; color: var(--muted); font-size: 11.5px; }
  .block { padding: 22px; }
  .stack { display: grid; gap: 14px; }
  .two-col { display: grid; grid-template-columns: 1fr; gap: 14px; }
  .muted { color: var(--muted); }
  p { margin: 0; }
  ul { margin: 0; padding: 0; list-style: none; }
  .summary-text { margin-top: 12px; color: #d4d4d8; font-size: 14.5px; line-height: 1.7; }
  .sent-list { display: grid; gap: 10px; margin-top: 14px; }
  .sent-row { display: grid; grid-template-columns: 74px 1fr 28px; align-items: center; gap: 8px; font-size: 12.5px; }
  .sent-label { color: var(--muted); }
  .sent-bar { height: 8px; border-radius: 999px; background: rgba(255,255,255,.06); overflow: hidden; }
  .sent-bar span { display: block; height: 100%; border-radius: inherit; }
  .theme-list { display: grid; gap: 6px; margin-top: 14px; }
  .theme-item { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--line); font-size: 12.5px; }
  .theme-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
  .theme-dot.attention { background: var(--amber); }
  .theme-dot.positive { background: var(--green); }
  .theme-name { flex: 1; color: #e4e4e7; }
  .theme-volume { color: var(--muted); font-variant-numeric: tabular-nums; }
  .bullet-list { display: grid; gap: 8px; margin-top: 14px; }
  .bullet-list li { position: relative; padding-left: 16px; color: #d4d4d8; font-size: 13px; line-height: 1.55; }
  .bullet-list li::before { content: ""; position: absolute; left: 0; top: .62em; width: 5px; height: 5px; border-radius: 50%; background: var(--green); }
  .risk-list, .opportunity-list, .rec-list { display: grid; gap: 10px; margin-top: 14px; }
  .risk-item, .opportunity-item, .rec-item { padding: 11px 12px; border-radius: 11px; border: 1px solid var(--line); background: rgba(0,0,0,.16); }
  .risk-item { border-color: rgba(251,113,133,.16); background: var(--rose-soft); }
  .risk-item .risk-title, .opportunity-item .opportunity-title { display: block; font-size: 13px; font-weight: 600; color: #f4f4f5; }
  .risk-item .risk-evidence { display: block; margin-top: 4px; font-size: 12.5px; color: #fecdd3; }
  .opportunity-item .muted, .radar-item .muted, .growth-item .muted { display: block; margin-top: 4px; font-size: 12.5px; }
  .action-line { display: block; margin-top: 6px; font-size: 12.5px; color: #c7d2fe; }
  .rec-item { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: #e4e4e7; }
  .rec-index { display: grid; place-items: center; flex: none; width: 22px; height: 22px; border-radius: 7px; background: var(--indigo-soft); color: #c7d2fe; font-size: 11px; font-weight: 800; }
  .subhead { margin: 18px 0 0; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .table-wrap { margin-top: 14px; overflow-x: auto; border: 1px solid var(--line); border-radius: 12px; }
  table { width: 100%; border-collapse: collapse; min-width: 520px; }
  th, td { padding: 11px 12px; text-align: left; font-size: 12.5px; border-bottom: 1px solid var(--line); }
  th { color: var(--muted); font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; background: rgba(255,255,255,.02); }
  tbody tr:last-child td { border-bottom: 0; }
  td.pos { color: var(--indigo); font-weight: 700; }
  .priority-list, .radar-list, .growth-list { display: grid; gap: 10px; margin-top: 14px; }
  .priority-item, .radar-item, .growth-item { padding: 13px; border-radius: 12px; border: 1px solid var(--line); background: rgba(0,0,0,.16); }
  .priority-item { border-color: rgba(251,191,36,.15); background: var(--amber-soft); }
  .priority-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .priority-badge { display: inline-flex; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: .06em; }
  .priority-badge.high { background: rgba(251,113,133,.14); color: #fecdd3; border: 1px solid rgba(251,113,133,.3); }
  .priority-badge.medium { background: rgba(251,191,36,.12); color: #fde68a; border: 1px solid rgba(251,191,36,.3); }
  .priority-badge.neutral { background: rgba(148,163,184,.12); color: #e2e8f0; border: 1px solid rgba(148,163,184,.3); }
  .radar-item { border-color: rgba(196,181,253,.16); background: var(--violet-soft); }
  .radar-signal, .growth-title { display: block; font-size: 13px; font-weight: 600; color: #f4f4f5; }
  .conclusion { border-color: rgba(129,140,248,.22); background: linear-gradient(135deg, rgba(99,102,241,.09), rgba(16,185,129,.03), var(--panel)); }
  .conclusion p { margin-top: 10px; color: #d4d4d8; font-size: 14px; line-height: 1.7; }
  .footer { margin-top: 18px; padding: 18px 4px 0; color: #71717a; font-size: 11.5px; line-height: 1.65; }
  .footer strong { color: #a1a1aa; }
  [data-plan="pro"] .module-ultra,
  [data-plan="pro"] .module-corporate,
  [data-plan="pro"] .module-rei,
  [data-plan="ultra"] .module-corporate,
  [data-plan="ultra"] .module-rei,
  [data-plan="corporativo"] .module-rei { display: none !important; }
  @media (min-width: 760px) {
    .page { padding: 40px 28px 64px; }
    .hero { padding: 34px; }
    .block { padding: 26px; }
    .kpis { grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
    .read-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .two-col { grid-template-columns: repeat(2, minmax(0,1fr)); }
  }
  @media (max-width: 520px) {
    .hero { padding: 20px; }
    .block { padding: 18px; }
    .plan-switch { width: 100%; }
    .plan-switch button { flex: 1; }
    .sent-row { grid-template-columns: 64px 1fr 22px; }
  }
  @media print {
    .watermark { position: fixed; }
    .plan-area, .plan-switch { display: none !important; }
  }
</style>
</head>
<body>
<div class="watermark" aria-hidden="true">${demo ? 'PRÉVIA DEMONSTRATIVA' : 'FILTRA.AI'}</div>
<main class="page">
  <section class="card hero" aria-labelledby="report-title">
    <div class="topline">
      <div class="brand">FILTRA<span>.AI</span></div>
      ${demo ? '<div class="demo-badge">Prévia demonstrativa</div>' : '<div class="pill">Relatório do período</div>'}
    </div>
    <h1 id="report-title">Relatório Inteligente Mensal</h1>
    <p class="subtitle">Relatório profissional consolidado do mês de referência, com indicadores, análise e plano de ação.</p>
    <div class="meta">
      <span class="pill"><strong>${escapeHtml(company)}</strong></span>
      <span class="pill">Período: <strong>${escapeHtml(period)}</strong></span>
      <span class="pill">Plano: <strong id="plan-visible">${escapeHtml(planLabel)}</strong></span>
    </div>
    ${planArea}
  </section>

  <section class="card block" aria-labelledby="howto-title" style="margin-top:14px">
    <h2 class="section-title" id="howto-title">Como ler este relatório</h2>
    <p class="section-sub">Definições rápidas para interpretar os indicadores e os módulos sem ambiguidade.</p>
    <ul class="read-grid" style="list-style:none">${readItems}</ul>
  </section>

  <section class="card block" aria-labelledby="indicators-title" style="margin-top:14px">
    <h2 class="section-title" id="indicators-title">Indicadores do período</h2>
    <p class="section-sub">Volume, nota média e proporção de avaliações positivas e críticas no mês.</p>
    <div class="kpis">${kpiCards}</div>
  </section>

  <section class="card block" aria-labelledby="summary-title" style="margin-top:14px">
    <h2 class="section-title" id="summary-title">Resumo executivo</h2>
    <p class="summary-text">${escapeHtml(summary)}</p>
  </section>

  ${ultraBlock}

  ${corporateBlock}

  ${reiBlock}
  <section class="card block conclusion" aria-labelledby="conclusion-title" style="margin-top:14px">
    <h2 class="section-title" id="conclusion-title">Conclusão executiva</h2>
    <p>${escapeHtml(`${summary} ${conclusionTail}`.trim())}</p>
  </section>

  <footer class="footer">
    <p><strong>Metodologia:</strong> análise baseada nas avaliações válidas registradas no período. Os sinais apontam temas a investigar e não comprovam, isoladamente, relações de causa e efeito.</p>
    <p style="margin-top:8px"><strong>Relatório salvo:</strong> abrir, baixar ou reabrir este documento não gera nova análise de IA nem consome tokens. O conteúdo é montado no navegador a partir do snapshot já carregado no painel.</p>
    ${demo
      ? '<p style="margin-top:8px"><strong>Prévia demonstrativa:</strong> dados fictícios de fixture de teste, sem informações pessoais, credenciais ou resultados reais de clientes. Este arquivo é HTML; não é um PDF e não substitui o relatório real do painel.</p>'
      : '<p style="margin-top:8px"><strong>Documento HTML:</strong> para guardar uma cópia, use o botão de download no painel. O download pode ser repetido quantas vezes forem necessárias.</p>'}
  </footer>
</main>
${selectorScript}
</body>
</html>`;
}
