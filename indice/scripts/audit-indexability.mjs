#!/usr/bin/env node
// Auditoria estratificada de indexabilidade do Índice Filtra.AI.
//
// Lê os mesmos arquivos de dados usados pelo app e responde:
//   - quantas URLs existem em cada estrato (home, metodologia, UF, município, célula, rankings);
//   - qual é a cobertura de cada segmento e de cada UF;
//   - quantas células ficaram abaixo do mínimo (e, portanto, são 404, não noindex);
//   - onde há baixa cobertura que merece revisão editorial.
//
// Uso:
//   node scripts/audit-indexability.mjs
//   node scripts/audit-indexability.mjs --json
//
// Não altera dados, não publica nada e não faz requisições de rede.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { anosPublicados, calcularRanking, podePublicar } from './lib/rankings.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.env.INDICE_DATA_DIR || path.join(raiz, 'data'));
const json = process.argv.includes('--json');

const falhar = (mensagem) => {
  console.error(`[audit] ${mensagem}`);
  process.exit(1);
};

const ler = (caminho) => {
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch (erro) {
    falhar(`não foi possível ler ${caminho}: ${erro.message}`);
  }
};

if (!existsSync(path.join(dir, 'meta.json'))) falhar(`dados não encontrados em ${dir} (falta meta.json).`);
const meta = ler(path.join(dir, 'meta.json'));
const municipios = ler(path.join(dir, 'municipios.json'));
const statsDir = path.join(dir, 'stats');
if (!existsSync(statsDir)) falhar(`pasta de estatísticas ausente: ${statsDir}.`);

const minimo = meta.minimoParaIndexar;
const segmentos = meta.segmentos.map((s) => s.slug);
const nomeDoSegmento = new Map(meta.segmentos.map((s) => [s.slug, s.nome]));
const nomeDoMunicipio = new Map(municipios.map((m) => [`${m.uf}/${m.slug}`, m.nome]));
const erros = [];

if (!Number.isInteger(minimo) || minimo < 1) erros.push('meta.minimoParaIndexar inválido.');
if (!segmentos.length) erros.push('meta.segmentos vazio.');
if (!municipios.length) erros.push('municipios.json vazio.');

const arquivos = readdirSync(statsDir).filter((f) => /^[A-Z]{2}\.json$/.test(f));
if (!arquivos.length) erros.push('stats/ vazio.');

const porSegmento = new Map(
  segmentos.map((seg) => [seg, { total: 0, municipiosNoSegmento: 0, municipiosComPagina: 0, totalNasPaginas: 0 }]),
);
const porUF = new Map();
const porMunicipio = new Map();
const celulas = [];
const abaixoDoMinimo = [];
const dadosPorUF = {};
let celulasComDados = 0;

for (const arquivo of arquivos.sort()) {
  const uf = arquivo.slice(0, 2);
  const dados = ler(path.join(statsDir, arquivo));
  dadosPorUF[uf] = dados;
  const ufResumo = porUF.get(uf) || {
    uf,
    municipiosNoEstado: new Set(),
    municipiosComPagina: new Set(),
    celulas: 0,
    ativosNoEstado: 0,
    ativosNasPaginas: 0,
  };
  porUF.set(uf, ufResumo);

  for (const [slugMun, porSeg] of Object.entries(dados)) {
    const chaveMun = `${uf}/${slugMun}`;
    if (!nomeDoMunicipio.has(chaveMun)) {
      erros.push(`município ${chaveMun} não está em municipios.json.`);
      continue;
    }
    const munResumo = porMunicipio.get(chaveMun) || { chave: chaveMun, nome: nomeDoMunicipio.get(chaveMun), segmentos: 0, ativos: 0 };
    porMunicipio.set(chaveMun, munResumo);

    for (const seg of segmentos) {
      const reg = porSeg[seg];
      if (!reg || !Number.isInteger(reg.a) || reg.a <= 0) continue;
      celulasComDados += 1;
      const segResumo = porSegmento.get(seg);
      segResumo.total += reg.a;
      segResumo.municipiosNoSegmento += 1;
      ufResumo.municipiosNoEstado.add(slugMun);
      ufResumo.ativosNoEstado += reg.a;

      if (reg.a >= minimo) {
        const celula = { uf, municipio: slugMun, segmento: seg, ativos: reg.a, abertos: reg.ab, baixas: reg.ba };
        celulas.push(celula);
        segResumo.municipiosComPagina += 1;
        segResumo.totalNasPaginas += reg.a;
        ufResumo.municipiosComPagina.add(slugMun);
        ufResumo.celulas += 1;
        ufResumo.ativosNasPaginas += reg.a;
        munResumo.segmentos += 1;
        munResumo.ativos += reg.a;
      } else {
        abaixoDoMinimo.push({ uf, municipio: slugMun, segmento: seg, ativos: reg.a });
      }
    }
  }
}

const municipiosComPagina = [...porMunicipio.values()].filter((m) => m.segmentos > 0);
const ufsComPagina = [...porUF.values()].filter((u) => u.celulas > 0);
const totalAtivosNosSegmentos = [...porSegmento.values()].reduce((t, s) => t + s.total, 0);
const totalAtivosNasPaginas = [...porSegmento.values()].reduce((t, s) => t + s.totalNasPaginas, 0);

const rankings = segmentos.map((seg) => {
  const anos = anosPublicados(meta, dadosPorUF, seg).filter((ano) => podePublicar(calcularRanking(dadosPorUF, seg, ano)));
  return { slug: seg, nome: nomeDoSegmento.get(seg), anos, urls: anos.length };
});
const urlsRankings = rankings.reduce((t, r) => t + r.urls, 0);
const urlsHubRankings = urlsRankings > 0 ? 1 : 0;
const totalUrls = 2 + ufsComPagina.length + municipiosComPagina.length + celulas.length + urlsHubRankings + urlsRankings;

const distribuicao = { '1 segmento': 0, '2 a 3 segmentos': 0, '4 a 6 segmentos': 0, '7 a 9 segmentos': 0 };
for (const mun of municipiosComPagina) {
  if (mun.segmentos === 1) distribuicao['1 segmento'] += 1;
  else if (mun.segmentos <= 3) distribuicao['2 a 3 segmentos'] += 1;
  else if (mun.segmentos <= 6) distribuicao['4 a 6 segmentos'] += 1;
  else distribuicao['7 a 9 segmentos'] += 1;
}

const limiarRevisao = minimo * 2;
const celulasFinas = celulas.filter((c) => c.ativos < limiarRevisao);
const ufsBaixaCobertura = ufsComPagina
  .filter((u) => u.municipiosComPagina.size < 5)
  .sort((a, b) => a.municipiosComPagina.size - b.municipiosComPagina.size);

const percentual = (parte, total) => (total > 0 ? (parte / total) * 100 : 0);
const coberturaGeral = percentual(totalAtivosNasPaginas, totalAtivosNosSegmentos);
const ufTabela = ufsComPagina
  .map((u) => ({
    uf: u.uf,
    municipiosComPagina: u.municipiosComPagina.size,
    municipiosNoEstado: u.municipiosNoEstado.size,
    celulas: u.celulas,
    ativosNasPaginas: u.ativosNasPaginas,
    ativosNoEstado: u.ativosNoEstado,
    cobertura: percentual(u.ativosNasPaginas, u.ativosNoEstado),
  }))
  .sort((a, b) => a.cobertura - b.cobertura || a.uf.localeCompare(b.uf));

const relatorio = {
  competencia: meta.competencia,
  geradoEm: meta.geradoEm,
  minimoParaIndexar: minimo,
  estratos: {
    homeMetodologia: 2,
    ufs: ufsComPagina.length,
    municipios: municipiosComPagina.length,
    celulas: celulas.length,
    rankings: urlsRankings,
    hubRankings: urlsHubRankings,
    totalUrls,
    abaixoDoMinimo: abaixoDoMinimo.length,
    celulasComDados,
  },
  cobertura: {
    ativosNosSegmentos: totalAtivosNosSegmentos,
    ativosNasPaginas: totalAtivosNasPaginas,
    percentual: coberturaGeral,
  },
  distribuicaoMunicipios: distribuicao,
  porSegmento: [...porSegmento.entries()].map(([slug, s]) => ({
    slug,
    nome: nomeDoSegmento.get(slug),
    ...s,
    cobertura: percentual(s.totalNasPaginas, s.total),
  })),
  porUF: ufTabela,
  rankings,
  revisao: {
    celulasFinas: celulasFinas.length,
    limiar: limiarRevisao,
    ufsComMenosDe5Municipios: ufsBaixaCobertura.map((u) => ({ uf: u.uf, municipios: u.municipiosComPagina.size })),
    exemplosDeCelulasFinas: celulasFinas
      .slice()
      .sort((a, b) => a.ativos - b.ativos)
      .slice(0, 10)
      .map((c) => ({ ...c, nome: nomeDoMunicipio.get(`${c.uf}/${c.municipio}`) })),
  },
  erros,
};

if (json) {
  console.log(JSON.stringify(relatorio, null, 2));
} else {
  const fix = (valor, casas = 0) => valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  console.log(`\n[audit] Índice Filtra.AI — competência ${meta.competencia} (dados de ${meta.geradoEm.slice(0, 10)})`);
  console.log(`[audit] mínimo para publicar uma célula município × segmento: ${fix(minimo)} estabelecimentos ativos\n`);
  console.log('Estratos indexáveis');
  console.log(`- Home e metodologia: ${fix(2)}`);
  console.log(`- Estados com página: ${fix(ufsComPagina.length)}`);
  console.log(`- Municípios com ao menos uma página: ${fix(municipiosComPagina.length)}`);
  console.log(`- Células município × segmento: ${fix(celulas.length)}`);
  console.log(`- Rankings de aberturas por ano: ${fix(urlsRankings)}${urlsHubRankings ? ' + hub de rankings' : ''}`);
  console.log(`- Total de URLs no sitemap: ${fix(totalUrls)}`);
  console.log(`- Células com dados mas abaixo do mínimo (404, não noindex): ${fix(abaixoDoMinimo.length)}`);
  console.log(`- Cobertura: ${fix(totalAtivosNasPaginas)} de ${fix(totalAtivosNosSegmentos)} ativos (${fix(coberturaGeral, 1)}%)\n`);

  console.log('Rankings de aberturas publicados (anos fechados com dados suficientes)');
  for (const r of rankings) {
    console.log(
      r.anos.length
        ? `- ${r.nome}: ${fix(r.urls)} ranking(s) (${r.anos.join(', ')})`
        : `- ${r.nome}: nenhum ranking publicável (anos fechados abaixo do mínimo de ${fix(100)} aberturas ou ${fix(10)} municípios)`,
    );
  }

  console.log('Cobertura por segmento');
  for (const s of relatorio.porSegmento) {
    console.log(
      `- ${s.nome}: ${fix(s.total)} ativos no Brasil; ${fix(s.municipiosComPagina)} municípios com página de ${fix(s.municipiosNoSegmento)}; ${fix(s.totalNasPaginas)} ativos nas páginas (${fix(s.cobertura, 1)}%)`,
    );
  }

  console.log('\nCobertura por UF (ordenada da menor para a maior)');
  for (const u of ufTabela) {
    console.log(
      `- ${u.uf}: ${fix(u.municipiosComPagina)} municípios com página de ${fix(u.municipiosNoEstado)}; ${fix(u.celulas)} células; ${fix(u.ativosNasPaginas)} de ${fix(u.ativosNoEstado)} ativos (${fix(u.cobertura, 1)}%)`,
    );
  }

  console.log('\nDistribuição de páginas por município');
  for (const [faixa, quantidade] of Object.entries(distribuicao)) console.log(`- ${faixa}: ${fix(quantidade)}`);

  console.log('\nSinais para revisão (sem noindex automático)');
  console.log(`- Células entre ${fix(minimo)} e ${fix(limiarRevisao - 1)} ativos: ${fix(celulasFinas.length)} (${fix(percentual(celulasFinas.length, celulas.length), 1)}% das células publicadas).`);
  console.log(`- UFs com menos de 5 municípios com página: ${ufsBaixaCobertura.length ? ufsBaixaCobertura.map((u) => `${u.uf} (${u.municipiosComPagina.size})`).join(', ') : 'nenhuma'}.`);
  if (relatorio.revisao.exemplosDeCelulasFinas.length) {
    console.log('- Exemplos de células finas (menor contagem):');
    for (const c of relatorio.revisao.exemplosDeCelulasFinas) {
      console.log(`  · ${c.nome} (${c.uf}) × ${nomeDoSegmento.get(c.segmento)}: ${fix(c.ativos)} ativos`);
    }
  }

  console.log('\nListagens profundas e paginação');
  console.log('- Não há paginação no Índice. Cada UF lista todos os municípios com página; cada célula lista até 10 outros municípios do estado e todos os outros segmentos do município.');
  console.log('- Páginas abaixo do mínimo não são geradas (404) e não entram no sitemap. Não é necessário aplicar noindex a elas.');
  console.log('- Não há evidência, nos dados, que justifique noindex em células publicadas: todas têm contagem direta e acima do mínimo. Baixa cobertura é sinal para acompanhar no Search Console, não para remover URL.');
  console.log('\nPróximo passo de medição: publicar, enviar o sitemap e acompanhar impressões, indexação e consultas por estrato no Search Console. O Índice não mede citações em IA nem tráfego orgânico por conta própria.\n');
}

if (erros.length) {
  console.error(`[audit] ${erros.length} erro(s) estrutural(is):`);
  for (const erro of erros) console.error(`- ${erro}`);
  process.exit(1);
}
