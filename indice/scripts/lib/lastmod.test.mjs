import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { anosPublicados, calcularRanking, podePublicar } from './rankings.mjs';
import { calcularLastmod, dataDeEntrada } from './lastmod.mjs';

const base = () => ({ SP: { campinas: { restaurantes: { a: 10, ab: 2, ano: { 2024: 1, 2025: 2 } }, hoteis: { a: 4 } }, santos: { hoteis: { a: 3 } } } });

test('primeira execução: todas as páginas recebem a data de hoje', () => {
  const m = calcularLastmod(base(), {}, '2026-10-01');
  assert.equal(dataDeEntrada(m['/sp']), '2026-10-01');
  assert.equal(dataDeEntrada(m['/sp/campinas/restaurantes']), '2026-10-01');
  assert.equal(Object.keys(m).length, 6);
});

test('conteúdo igual mantém a data anterior, mesmo com chaves em outra ordem', () => {
  const ant = calcularLastmod(base(), {}, '2026-10-01');
  const outra = base();
  outra.SP.campinas.restaurantes = { ano: { 2025: 2, 2024: 1 }, ab: 2, a: 10 };
  const m = calcularLastmod(outra, ant, '2026-11-01');
  for (const k of Object.keys(ant)) assert.equal(dataDeEntrada(m[k]), '2026-10-01', k);
});

test('só a página alterada e seus ancestrais mudam de data', () => {
  const ant = calcularLastmod(base(), {}, '2026-10-01');
  const novo = base();
  novo.SP.santos.hoteis.a = 5;
  const m = calcularLastmod(novo, ant, '2026-11-01');
  assert.equal(dataDeEntrada(m['/sp/santos/hoteis']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/sp/santos']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/sp']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/sp/campinas']), '2026-10-01');
  assert.equal(dataDeEntrada(m['/sp/campinas/hoteis']), '2026-10-01');
});

// --- Rankings no lastmod -----------------------------------------------------

const metaRankings = {
  competencia: '2026-10',
  geradoEm: '2026-10-26T07:34:27.901Z',
  minimoParaIndexar: 10,
  segmentos: [{ slug: 'restaurantes', nome: 'Restaurantes', curto: 'restaurantes', classes: ['5611-2/01'] }],
};

function statsComRanking(n = 12, extras = {}) {
  const stats = { SP: {} };
  for (let i = 1; i <= n; i += 1) stats.SP[`mun${i}`] = { restaurantes: { a: 10, ano: { 2024: 10 } } };
  for (const [mun, reg] of Object.entries(extras)) {
    stats.SP[mun] = { ...(stats.SP[mun] || {}), restaurantes: reg };
  }
  return stats;
}

test('rankings publicáveis ganham entrada no lastmod; hub sempre entra', () => {
  const m = calcularLastmod(statsComRanking(), {}, '2026-10-01', metaRankings);
  assert.equal(dataDeEntrada(m['/rankings/aberturas']), '2026-10-01');
  assert.equal(dataDeEntrada(m['/rankings/aberturas/restaurantes/2024']), '2026-10-01');
});

test('ranking sem mínimo de publicação não gera entrada, mas o hub continua', () => {
  const m = calcularLastmod(statsComRanking(5), {}, '2026-10-01', metaRankings);
  assert.equal(m['/rankings/aberturas/restaurantes/2024'], undefined);
  assert.ok(m['/rankings/aberturas']);
});

test('ranking inalterado herda a data; mudança só no ano parcial atualiza a página, não o hub', () => {
  const ant = calcularLastmod(statsComRanking(), {}, '2026-10-01', metaRankings);
  const novo = statsComRanking(12, { mun1: { a: 10, ano: { 2024: 10, 2026: 3 } } });
  const m = calcularLastmod(novo, ant, '2026-11-01', metaRankings);
  assert.equal(dataDeEntrada(m['/rankings/aberturas/restaurantes/2024']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/rankings/aberturas']), '2026-10-01');
});

test('mudança no ano fechado atualiza a página e o hub', () => {
  const ant = calcularLastmod(statsComRanking(), {}, '2026-10-01', metaRankings);
  const novo = statsComRanking(12, { mun1: { a: 10, ano: { 2024: 20 } } });
  const m = calcularLastmod(novo, ant, '2026-11-01', metaRankings);
  assert.equal(dataDeEntrada(m['/rankings/aberturas/restaurantes/2024']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/rankings/aberturas']), '2026-11-01');
});

test('mesmas estatísticas e mesmos metadados preservam todas as datas', () => {
  const ant = calcularLastmod(statsComRanking(), {}, '2026-10-01', metaRankings);
  const m = calcularLastmod(statsComRanking(), ant, '2026-11-01', metaRankings);
  for (const k of Object.keys(ant)) {
    assert.equal(dataDeEntrada(m[k]), '2026-10-01', k);
  }
});

test('mudança em competencia ou geradoEm atualiza páginas de ranking e o hub, sem tocar UF/município/célula', () => {
  const ant = calcularLastmod(statsComRanking(), {}, '2026-10-01', metaRankings);

  const novaCompetencia = calcularLastmod(
    statsComRanking(),
    ant,
    '2026-11-01',
    { ...metaRankings, competencia: '2026-11' },
  );
  assert.equal(dataDeEntrada(novaCompetencia['/rankings/aberturas/restaurantes/2024']), '2026-11-01');
  assert.equal(dataDeEntrada(novaCompetencia['/rankings/aberturas']), '2026-11-01');

  const novoGeradoEm = calcularLastmod(
    statsComRanking(),
    ant,
    '2026-11-01',
    { ...metaRankings, geradoEm: '2026-11-01T09:00:00.000Z' },
  );
  assert.equal(dataDeEntrada(novoGeradoEm['/rankings/aberturas/restaurantes/2024']), '2026-11-01');
  assert.equal(dataDeEntrada(novoGeradoEm['/rankings/aberturas']), '2026-11-01');

  for (const caminho of ['/sp', '/sp/mun1', '/sp/mun1/restaurantes']) {
    assert.equal(dataDeEntrada(novaCompetencia[caminho]), '2026-10-01', `${caminho} com competencia`);
    assert.equal(dataDeEntrada(novoGeradoEm[caminho]), '2026-10-01', `${caminho} com geradoEm`);
  }
});

test('hub só atualiza quando o próprio conteúdo muda', () => {
  const ant = calcularLastmod(statsComRanking(), {}, '2026-10-01', metaRankings);

  // Mudança em dado que o hub não exibe (estoque ativo): hub e ranking preservam a data.
  const estoque = statsComRanking(12, { mun1: { a: 999, ano: { 2024: 10 } } });
  const mEstoque = calcularLastmod(estoque, ant, '2026-11-01', metaRankings);
  assert.equal(dataDeEntrada(mEstoque['/rankings/aberturas']), '2026-10-01');
  assert.equal(dataDeEntrada(mEstoque['/rankings/aberturas/restaurantes/2024']), '2026-10-01');
  assert.equal(dataDeEntrada(mEstoque['/sp/mun1/restaurantes']), '2026-11-01');

  // Mudança no total do último ano publicado: hub atualiza.
  const total = statsComRanking(12, { mun1: { a: 10, ano: { 2024: 25 } } });
  const mTotal = calcularLastmod(total, ant, '2026-11-01', metaRankings);
  assert.equal(dataDeEntrada(mTotal['/rankings/aberturas']), '2026-11-01');
});

// --- Rankings de ativos no lastmod --------------------------------------------

function statsDeAtivos() {
  const stats = { SP: {}, MG: {} };
  for (let i = 1; i <= 12; i += 1) {
    stats.SP[`mun${i}`] = { restaurantes: { a: 10 + i, m: 5, ab: 1, ba: 0, ano: {}, sub: {} } };
  }
  stats.SP.pequeno = { restaurantes: { a: 5, m: 2, ab: 0, ba: 0, ano: {}, sub: {} } };
  stats.MG.media = { restaurantes: { a: 7, m: 3, ab: 0, ba: 0, ano: {}, sub: {} } };
  return stats;
}

const nomesAtivos = Object.fromEntries(
  [...Array(12)].map((_, i) => [`SP/mun${i + 1}`, `Município ${i + 1}`]).concat([
    ['SP/pequeno', 'Pequeno'],
    ['MG/media', 'Média'],
  ]),
);

test('ativos: m/ab/ba não mudam a data da página; mudança em a muda (e a célula vê m/ab/ba)', () => {
  const ant = calcularLastmod(statsDeAtivos(), {}, '2026-10-01', metaRankings, nomesAtivos);

  const oculto = statsDeAtivos();
  oculto.SP.mun1.restaurantes = { ...oculto.SP.mun1.restaurantes, m: 99, ab: 50, ba: 40 };
  const mOculto = calcularLastmod(oculto, ant, '2026-11-01', metaRankings, nomesAtivos);
  assert.equal(dataDeEntrada(mOculto['/rankings/ativos/restaurantes']), '2026-10-01');
  assert.equal(dataDeEntrada(mOculto['/rankings/ativos/restaurantes/sp']), '2026-10-01');
  assert.equal(dataDeEntrada(mOculto['/rankings/ativos']), '2026-10-01');
  assert.equal(dataDeEntrada(mOculto['/sp/mun1/restaurantes']), '2026-11-01'); // a célula exibe m/ab/ba

  const visivel = statsDeAtivos();
  visivel.SP.mun1.restaurantes = { ...visivel.SP.mun1.restaurantes, a: 30 };
  const mVisivel = calcularLastmod(visivel, ant, '2026-11-01', metaRankings, nomesAtivos);
  assert.equal(dataDeEntrada(mVisivel['/rankings/ativos/restaurantes']), '2026-11-01');
  assert.equal(dataDeEntrada(mVisivel['/rankings/ativos/restaurantes/sp']), '2026-11-01');
  assert.equal(dataDeEntrada(mVisivel['/rankings/ativos']), '2026-11-01');
});

test('ativos: abaixo do mínimo soma no total exibido, mas não entra na tabela', () => {
  const ant = calcularLastmod(statsDeAtivos(), {}, '2026-10-01', metaRankings, nomesAtivos);

  const novo = statsDeAtivos();
  novo.SP.pequeno.restaurantes = { ...novo.SP.pequeno.restaurantes, a: 6 };
  const m = calcularLastmod(novo, ant, '2026-11-01', metaRankings, nomesAtivos);
  assert.equal(dataDeEntrada(m['/rankings/ativos/restaurantes']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/rankings/ativos/restaurantes/sp']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/rankings/ativos']), '2026-11-01');

  // Em outra UF: muda a página nacional e o hub, não o recorte de SP.
  const outra = statsDeAtivos();
  outra.MG.media.restaurantes = { ...outra.MG.media.restaurantes, a: 8 };
  const mUF = calcularLastmod(outra, ant, '2026-11-01', metaRankings, nomesAtivos);
  assert.equal(dataDeEntrada(mUF['/rankings/ativos/restaurantes']), '2026-11-01');
  assert.equal(dataDeEntrada(mUF['/rankings/ativos']), '2026-11-01');
  assert.equal(dataDeEntrada(mUF['/rankings/ativos/restaurantes/sp']), '2026-10-01');
});

test('ativos: nome desempata a ordem e entra no hash; fora da tabela não muda', () => {
  const stats = { SP: {} };
  for (let i = 1; i <= 51; i += 1) {
    stats.SP[`mun${i}`] = { restaurantes: { a: 1000 - i, m: 5, ab: 0, ba: 0, ano: {}, sub: {} } };
  }
  stats.SP.mun1.restaurantes.a = 998; // empata com mun2: o nome decide a ordem
  stats.SP.mun2.restaurantes.a = 998;
  const nomes = Object.fromEntries([...Array(51)].map((_, i) => [`SP/mun${i + 1}`, `Município ${String(i + 1).padStart(2, '0')}`]));
  const ant = calcularLastmod(stats, {}, '2026-10-01', metaRankings, nomes);

  // Renomear o 51º (fora do top 50) não altera nenhuma página de ranking.
  const mFora = calcularLastmod(stats, ant, '2026-11-01', metaRankings, { ...nomes, 'SP/mun51': 'Renomeado' });
  assert.equal(dataDeEntrada(mFora['/rankings/ativos/restaurantes']), '2026-10-01');
  assert.equal(dataDeEntrada(mFora['/rankings/ativos/restaurantes/sp']), '2026-10-01');

  // Trocar os nomes dos empatados inverte as duas primeiras linhas.
  const troca = { ...nomes, 'SP/mun1': nomes['SP/mun2'], 'SP/mun2': nomes['SP/mun1'] };
  const mTroca = calcularLastmod(stats, ant, '2026-11-01', metaRankings, troca);
  assert.equal(dataDeEntrada(mTroca['/rankings/ativos/restaurantes']), '2026-11-01');
  assert.equal(dataDeEntrada(mTroca['/rankings/ativos/restaurantes/sp']), '2026-11-01');
  assert.equal(dataDeEntrada(mTroca['/rankings/ativos']), '2026-10-01');
});

test('ativos: recorte de UF exige 10 publicáveis; abaixo do mínimo não conta', () => {
  const stats = { MG: {} };
  for (let i = 1; i <= 9; i += 1) {
    stats.MG[`mun${i}`] = { restaurantes: { a: 20, m: 5, ab: 0, ba: 0, ano: {}, sub: {} } };
  }
  stats.MG.abaixo = { restaurantes: { a: 5, m: 2, ab: 0, ba: 0, ano: {}, sub: {} } };
  const nomes = Object.fromEntries(
    [...Array(9)].map((_, i) => [`MG/mun${i + 1}`, `Município ${i + 1}`]).concat([['MG/abaixo', 'Abaixo']]),
  );
  const m = calcularLastmod(stats, {}, '2026-10-01', metaRankings, nomes);
  assert.equal(m['/rankings/ativos/restaurantes/mg'], undefined);
  assert.ok(m['/rankings/ativos/restaurantes']);

  const comDez = { ...stats, MG: { ...stats.MG, mun10: { restaurantes: { a: 20, m: 5, ab: 0, ba: 0, ano: {}, sub: {} } } } };
  const mDez = calcularLastmod(comDez, m, '2026-11-01', metaRankings, { ...nomes, 'MG/mun10': 'Município 10' });
  assert.equal(dataDeEntrada(mDez['/rankings/ativos/restaurantes/mg']), '2026-11-01');
});

const metaDoisSegmentos = {
  ...metaRankings,
  segmentos: [
    { slug: 'restaurantes', nome: 'Restaurantes', curto: 'restaurantes', classes: ['5611-2/01'] },
    { slug: 'hoteis', nome: 'Hotéis', curto: 'hotéis', classes: ['5510-8/01'] },
  ],
};

test('ativos: hub reflete nome e ordem dos segmentos; UF reflete só a existência do link', () => {
  const ant = calcularLastmod(statsDeAtivos(), {}, '2026-10-01', metaDoisSegmentos, nomesAtivos);

  // O hub lista os segmentos na ordem de meta.segmentos; a página nacional não muda.
  const invertida = { ...metaDoisSegmentos, segmentos: [...metaDoisSegmentos.segmentos].reverse() };
  const mInv = calcularLastmod(statsDeAtivos(), ant, '2026-11-01', invertida, nomesAtivos);
  assert.equal(dataDeEntrada(mInv['/rankings/ativos']), '2026-11-01');
  assert.equal(dataDeEntrada(mInv['/rankings/ativos/restaurantes']), '2026-10-01');

  // O nome do outro segmento aparece no hub e em "Outros rankings" da página nacional.
  const renomeada = {
    ...metaDoisSegmentos,
    segmentos: [metaDoisSegmentos.segmentos[0], { ...metaDoisSegmentos.segmentos[1], nome: 'Hotéis e pousadas' }],
  };
  const mNome = calcularLastmod(statsDeAtivos(), ant, '2026-11-01', renomeada, nomesAtivos);
  assert.equal(dataDeEntrada(mNome['/rankings/ativos']), '2026-11-01');
  assert.equal(dataDeEntrada(mNome['/rankings/ativos/restaurantes']), '2026-11-01');

  // O nome do próprio segmento não aparece na página dele.
  const renomeiaProprio = {
    ...metaDoisSegmentos,
    segmentos: [{ ...metaDoisSegmentos.segmentos[0], nome: 'Restaurantes e bares' }, metaDoisSegmentos.segmentos[1]],
  };
  const mProprio = calcularLastmod(statsDeAtivos(), ant, '2026-11-01', renomeiaProprio, nomesAtivos);
  assert.equal(dataDeEntrada(mProprio['/rankings/ativos']), '2026-11-01');
  assert.equal(dataDeEntrada(mProprio['/rankings/ativos/restaurantes']), '2026-10-01');
  assert.equal(dataDeEntrada(mProprio['/rankings/ativos/restaurantes/sp']), '2026-10-01');

  // A página de UF só muda quando o outro segmento cruza 10 publicáveis na UF.
  const umHotel = statsDeAtivos();
  umHotel.SP.hotel1 = { hoteis: { a: 12, m: 5, ab: 0, ba: 0, ano: {}, sub: {} } };
  const mUm = calcularLastmod(umHotel, ant, '2026-11-01', metaDoisSegmentos, { ...nomesAtivos, 'SP/hotel1': 'Hotel Um' });
  assert.equal(dataDeEntrada(mUm['/rankings/ativos/restaurantes/sp']), '2026-10-01');

  const dezHoteis = statsDeAtivos();
  for (let i = 1; i <= 10; i += 1) {
    dezHoteis.SP[`hotel${i}`] = { hoteis: { a: 12, m: 5, ab: 0, ba: 0, ano: {}, sub: {} } };
  }
  const nomesHoteis = {
    ...nomesAtivos,
    ...Object.fromEntries([...Array(10)].map((_, i) => [`SP/hotel${i + 1}`, `Hotel ${i + 1}`])),
  };
  const mDez = calcularLastmod(dezHoteis, ant, '2026-11-01', metaDoisSegmentos, nomesHoteis);
  assert.equal(dataDeEntrada(mDez['/rankings/ativos/restaurantes/sp']), '2026-11-01');
});

// --- Coerência com os dados reais publicados ---------------------------------

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = path.resolve(process.env.INDICE_DATA_DIR || path.join(raiz, 'data'));

if (existsSync(path.join(dir, 'lastmod.json'))) {
  const meta = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  const previo = JSON.parse(readFileSync(path.join(dir, 'lastmod.json'), 'utf8'));
  const stats = {};
  for (const arquivo of readdirSync(path.join(dir, 'stats')).filter((f) => /^[A-Z]{2}\.json$/.test(f))) {
    stats[arquivo.slice(0, 2)] = JSON.parse(readFileSync(path.join(dir, 'stats', arquivo), 'utf8'));
  }

  test('dados reais: lastmod.json é reproduzível a partir dos stats', () => {
    const municipios = JSON.parse(readFileSync(path.join(dir, 'municipios.json'), 'utf8'));
    const nomes = Object.fromEntries(municipios.map((m) => [`${m.uf}/${m.slug}`, m.nome]));
    const m = calcularLastmod(stats, previo, meta.geradoEm.slice(0, 10), meta, nomes);
    assert.deepEqual(m, previo);
  });

  test('dados reais: toda combinação publicável de ranking tem entrada no lastmod', () => {
    assert.ok(previo['/rankings/aberturas']);
    for (const seg of meta.segmentos) {
      for (const ano of anosPublicados(meta, stats, seg.slug)) {
        if (podePublicar(calcularRanking(stats, seg.slug, ano))) {
          assert.ok(previo[`/rankings/aberturas/${seg.slug}/${ano}`], `${seg.slug}/${ano}`);
        }
      }
    }
  });

  test('dados reais: entradas de ativos no lastmod batem com as páginas publicáveis', () => {
    const esperados = new Set(['/rankings/ativos']);
    for (const seg of meta.segmentos) {
      const porUF = new Map();
      for (const [uf, porMun] of Object.entries(stats)) {
        let n = 0;
        for (const porSeg of Object.values(porMun)) {
          const reg = porSeg[seg.slug];
          if (reg && reg.a >= meta.minimoParaIndexar) n += 1;
        }
        if (n > 0) porUF.set(uf, n);
      }
      if (!porUF.size) continue;
      esperados.add(`/rankings/ativos/${seg.slug}`);
      for (const [uf, n] of porUF) {
        if (n >= 10) esperados.add(`/rankings/ativos/${seg.slug}/${uf.toLowerCase()}`);
      }
    }
    for (const caminho of Object.keys(previo).filter((c) => c.startsWith('/rankings/ativos'))) {
      assert.ok(esperados.has(caminho), `sem página publicável: ${caminho}`);
    }
    for (const caminho of esperados) {
      assert.ok(previo[caminho], `sem entrada no lastmod: ${caminho}`);
    }
  });
}
