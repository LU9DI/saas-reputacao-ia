import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRelatorioProfissional } from '../services/relatorioProfissional.js';

const originalGroq = process.env.GROQ_API_KEY;
const originalGemini = process.env.GEMINI_API_KEY;
delete process.env.GROQ_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;
after(() => {
  if (originalGroq === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = originalGroq;
  if (originalGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalGemini;
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
];

describe('relatório profissional mensal', () => {
  it('gera KPIs, ranking e prioridades operacionais para Corporativo sem alterar o painel', async () => {
    const report = await buildRelatorioProfissional(fakeDb(reviews), { id: 'company-1', nome_empresa: 'Empresa Teste', plan: 'corporativo' }, '2026-09');
    assert.equal(report.periodo, '2026-09');
    assert.equal(report.kpis.avaliacoes, 2);
    assert.equal(report.ranking_unidades[0].nome, 'Sul');
    assert.ok(report.prioridades_operacionais.some((x: any) => x.unidade === 'Centro'));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /ranking comparativo/i.test(x)));
    assert.match(report.canais.email.html, /Relatório mensal de reputação/);
    assert.match(report.canais.email.html, /Prioridades operacionais/);
    assert.equal(report.geracao.modo, 'deterministico');
  });

  it('gera radar comparativo e escopo executivo REI com evidências do mês anterior', async () => {
    const report = await buildRelatorioProfissional(fakeDb(reviews), { id: 'company-2', nome_empresa: 'Rede Teste', plan: 'rei' }, '2026-09');
    assert.ok(report.radar_estrategico.some((x: any) => /nota média/i.test(x.sinal)));
    assert.ok(Array.isArray(report.oportunidades_crescimento));
    assert.ok(report.plano.beneficios_incluidos.some((x: string) => /diretoria/i.test(x)));
    assert.match(report.canais.email.html, /Radar estratégico/);
    assert.match(report.canais.email.html, /Relatório executivo mensal/);
  });

  it('não atribui benefícios do REI ao Trial', async () => {
    const report = await buildRelatorioProfissional(fakeDb(reviews), { id: 'company-3', nome_empresa: 'Trial Teste', plan: 'trial' }, '2026-09');
    assert.equal(report.plano.codigo, 'trial');
    assert.ok(!report.plano.beneficios_incluidos.some((x: string) => /radar estratégico|diretoria|crescimento identificadas/i.test(x)));
  });
});
