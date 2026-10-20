import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMonthlyReportNotificationPayload, getOrGenerateMonthlyReportSnapshot } from '../routes/monthlyReportJobsRoutes.js';
import { adaptRelatorioProfissionalAoPlano } from '../services/relatorioProfissional.js';

type Row = any;

/** Banco falso com a única tabela usada pelo cache: relatorio_envios_mensais. */
function fakeMonthlyDb(initial?: Row[]) {
  const rows = new Map<string, Row>();
  for (const row of initial || []) rows.set(`${row.empresa_id}|${row.periodo}`, { ...row });
  const db = {
    async get(sql: string, params: any[]) {
      if (/FROM relatorio_envios_mensais/.test(sql)) {
        const [empresaId, periodo] = params;
        return rows.get(`${empresaId}|${periodo}`);
      }
      throw new Error('SQL inesperado (get): ' + sql);
    },
    async run(sql: string, params: any[]) {
      if (/INSERT INTO relatorio_envios_mensais/.test(sql)) {
        const [id, empresaId, periodo, createdAt, updatedAt] = params;
        const key = `${empresaId}|${periodo}`;
        if (rows.has(key)) return { changes: 0 };
        rows.set(key, {
          id,
          empresa_id: empresaId,
          periodo,
          status: 'processing',
          destinatarios_json: '[]',
          created_at: createdAt,
          updated_at: updatedAt,
          report_json: null,
          erro: null,
          tentativas: 1,
        });
        return { changes: 1 };
      }
      if (/SET report_json = \?, status = 'generated'/.test(sql)) {
        const [reportJson, updatedAt, empresaId, periodo] = params;
        const row = rows.get(`${empresaId}|${periodo}`);
        if (row && row.status === 'processing') {
          row.report_json = reportJson;
          row.status = 'generated';
          row.updated_at = updatedAt;
          return { changes: 1 };
        }
        return { changes: 0 };
      }
      if (/SET report_json = \?, updated_at = \?, erro = NULL/.test(sql) && /status = 'accepted' AND report_json IS NULL AND updated_at = \?/.test(sql)) {
        const [reportJson, updatedAt, empresaId, periodo, expectedUpdatedAt] = params;
        const row = rows.get(`${empresaId}|${periodo}`);
        if (row && row.status === 'accepted' && !row.report_json && row.updated_at === expectedUpdatedAt) {
          row.report_json = reportJson;
          row.updated_at = updatedAt;
          row.erro = null;
          return { changes: 1 };
        }
        return { changes: 0 };
      }
      if (/SET erro = \?, updated_at = \?/.test(sql) && /status = 'accepted' AND report_json IS NULL AND updated_at = \?/.test(sql)) {
        const [erro, updatedAt, empresaId, periodo, expectedUpdatedAt] = params;
        const row = rows.get(`${empresaId}|${periodo}`);
        if (row && row.status === 'accepted' && !row.report_json && row.updated_at === expectedUpdatedAt) {
          row.erro = erro;
          row.updated_at = updatedAt;
          return { changes: 1 };
        }
        return { changes: 0 };
      }
      if (/SET updated_at = \?/.test(sql) && /status = 'accepted' AND report_json IS NULL AND updated_at = \?/.test(sql)) {
        const [updatedAt, empresaId, periodo, expectedUpdatedAt] = params;
        const row = rows.get(`${empresaId}|${periodo}`);
        if (row && row.status === 'accepted' && !row.report_json && row.updated_at === expectedUpdatedAt) {
          row.updated_at = updatedAt;
          return { changes: 1 };
        }
        return { changes: 0 };
      }
      if (/SET status = 'processing'/.test(sql)) {
        const [updatedAt, empresaId, periodo, expectedStatus, expectedUpdatedAt] = params;
        const row = rows.get(`${empresaId}|${periodo}`);
        if (row && row.status === expectedStatus && row.updated_at === expectedUpdatedAt) {
          row.status = 'processing';
          row.updated_at = updatedAt;
          row.tentativas += 1;
          return { changes: 1 };
        }
        return { changes: 0 };
      }
      if (/SET status = 'failed'/.test(sql)) {
        const [updatedAt, erro, empresaId, periodo] = params;
        const row = rows.get(`${empresaId}|${periodo}`);
        if (row && row.status === 'processing') {
          row.status = 'failed';
          row.erro = erro;
          row.updated_at = updatedAt;
          return { changes: 1 };
        }
        return { changes: 0 };
      }
      throw new Error('SQL inesperado (run): ' + sql);
    },
    rows,
  };
  return db as any;
}

const empresa = { id: 'e1', nome_empresa: 'Empresa Cache', plan: 'pro', slug: 'cache' };
const periodo = '2026-09';

function fakeReport(state: string) {
  return { empresa: { id: 'e1', nome: 'Empresa Cache' }, periodo, kpis: { avaliacoes: 3 }, origem: state };
}

function seedRow(overrides?: Partial<Row>): Row {
  return {
    id: 'row-1',
    empresa_id: 'e1',
    periodo,
    status: 'generated',
    destinatarios_json: '[]',
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
    report_json: null,
    erro: null,
    tentativas: 1,
    ...overrides,
  };
}

describe('cache do relatório mensal sob demanda', () => {
  it('devolve o snapshot salvo sem nova geração (reaberturas e downloads ilimitados)', async () => {
    const cachedReport = { ...fakeReport('cached'), sentimento: { negativo: 99 }, temas: { atencao: [{ tema: 'premium' }] } };
    const db = fakeMonthlyDb([seedRow({ report_json: JSON.stringify(cachedReport) })]);
    let buildCalls = 0;
    const result = await getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, {
      build: async () => { buildCalls += 1; return fakeReport('novo'); },
    });
    assert.equal(result.state, 'cached');
    assert.equal(result.report.origem, 'cached');
    assert.equal(result.report.plano.codigo, 'pro');
    assert.equal(Object.hasOwn(result.report, 'sentimento'), false);
    assert.equal(Object.hasOwn(result.report, 'temas'), false);
    // A resposta respeita o plano, mas o snapshot integral continua persistido para upgrades.
    const persisted = JSON.parse(db.rows.get(`e1|${periodo}`).report_json);
    assert.equal(persisted.sentimento.negativo, 99);
    assert.equal(persisted.temas.atencao[0].tema, 'premium');
    assert.equal(String(result.report.canais.email.html).includes('snapshot antigo'), false);
    assert.equal(buildCalls, 0, 'build não deve ser chamado quando existe snapshot salvo');
  });

  it('gera uma única vez e persiste para as próximas leituras', async () => {
    const db = fakeMonthlyDb();
    let buildCalls = 0;
    const build = async () => { buildCalls += 1; return fakeReport('novo'); };
    const first = await getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, { build });
    assert.equal(first.state, 'generated');
    assert.equal(first.report.plano.codigo, 'pro');
    assert.equal(Object.hasOwn(first.report, 'sentimento'), false);
    assert.equal(buildCalls, 1);
    const second = await getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, { build });
    assert.equal(second.state, 'cached');
    assert.equal(buildCalls, 1, 'segunda leitura deve usar o cache');
    const row = db.rows.get(`e1|${periodo}`);
    assert.equal(row.status, 'generated');
    assert.equal(JSON.parse(row.report_json).origem, 'novo');
  });

  it('não duplica custo quando outra geração do mesmo ciclo está em andamento', async () => {
    const db = fakeMonthlyDb([
      seedRow({ status: 'processing', updated_at: new Date().toISOString() }),
    ]);
    let buildCalls = 0;
    const result = await getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, {
      build: async () => { buildCalls += 1; return fakeReport('novo'); },
    });
    assert.equal(result.state, 'generating');
    assert.equal(buildCalls, 0);
  });

  it('retoma um ciclo falho anterior sem esperar o próximo mês', async () => {
    const db = fakeMonthlyDb([seedRow({ status: 'failed', erro: 'timeout', updated_at: '2026-10-01T00:00:00.000Z' })]);
    let buildCalls = 0;
    const result = await getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, {
      build: async () => { buildCalls += 1; return fakeReport('retomado'); },
    });
    assert.equal(result.state, 'generated');
    assert.equal(buildCalls, 1);
    const row = db.rows.get(`e1|${periodo}`);
    assert.equal(row.status, 'generated');
    assert.equal(row.tentativas, 2);
    assert.equal(JSON.parse(row.report_json).origem, 'retomado');
  });

  it('marca o ciclo como falho quando a geração lança erro', async () => {
    const db = fakeMonthlyDb();
    await assert.rejects(
      () => getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, {
        build: async () => { throw new Error('provedor indisponível'); },
      }),
      /provedor indisponível/,
    );
    const row = db.rows.get(`e1|${periodo}`);
    assert.equal(row.status, 'failed');
    assert.match(String(row.erro), /provedor indisponível/);
  });

  it('completa snapshot ausente em entrega já aceita sem reenviar o relatório', async () => {
    const db = fakeMonthlyDb([seedRow({ status: 'accepted', report_json: null, updated_at: '2020-01-01T00:00:00.000Z' })]);
    const result = await getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, {
      build: async () => fakeReport('recuperado'),
    });
    assert.equal(result.state, 'generated');
    assert.equal(result.report.plano.codigo, 'pro');
    const row = db.rows.get(`e1|${periodo}`);
    assert.equal(row.status, 'accepted', 'status de entrega deve ser preservado');
    assert.equal(JSON.parse(row.report_json).origem, 'recuperado');
  });

  it('duas leituras simultâneas do mesmo ciclo geram uma única vez', async () => {
    const db = fakeMonthlyDb();
    let buildCalls = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const build = async () => { buildCalls += 1; await gate; return fakeReport('concorrente'); };

    const first = getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, { build });
    const second = getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, { build });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(buildCalls, 1, 'somente um concorrente deve iniciar a geração');
    release();

    const [a, b] = await Promise.all([first, second]);
    assert.equal(a.state, 'generated');
    assert.equal(b.state, 'generating');
    assert.equal(buildCalls, 1, 'o perdedor não pode chamar a IA novamente');
    assert.equal(JSON.parse(db.rows.get(`e1|${periodo}`).report_json).origem, 'concorrente');
  });

  it('duas leituras simultâneas de entrega aceita sem snapshot geram uma única vez', async () => {
    const db = fakeMonthlyDb([seedRow({ status: 'accepted', report_json: null, updated_at: '2020-01-01T00:00:00.000Z' })]);
    let buildCalls = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const build = async () => { buildCalls += 1; await gate; return fakeReport('aceito-concorrente'); };

    const first = getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, { build });
    const second = getOrGenerateMonthlyReportSnapshot(db, empresa, periodo, { build });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(buildCalls, 1, 'somente um concorrente deve recuperar o snapshot aceito');
    release();

    const [a, b] = await Promise.all([first, second]);
    assert.equal(a.state, 'generated');
    assert.equal(b.state, 'generating');
    assert.equal(buildCalls, 1);
    const row = db.rows.get(`e1|${periodo}`);
    assert.equal(row.status, 'accepted', 'o status de entrega continua aceito');
    assert.equal(JSON.parse(row.report_json).origem, 'aceito-concorrente');
  });
});


describe('benefícios progressivos do relatório mensal', () => {
  const fullReport = () => ({
    empresa: { id: 'e1', nome: 'Empresa Cache' },
    periodo,
    kpis: { avaliacoes: 12, nota_media: 4.2 },
    resumo_executivo: 'Resumo comum',
    distribuicao_estrelas: { cinco: 6 },
    sentimento: { positivo: 8, neutro: 2, negativo: 2 },
    temas: { positivos: [{ tema: 'qualidade', volume: 5 }], atencao: [{ tema: 'prazo', volume: 3 }] },
    riscos: [{ titulo: 'Atraso', evidencias: '3 avaliações' }],
    oportunidades: [{ titulo: 'Melhoria', evidencias: '4 avaliações' }],
    recomendacoes: ['Investigar atrasos'],
    narrativa: { o_que_aconteceu: 'Resumo', por_que_importa: 'Impacto', onde_atuar: 'Comparar unidades', riscos: ['Atraso'], oportunidades: ['Melhoria'], o_que_fazer_agora: ['Investigar'] },
    unidades: [{ id: 'u1', nome: 'Unidade 1' }],
    ranking_unidades: [{ id: 'u1', nome: 'Unidade 1', posicao: 1 }],
    prioridades_operacionais: [{ unidade: 'Unidade 1', evidencia: 'Média 3,0/5 em 4 avaliações.', acao_recomendada: 'Revisar o atendimento.' }],
    radar_estrategico: [{ eixo: 'crescimento', valor: 3 }],
    oportunidades_crescimento: [{ titulo: 'Expansão' }],
    canais: { email: { html: '<html>snapshot antigo</html>' } },
  });

  it('Pro retorna apenas resumo e indicadores essenciais, sem módulos premium no JSON ou HTML', () => {
    const adapted = adaptRelatorioProfissionalAoPlano(fullReport(), 'pro');
    assert.equal(adapted.resumo_executivo, 'Resumo comum');
    assert.equal(adapted.kpis.avaliacoes, 12);
    for (const key of ['sentimento', 'temas', 'riscos', 'oportunidades', 'recomendacoes', 'narrativa', 'unidades', 'ranking_unidades', 'prioridades_operacionais', 'radar_estrategico', 'oportunidades_crescimento']) {
      assert.equal(Object.hasOwn(adapted, key), false, 'campo premium removido: ' + key);
    }
    assert.equal(String(adapted.canais.email.html).includes('snapshot antigo'), false);
  });

  it('Ultra recebe análise avançada, mas não comparativo de unidades nem radar REI', () => {
    const adapted = adaptRelatorioProfissionalAoPlano(fullReport(), 'ultra');
    assert.ok(adapted.sentimento);
    assert.ok(adapted.temas);
    assert.ok(adapted.riscos);
    assert.ok(adapted.oportunidades);
    assert.equal(Object.hasOwn(adapted, 'ranking_unidades'), false);
    assert.equal(Object.hasOwn(adapted, 'prioridades_operacionais'), false);
    assert.equal(Object.hasOwn(adapted, 'radar_estrategico'), false);
    assert.equal(Object.hasOwn(adapted, 'oportunidades_crescimento'), false);
    assert.equal(adapted.narrativa.onde_atuar, undefined);
    assert.equal(String(adapted.canais.email.text).includes('ONDE ATUAR'), false);
    assert.equal(String(adapted.canais.email.html).includes('Onde atuar'), false);
  });

  it('Corporativo recebe comparativo e prioridades, mas não módulos estratégicos REI', () => {
    const adapted = adaptRelatorioProfissionalAoPlano(fullReport(), 'corporativo');
    assert.ok(adapted.ranking_unidades);
    assert.ok(adapted.prioridades_operacionais);
    assert.match(String(adapted.canais.email.text), /NÃO CLASSIFICADA/);
    assert.match(String(adapted.canais.email.html), /NÃO CLASSIFICADA/);
    assert.equal(Object.hasOwn(adapted, 'radar_estrategico'), false);
    assert.equal(Object.hasOwn(adapted, 'oportunidades_crescimento'), false);
  });

  it('REI mantém todos os módulos contratados', () => {
    const adapted = adaptRelatorioProfissionalAoPlano(fullReport(), 'rei');
    assert.ok(adapted.sentimento);
    assert.ok(adapted.ranking_unidades);
    assert.ok(adapted.prioridades_operacionais);
    assert.ok(adapted.radar_estrategico);
    assert.ok(adapted.oportunidades_crescimento);
  });

  it('payload de entrega ao webhook remove módulos premium do plano Pro', () => {
    const payload = buildMonthlyReportNotificationPayload({
      report: fullReport(),
      plan: 'pro',
      empresa: { id: 'e1', nome_empresa: 'Empresa Cache', slug: 'cache' },
      periodo,
      destinatarios: [{ canal: 'email', destino: 'financeiro@example.com' }],
    });
    assert.equal(Object.hasOwn(payload.report, 'sentimento'), false);
    assert.equal(Object.hasOwn(payload.relatorio, 'ranking_unidades'), false);
    assert.equal(Object.hasOwn(payload.report, 'radar_estrategico'), false);
    assert.equal(payload.report.plano.codigo, 'pro');
    assert.equal(String(payload.report.canais.email.html).includes('snapshot antigo'), false);
    assert.equal(payload.idempotency_key, 'monthly-professional-report:e1:' + periodo);
    assert.equal(payload.email, 'financeiro@example.com');
    assert.deepEqual(payload.channels, ['email']);
  });

  it('payload de entrega Corporativo mantém ranking e não envia radar REI', () => {
    const payload = buildMonthlyReportNotificationPayload({
      report: fullReport(),
      plan: 'corporativo',
      empresa: { id: 'e1', nome_empresa: 'Empresa Cache', slug: 'cache' },
      periodo,
      destinatarios: [],
    });
    assert.ok(payload.report.ranking_unidades);
    assert.ok(payload.report.prioridades_operacionais);
    assert.equal(Object.hasOwn(payload.report, 'radar_estrategico'), false);
    assert.equal(Object.hasOwn(payload.report, 'oportunidades_crescimento'), false);
    assert.deepEqual(payload.channels, []);
  });
});
