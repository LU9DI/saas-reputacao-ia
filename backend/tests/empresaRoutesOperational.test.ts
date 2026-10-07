import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { oportunidadesEstrategicas, prioridadesOperacionaisPorUnidade } from '../routes/empresaRoutes.js';

describe('prioridadesOperacionaisPorUnidade', () => {
  it('prioriza unidade crítica com tema recorrente', () => {
    const ranking = [{ id: 'u1', nome: 'Centro', feedbacks: 20, nota: 3.1, tendencia_14d: -0.4, status: 'critica' }];
    const insights = [{ id: 'u1', nome: 'Centro', pontos_atencao: [{ tag: 'Atendimento', count: 5 }], pontos_fortes: [] }];
    const [item] = prioridadesOperacionaisPorUnidade(ranking, insights);
    assert.equal(item.prioridade, 'alta');
    assert.equal(item.unidade_id, 'u1');
    assert.match(item.titulo, /Atendimento/);
    assert.equal(item.evidencia.ocorrencias, 5);
  });

  it('gera oportunidade de replicação para unidade forte', () => {
    const ranking = [{ id: 'u2', nome: 'Sul', feedbacks: 30, nota: 4.8, tendencia_14d: 0.2, status: 'excelente' }];
    const insights = [{ id: 'u2', nome: 'Sul', pontos_atencao: [], pontos_fortes: [{ tag: 'Equipe', count: 12 }] }];
    const items = prioridadesOperacionaisPorUnidade(ranking, insights);
    assert.equal(items.length, 1);
    assert.equal(items[0].prioridade, 'oportunidade');
    assert.match(items[0].acao_sugerida, /replicável/);
  });

  it('não cria ação para unidade sem sinal relevante', () => {
    const ranking = [{ id: 'u3', nome: 'Norte', feedbacks: 8, nota: 4.1, tendencia_14d: 0, status: 'boa' }];
    const insights = [{ id: 'u3', nome: 'Norte', pontos_atencao: [], pontos_fortes: [] }];
    assert.deepEqual(prioridadesOperacionaisPorUnidade(ranking, insights), []);
  });
});


describe('oportunidadesEstrategicas', () => {
  it('pontua demanda recorrente e abrangente como oportunidade de alto potencial', () => {
    const reviews = [
      { rating: 4, comment: 'Quero mais opções de produto', ai_tags: ['Produto'], unidade_id: 'u1', createdAt: new Date().toISOString() },
      { rating: 4, comment: 'Gostaria de mais opções', ai_tags: ['Produto'], unidade_id: 'u2', createdAt: new Date().toISOString() },
      { rating: 5, comment: 'Produto excelente', ai_tags: ['Produto'], unidade_id: 'u3', createdAt: new Date().toISOString() },
      { rating: 4, comment: 'Produto bom', ai_tags: ['Produto'], unidade_id: 'u1', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    const ranking = [
      { id: 'u1', nome: 'Centro', feedbacks: 10, nota: 4.4 },
      { id: 'u2', nome: 'Sul', feedbacks: 10, nota: 4.5 },
      { id: 'u3', nome: 'Norte', feedbacks: 10, nota: 4.6 },
    ];
    const [item] = oportunidadesEstrategicas(reviews, ranking);
    assert.equal(item.tipo, 'demanda');
    assert.equal(item.evidencias.unidades_afetadas, 3);
    assert.ok(item.score >= 45);
    assert.equal(item.potencial, 'alto');
    assert.match(item.impacto_negocio, /receita/i);
  });

  it('identifica retenção quando um tema recorrente tem nota baixa', () => {
    const reviews = [
      { rating: 2, comment: 'Problema grave', ai_tags: ['Atendimento'], unidade_id: 'u1', createdAt: new Date().toISOString() },
      { rating: 2, comment: 'Muito ruim', ai_tags: ['Atendimento'], unidade_id: 'u1', createdAt: new Date().toISOString() },
      { rating: 3, comment: 'Precisa melhorar', ai_tags: ['Atendimento'], unidade_id: 'u2', createdAt: new Date().toISOString() },
    ];
    const ranking = [
      { id: 'u1', nome: 'Centro', feedbacks: 10, nota: 3.0 },
      { id: 'u2', nome: 'Sul', feedbacks: 10, nota: 3.2 },
    ];
    const [item] = oportunidadesEstrategicas(reviews, ranking);
    assert.equal(item.tipo, 'retencao');
    assert.equal(item.evidencias.ocorrencias, 3);
    assert.equal(item.evidencias.unidades_afetadas, 2);
  });
});
