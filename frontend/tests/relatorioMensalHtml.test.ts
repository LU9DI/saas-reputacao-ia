/**
 * Execução (a partir de frontend/), usando o tsx já instalado no backend:
 *   Windows: ..\backend\node_modules\.bin\tsx.cmd --test tests/relatorioMensalHtml.test.ts
 *   Linux/macOS: ../backend/node_modules/.bin/tsx --test tests/relatorioMensalHtml.test.ts
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRelatorioMensalHtml } from '../src/lib/relatorioMensalHtml';
import { fullReport, proReport } from './fixtures/relatorioMensal';

test('gera o relatório completo com todos os módulos e sem chamadas de rede', () => {
  const html = buildRelatorioMensalHtml(fullReport, { plan: 'rei' });

  assert.match(html, /Relatório Inteligente Mensal/);
  assert.match(html, /Empresa Demonstração Ltda\./);
  assert.match(html, /2026-09/);
  assert.match(html, /Como ler este relatório/);
  assert.match(html, /Conclusão executiva/);
  assert.match(html, /Sentimento e temas/);
  assert.match(html, /Riscos a acompanhar/);
  assert.match(html, /Plano de ação recomendado/);
  assert.match(html, /Desempenho por unidade/);
  assert.match(html, /Prioridades operacionais/);
  assert.match(html, /Radar estratégico/);
  assert.match(html, /Oportunidades de crescimento/);
  assert.match(html, /não consomem tokens/);

  // O documento real é estático e autossuficiente.
  assert.equal(html.includes('<script'), false);
  assert.equal(/https?:\/\//.test(html), false);
  assert.equal(html.includes('fetch('), false);
  assert.equal(html.includes('XMLHttpRequest'), false);
  assert.equal(html.includes('modelo_ia'), false);
  assert.equal(html.includes('ai_usage'), false);
  assert.equal(html.includes('tokens:'), false);
});

test('o relatório do plano Pro não expõe módulos avançados', () => {
  const html = buildRelatorioMensalHtml(proReport, { plan: 'pro' });

  assert.match(html, /Relatório Inteligente Mensal/);
  assert.match(html, /Resumo executivo/);
  assert.doesNotMatch(html, /Sentimento e temas/);
  assert.doesNotMatch(html, /Riscos a acompanhar/);
  assert.doesNotMatch(html, /Desempenho por unidade/);
  assert.doesNotMatch(html, /Radar estratégico/);
  assert.doesNotMatch(html, /Prioridades operacionais/);
  assert.match(html, /data-plan="pro"/);
});

test('escapa conteúdo dinâmico e não injeta scripts', () => {
  const html = buildRelatorioMensalHtml({
    ...fullReport,
    empresa: { id: 'x', nome: '<script>alert(1)</script>' },
    resumo_executivo: '<img src=x onerror="alert(1)">',
  }, { plan: 'rei' });

  assert.equal(html.includes('<script>alert(1)</script>'), false);
  assert.equal(html.includes('<img src=x'), false);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});

test('prioridade ausente usa o fallback explícito, sem inventar classificação', () => {
  const html = buildRelatorioMensalHtml({
    ...fullReport,
    prioridades_operacionais: [{ unidade: 'Centro', evidencia: 'Média 2.0/5.', acao_recomendada: 'Revisar.' }],
  }, { plan: 'corporativo' });

  assert.match(html, /NÃO CLASSIFICADA/);
  assert.doesNotMatch(html, /priority-badge high/);
});

test('prévia demonstrativa inclui seletor de plano, marca d\'água e dados fictícios', () => {
  const html = buildRelatorioMensalHtml(fullReport, { plan: 'rei', demo: true, showPlanSelector: true });

  assert.match(html, /PRÉVIA DEMONSTRATIVA/);
  assert.match(html, /data-plan-btn="pro"/);
  assert.match(html, /fixture de teste/);
  assert.equal(/https?:\/\//.test(html), false);
  assert.equal(html.includes('fetch('), false);
});
