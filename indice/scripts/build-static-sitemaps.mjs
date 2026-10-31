#!/usr/bin/env node
// Materializa os sitemaps do Índice como arquivos estáticos.
//
//   node scripts/build-static-sitemaps.mjs            # grava em .static-sitemaps/
//   node scripts/build-static-sitemaps.mjs --check    # valida sem publicar nada
//   node scripts/build-static-sitemaps.mjs --out=/caminho
//
// Uso pretendido: publicar o diretório gerado em um host estático (Pages/R2/KV)
// e apontar a rota /indice/sitemap*/*.xml para ele, de modo que o sitemap deixe
// de depender do processo Node do Render. O app continua sendo a fonte de
// verdade; este artefato é a materialização dela.
//
// Não faz rede, não publica e não altera dados.

import { mkdirSync, readFileSync, readdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { anosPublicados, calcularRanking, podePublicar } from './lib/rankings.mjs';
import {
  caminhosIndexaveis,
  criarLastmodDe,
  dividirShards,
  validarArtefato,
  xmlSitemapIndex,
  xmlUrlset,
  POR_ARQUIVO,
} from './lib/static-sitemaps.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirDados = path.resolve(process.env.INDICE_DATA_DIR || path.join(raiz, 'data'));
const apenasChecar = process.argv.includes('--check');
const argOut = process.argv.find((a) => a.startsWith('--out='));
const dirSaida = path.resolve(argOut ? argOut.slice('--out='.length) : path.join(raiz, '.static-sitemaps'));

const ler = (arquivo) => JSON.parse(readFileSync(path.join(dirDados, arquivo), 'utf8'));
const falhar = (mensagem) => {
  console.error(`[static-sitemaps] ${mensagem}`);
  process.exit(1);
};

if (!existsSync(path.join(dirDados, 'meta.json'))) falhar(`dados ausentes em ${dirDados} (falta meta.json).`);

const meta = ler('meta.json');
const municipios = ler('municipios.json');
const stats = {};
for (const arquivo of readdirSync(path.join(dirDados, 'stats')).filter((f) => /^[A-Z]{2}\.json$/.test(f))) {
  stats[arquivo.slice(0, 2)] = JSON.parse(readFileSync(path.join(dirDados, 'stats', arquivo), 'utf8'));
}
const lastmodMapa = existsSync(path.join(dirDados, 'lastmod.json')) ? ler('lastmod.json') : {};

const rankings = { anosPublicados, calcularRanking, podePublicar };
const caminhos = caminhosIndexaveis({ meta, municipios, stats, rankings });
const shards = dividirShards(caminhos, POR_ARQUIVO);
const lastmodDe = criarLastmodDe(lastmodMapa, meta.geradoEm);
const xmlIndex = xmlSitemapIndex(shards.length, meta.geradoEm);

const erros = validarArtefato({ caminhos, shards, xmlIndex, porArquivo: POR_ARQUIVO, lastmodDe });

// Coerência com o snapshot que o site principal usa para declarar os shards.
// Divergência aqui significa que o índice central passaria a apontar para um
// sitemap/quantidade diferente do artefato publicado.
const caminhoSnapshot = path.resolve(raiz, '..', 'frontend', 'src', 'generated', 'indice-snapshot.json');
if (existsSync(caminhoSnapshot)) {
  const snapshot = JSON.parse(readFileSync(caminhoSnapshot, 'utf8'));
  if (snapshot.urls?.total !== caminhos.length) {
    erros.push(`snapshot.urls.total=${snapshot.urls?.total} != ${caminhos.length} URLs deste artefato`);
  }
  if (snapshot.competencia !== meta.competencia) {
    erros.push(`snapshot.competencia=${snapshot.competencia} != meta.competencia=${meta.competencia}`);
  }
  const shardsEsperados = Math.max(1, Math.ceil((snapshot.urls?.total ?? 0) / POR_ARQUIVO));
  if (shardsEsperados !== shards.length) {
    erros.push(`snapshot implica ${shardsEsperados} shards, artefato tem ${shards.length}`);
  }
} else {
  console.warn(`[static-sitemaps] aviso: ${caminhoSnapshot} ausente; coerência com o índice central não verificada.`);
}

const resumo = {
  competencia: meta.competencia,
  geradoEm: meta.geradoEm,
  shards: shards.map((shard, id) => ({ id, urls: shard.length, bytes: Buffer.byteLength(xmlUrlset(shard, lastmodDe)) })),
  total: caminhos.length,
  porArquivo: POR_ARQUIVO,
};

if (erros.length) {
  console.error(`[static-sitemaps] artefato inválido (${erros.length}):`);
  for (const erro of erros.slice(0, 20)) console.error(` - ${erro}`);
  process.exit(1);
}

if (apenasChecar) {
  const existentes = existsSync(dirSaida) ? readdirSync(dirSaida).filter((f) => f.endsWith('.xml')) : [];
  if (!existentes.length) falhar(`--check exige artefato prévio em ${dirSaida} (rode sem --check antes).`);
  const assinatura = (conteudo) => Buffer.from(conteudo).length;
  const divergencias = [];
  const esperadoArquivos = { 'sitemap-index.xml': xmlIndex };
  shards.forEach((shard, id) => {
    esperadoArquivos[`sitemap-${id}.xml`] = xmlUrlset(shard, lastmodDe);
  });
  for (const [nome, conteudo] of Object.entries(esperadoArquivos)) {
    const destino = path.join(dirSaida, nome);
    if (!existsSync(destino)) {
      divergencias.push(`${nome} ausente no artefato`);
      continue;
    }
    const atual = readFileSync(destino, 'utf8');
    if (atual !== conteudo) {
      divergencias.push(`${nome} divergente (artefato ${assinatura(atual)} B, base ${assinatura(conteudo)} B)`);
    }
  }
  if (divergencias.length) {
    console.error('[static-sitemaps] artefato desatualizado em relação a data/:');
    for (const d of divergencias) console.error(` - ${d}`);
    console.error('Rode `npm run sitemaps:static` e versione o artefato publicado.');
    process.exit(1);
  }
  console.log(`[static-sitemaps] artefato íntegro e atualizado: ${resumo.total} URLs em ${shards.length} shards.`);
  process.exit(0);
}

rmSync(dirSaida, { recursive: true, force: true });
mkdirSync(dirSaida, { recursive: true });
writeFileSync(path.join(dirSaida, 'sitemap-index.xml'), xmlIndex, 'utf8');
shards.forEach((shard, id) => writeFileSync(path.join(dirSaida, `sitemap-${id}.xml`), xmlUrlset(shard, lastmodDe), 'utf8'));

console.log(JSON.stringify(resumo, null, 1));
console.log(`[static-sitemaps] gravado em ${dirSaida}`);
