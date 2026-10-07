import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prioridadesOperacionaisPorUnidade } from '../routes/empresaRoutes.js';

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
