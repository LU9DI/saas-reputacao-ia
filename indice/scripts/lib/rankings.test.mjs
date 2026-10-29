// Testes do cálculo de rankings de aberturas por ano.
//
// A primeira parte usa fixtures sintéticos para as regras (empates, anos
// fechados, limites de publicação). A segunda confere a coerência dos números
// publicados com os dados reais de data/, sem rede.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANOS_PUBLICADOS,
  MIN_MUNICIPIOS,
  MIN_TOTAL,
  anosDaSerie,
  anosCompletos,
  anosPublicados,
  calcularRanking,
  serieDoSegmento,
  podePublicar,
  montarResposta,
} from './rankings.mjs';

const META = { competencia: '2026-10', geradoEm: '2026-10-26T07:34:27.901Z' };

// Fixture com empate no meio (2024), zero no ano, município sem campo ano e
// outro segmento que não deve interferir.
function fixtureStats() {
  return {
    GO: {
      goiania: { restaurantes: { a: 10, ano: { 2023: 30, 2024: 40, 2025: 50, 2026: 12 } } },
      anapolis: { restaurantes: { a: 8, ano: { 2023: 20, 2024: 40, 2025: 10 } } },
      semaberturas: { restaurantes: { a: 5, ano: { 2024: 0 } } },
      semano: { restaurantes: { a: 4 } },
    },
    SP: {
      'sao-paulo': { restaurantes: { a: 99, ano: { 2023: 100, 2024: 120, 2025: 150, 2026: 40 } } },
      campinas: { restaurantes: { a: 15, ano: { 2024: 5, 2025: 7 } } },
      'outro-seg': { hoteis: { a: 12, ano: { 2025: 3 } } },
    },
  };
}

// Dois líderes com o mesmo valor no topo, para o texto de empate.
function fixtureEmpateNoTopo() {
  return {
    GO: { goiania: { restaurantes: { ano: { 2025: 40 } } } },
    SP: { 'sao-paulo': { restaurantes: { ano: { 2025: 40 } } } },
  };
}

const fmt = {
  n: (x) => x.toLocaleString('pt-BR'),
  pct: (parte, total) =>
    `${((parte / total) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`,
  dataCurta: (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  },
};

const nomes = {
  'GO/goiania': 'Goiânia',
  'GO/anapolis': 'Anápolis',
  'SP/sao-paulo': 'São Paulo',
  'SP/campinas': 'Campinas',
};
const nomeDoMunicipio = (uf, mun) => nomes[`${uf}/${mun}`] ?? mun;
const nomeDaUF = (uf) => uf;

test('anosDaSerie reúne os anos presentes, sem duplicar', () => {
  assert.deepEqual(anosDaSerie(fixtureStats(), 'restaurantes'), [2023, 2024, 2025, 2026]);
});

test('anosCompletos exclui o ano da competência e ordena do mais recente para o mais antigo', () => {
  assert.deepEqual(anosCompletos(META, fixtureStats(), 'restaurantes'), [2025, 2024, 2023]);
});

test('anosPublicados limita aos anos completos mais recentes', () => {
  assert.equal(ANOS_PUBLICADOS, 3);
  assert.deepEqual(anosPublicados(META, fixtureStats(), 'restaurantes'), [2025, 2024, 2023]);
  const comMuitosAnos = {
    GO: {
      goiania: {
        restaurantes: { ano: { 2016: 1, 2017: 1, 2018: 1, 2019: 1, 2020: 1, 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1 } },
      },
    },
  };
  assert.deepEqual(anosPublicados(META, comMuitosAnos, 'restaurantes'), [2025, 2024, 2023]);
});

test('calcularRanking soma, exclui zero e ausência, e empates dividem a posição', () => {
  const r = calcularRanking(fixtureStats(), 'restaurantes', 2024);
  assert.equal(r.total, 120 + 40 + 40 + 5);
  assert.equal(r.municipiosComAbertura, 4);
  assert.deepEqual(
    r.ordenado.map((item) => [item.uf, item.municipio, item.v, item.posicao]),
    [
      ['SP', 'sao-paulo', 120, 1],
      ['GO', 'anapolis', 40, 2],
      ['GO', 'goiania', 40, 2],
      ['SP', 'campinas', 5, 4],
    ],
  );
});

test('calcularRanking monta totais e líderes por UF, em ordem decrescente', () => {
  const r = calcularRanking(fixtureStats(), 'restaurantes', 2025);
  assert.equal(r.total, 50 + 10 + 150 + 7);
  assert.equal(r.municipiosComAbertura, 4);
  assert.deepEqual(
    r.porUF.map((linha) => [linha.uf, linha.total, linha.lider]),
    [
      ['SP', 157, { municipio: 'sao-paulo', v: 150 }],
      ['GO', 60, { municipio: 'goiania', v: 50 }],
    ],
  );
});

test('calcularRanking ignora segmentos vizinhos do mesmo município', () => {
  const r = calcularRanking(fixtureStats(), 'restaurantes', 2025);
  assert.ok(!r.ordenado.some((item) => item.uf === 'SP' && item.municipio === 'outro-seg'));
});

test('podePublicar exige mínimo de aberturas e de municípios', () => {
  const r = calcularRanking(fixtureStats(), 'restaurantes', 2024);
  assert.equal(podePublicar(r), r.total >= MIN_TOTAL && r.municipiosComAbertura >= MIN_MUNICIPIOS);
  assert.equal(podePublicar(r, MIN_MUNICIPIOS, 500), false, 'total abaixo do mínimo customizado');
  assert.equal(podePublicar(r, 99, MIN_TOTAL), false, 'municípios abaixo do mínimo customizado');
  assert.equal(podePublicar(r, 4, 205), true, 'limiares customizados atingidos');
  assert.equal(MIN_TOTAL, 100);
  assert.equal(MIN_MUNICIPIOS, 10);
});

test('montarResposta traz líder, número, parcela, total, período e data de referência', () => {
  const r = calcularRanking(fixtureStats(), 'restaurantes', 2025);
  const texto = montarResposta(
    { nomeSeg: 'Restaurantes', curtoSeg: 'restaurantes', ano: 2025, ranking: r, meta: META, nomeDoMunicipio, nomeDaUF },
    fmt,
  );
  assert.ok(texto.startsWith('São Paulo (SP) foi o município com mais aberturas de restaurantes em 2025 no Brasil'), texto);
  assert.ok(texto.includes('150 estabelecimentos iniciaram atividade no ano'), texto);
  assert.ok(texto.includes('69,1% das 217 aberturas'), texto);
  assert.ok(texto.includes('4 municípios'), texto);
  assert.ok(texto.includes('Competência 2026-10, dados gerados em 26/10/2026'), texto);
});

test('montarResposta trata empate no topo sem inventar desempate', () => {
  const r = calcularRanking(fixtureEmpateNoTopo(), 'restaurantes', 2025);
  assert.deepEqual(r.ordenado.map((item) => item.posicao), [1, 1]);
  const texto = montarResposta(
    { nomeSeg: 'Restaurantes', curtoSeg: 'restaurantes', ano: 2025, ranking: r, meta: META, nomeDoMunicipio, nomeDaUF },
    fmt,
  );
  assert.ok(texto.startsWith('Os municípios com mais aberturas de restaurantes em 2025 no Brasil foram'), texto);
  assert.ok(texto.includes('Goiânia (GO) e São Paulo (SP) (empatados)'), texto);
});

test('serieDoSegmento soma o Brasil por ano', () => {
  assert.deepEqual(serieDoSegmento(fixtureStats(), 'restaurantes'), {
    2023: 150,
    2024: 205,
    2025: 217,
    2026: 52,
  });
});

// --- Coerência com os dados reais publicados ---------------------------------

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = path.resolve(process.env.INDICE_DATA_DIR || path.join(raiz, 'data'));

if (existsSync(path.join(dir, 'meta.json'))) {
  const meta = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  const municipios = JSON.parse(readFileSync(path.join(dir, 'municipios.json'), 'utf8'));
  const stats = {};
  const statsDir = path.join(dir, 'stats');
  for (const arquivo of readdirSync(statsDir).filter((f) => /^[A-Z]{2}\.json$/.test(f))) {
    stats[arquivo.slice(0, 2)] = JSON.parse(readFileSync(path.join(statsDir, arquivo), 'utf8'));
  }
  const nomePorChave = new Map(municipios.map((m) => [`${m.uf}/${m.slug}`, m.nome]));
  const anoComp = Number(meta.competencia.slice(0, 4));

  test('dados reais: todo segmento publica rankings de anos fechados e suficientes', () => {
    for (const seg of meta.segmentos) {
      const anos = anosPublicados(meta, stats, seg.slug);
      assert.ok(anos.length > 0, `segmento ${seg.slug} sem anos publicados`);
      assert.ok(anos.every((a) => a < anoComp), `${seg.slug}: ano parcial publicado (${anos})`);
      for (const ano of anos) {
        const r = calcularRanking(stats, seg.slug, ano);
        assert.ok(podePublicar(r), `${seg.slug}/${ano}: ranking abaixo do mínimo de publicação`);
      }
    }
  });

  test('dados reais: ranking bate com a soma por município, com empates na posição', () => {
    for (const seg of meta.segmentos) {
      const ano = anosPublicados(meta, stats, seg.slug)[0];
      const r = calcularRanking(stats, seg.slug, ano);
      let soma = 0;
      let municipiosComAbertura = 0;
      let maximo = 0;
      for (const porMun of Object.values(stats)) {
        for (const porSeg of Object.values(porMun)) {
          const reg = porSeg[seg.slug];
          if (!reg || !reg.ano || !Number.isInteger(reg.ano[ano])) continue;
          const v = reg.ano[ano];
          if (v > 0) {
            soma += v;
            municipiosComAbertura += 1;
            maximo = Math.max(maximo, v);
          }
        }
      }
      assert.equal(r.total, soma, `${seg.slug}/${ano}: total`);
      assert.equal(r.municipiosComAbertura, municipiosComAbertura, `${seg.slug}/${ano}: municípios`);
      assert.equal(r.ordenado[0].v, maximo, `${seg.slug}/${ano}: líder`);
      const valores = r.ordenado.map((item) => item.v);
      assert.deepEqual(valores, [...valores].sort((a, b) => b - a), `${seg.slug}/${ano}: ordenação`);
      r.ordenado.forEach((item, i) => {
        if (i > 0 && valores[i - 1] === valores[i]) {
          assert.equal(item.posicao, r.ordenado[i - 1].posicao, `${seg.slug}/${ano}: empate na posição ${i}`);
        } else {
          assert.equal(item.posicao, i + 1, `${seg.slug}/${ano}: posição ${i}`);
        }
      });
    }
  });

  test('dados reais: resposta direta usa o nome e o número reais do líder', () => {
    for (const seg of meta.segmentos) {
      const ano = anosPublicados(meta, stats, seg.slug)[0];
      const r = calcularRanking(stats, seg.slug, ano);
      const lider = r.ordenado[0];
      const nomeLider = nomePorChave.get(`${lider.uf}/${lider.municipio}`) ?? lider.municipio;
      const texto = montarResposta(
        { nomeSeg: seg.nome, curtoSeg: seg.curto, ano, ranking: r, meta, nomeDoMunicipio: (uf, mun) => nomePorChave.get(`${uf}/${mun}`) ?? mun, nomeDaUF: (uf) => uf },
        fmt,
      );
      assert.ok(texto.includes(`${nomeLider} (${lider.uf})`), `${seg.slug}/${ano}: líder no texto`);
      assert.ok(texto.includes(String(lider.v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')), `${seg.slug}/${ano}: número do líder no texto`);
      assert.ok(texto.includes(meta.competencia), `${seg.slug}/${ano}: competência no texto`);
      assert.ok(texto.includes(meta.geradoEm.slice(0, 10).split('-').reverse().join('/')), `${seg.slug}/${ano}: data de geração no texto`);
    }
  });
}
