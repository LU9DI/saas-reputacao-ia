import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRelatorioProfissional } from '../services/relatorioProfissional.js';
import { planLabel } from '../lib/plans.js';

const originalGroq = process.env.GROQ_API_KEY;
const originalGemini = process.env.GEMINI_API_KEY;
const originalGoogle = process.env.GOOGLE_API_KEY;
delete process.env.GROQ_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;
after(() => {
  if (originalGroq === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = originalGroq;
  if (originalGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalGemini;
  if (originalGoogle === undefined) delete process.env.GOOGLE_API_KEY; else process.env.GOOGLE_API_KEY = originalGoogle;
});

function fakeDb(reviews: any[]) {
  return {
    all: async (sql: string) => {
      if (/FROM reviews/i.test(sql)) return reviews;
      if (/FROM unidades/i.test(sql)) return [
        { id: 'u1', nome: 'Centro' },
        { id: 'u2', nome: 'Sul' },
      ];
      return [];
    },
  } as any;
}

const reviews = [
  { id: 'r1', rating: 2, unidade_id: 'u1', createdAt: '2026-09-05T12:00:00.000Z', is_test: 0, ai_tags: '["Atendimento"]', sentiment: 'negativo' },
  { id: 'r2', rating: 5, unidade_id: 'u2', createdAt: '2026-09-08T12:00:00.000Z', is_test: 0, ai_tags: '["Agilidade"]', sentiment: 'positivo' },
  { id: 'r3', rating: 4, unidade_id: 'u1', createdAt: '2026-08-05T12:00:00.000Z', is_test: 0, ai_tags: '["Atendimento"]', sentiment: 'positivo' },
  { id: 'r4', rating: 4, unidade_id: 'u2', createdAt: '2026-08-08T12:00:00.000Z', is_test: 0, ai_tags: '["Agilidade"]', sentiment: 'positivo' },
  { id: 'r5', rating: 0, unidade_id: 'u1', createdAt: '2026-09-12T12:00:00.000Z', is_test: 0, ai_tags: '[]', sentiment: 'neutro' },
];

describe('relatório profissional mensal', () => {
  it('usa a grafia oficial REI e mantém o catálogo de benefícios separado por plano', () => {
    assert.equal(planLabel('rei'), 'REI');
    assert.equal(planLabel('corporativo'), 'Corporativo');
  });

  it('gera KPIs, ranking e prioridades operacionais para Corporativo sem alterar o painel', async () => {
    const report = await buildRelatorioProfissional(fakeDb(reviews), { id: 'company-1', nome_empresa: 'Empresa Teste', plan: 'corporativo' }, '2026-09');
    assert.equal(report.periodo, '2026-09');
    assert.equal(report.kpis.avaliacoes, 2);
    assert.ok(!report.canais.email.text.includes('\\n'), 'plain-text report must not contain literal \\n sequences');
    assert.ok(report.canais.email.text.split('\n').length > 1, 'plain-text report must contain actual line breaks');
    assert.equal(report.ranking_unidades[0].nome, 'Sul');
    assert.ok(report.prioridades_operacionais.some((x: any) => x.unidade === 'Centro'));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /ranking comparativo/i.test(x)));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /dashboard com análises/i.test(x)));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /whatsapp/i.test(x)));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /inteligência artificial/i.test(x)));
    assert.match(report.canais.email.html, /Relatório mensal de reputação/);
    assert.ok(report.canais.email.html.includes('alt="Logotipo Filtra.AI"'));
    assert.ok(report.canais.email.html.includes('aria-hidden="true"') && report.canais.email.html.includes('>FILTRA.AI</div>'));
    assert.ok(report.canais.email.html.includes('@page{size:A4'));
    assert.ok(report.canais.email.html.includes('break-inside:avoid'));
    assert.ok(!report.canais.email.html.includes('page-break-before:always'));
    assert.match(report.canais.email.html, /Prioridades operacionais/);
    assert.match(report.resumo_executivo, /a empresa registrou 2 avaliações/i);
    assert.ok(!report.resumo_executivo.includes('o Corporativo registrou'));
    assert.equal(report.geracao.modo, 'deterministico');
  });

  it('preserva os benefícios herdados do Ultra no resumo comercial do plano', async () => {
    const report = await buildRelatorioProfissional(fakeDb(reviews), { id: 'company-ultra', nome_empresa: 'Ultra Teste', plan: 'ultra' }, '2026-09');
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /dashboard com análises/i.test(x)));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /whatsapp/i.test(x)));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /inteligência artificial/i.test(x)));
  });

  it('mantém o escopo de Pro e não mostra análise avançada reservada aos planos superiores', async () => {
    const report = await buildRelatorioProfissional(fakeDb(reviews), { id: 'company-pro', nome_empresa: 'Pro Teste', plan: 'pro' }, '2026-09');
    assert.equal(report.kpis.avaliacoes, 2);
    assert.ok(!report.canais.email.html.includes('Temas recorrentes'));
    assert.ok(!report.canais.email.html.includes('Riscos a acompanhar'));
    assert.ok(report.canais.email.html.includes('Indicadores do período') || report.canais.email.html.includes('Avaliações'));
  });

  it('gera radar comparativo e escopo executivo REI com evidências do mês anterior', async () => {
    const report = await buildRelatorioProfissional(fakeDb(reviews), { id: 'company-2', nome_empresa: 'Rede Teste', plan: 'rei' }, '2026-09');
    assert.ok(report.radar_estrategico.some((x: any) => /nota média/i.test(x.sinal)));
    assert.ok(Array.isArray(report.oportunidades_crescimento));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /diretoria/i.test(x)));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /dashboard com análises/i.test(x)));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /whatsapp/i.test(x)));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /inteligência artificial/i.test(x)));
    assert.match(report.canais.email.html, /Radar estratégico/);
    assert.match(report.canais.email.html, /Relatório executivo mensal/);
  });

  it('propaga falhas de consulta de unidades nos planos Corporativo e REI', async () => {
    const brokenDb = { all: async (sql: string) => {
      if (/FROM reviews/i.test(sql)) return reviews;
      if (/FROM unidades/i.test(sql)) throw new Error('units table unavailable');
      return [];
    } } as any;
    await assert.rejects(
      () => buildRelatorioProfissional(brokenDb, { id: 'company-units-error', nome_empresa: 'Falha unidades', plan: 'corporativo' }, '2026-09'),
      /Falha ao consultar unidades para o relatório profissional/,
    );
  });

  it('propaga falhas de consulta em vez de mascará-las como um mês sem avaliações', async () => {
    const brokenDb = { all: async (sql: string) => {
      if (/FROM reviews/i.test(sql)) throw new Error('column missing');
      return [];
    } } as any;
    await assert.rejects(
      () => buildRelatorioProfissional(brokenDb, { id: 'company-db-error', nome_empresa: 'Falha DB', plan: 'pro' }, '2026-09'),
      /Falha ao consultar avaliações usando createdAt e created_at/,
    );
  });

  it('explica com clareza quando não há avaliações válidas no período', async () => {
    const report = await buildRelatorioProfissional(fakeDb([]), { id: 'company-empty', nome_empresa: 'Sem Dados', plan: 'pro' }, '2026-09');
    assert.equal(report.kpis.avaliacoes, 0);
    assert.match(report.resumo_executivo, /Não houve avaliações válidas/i);
    assert.ok(report.canais.email.html.includes('—'));
    assert.ok(!report.canais.email.html.includes('0.0/5'));
  });

  it('não atribui benefícios do REI ao Trial', async () => {
    const report = await buildRelatorioProfissional(fakeDb(reviews), { id: 'company-3', nome_empresa: 'Trial Teste', plan: 'trial' }, '2026-09');
    assert.equal(report.plano.codigo, 'trial');
    assert.ok(!report.plano.beneficios_incluidos.some((x: string) => /radar estratégico|diretoria|crescimento identificadas/i.test(x)));
  });
});
