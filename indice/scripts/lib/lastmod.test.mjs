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
    const m = calcularLastmod(stats, previo, meta.geradoEm.slice(0, 10), meta);
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
}
