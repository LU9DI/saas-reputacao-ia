#!/usr/bin/env node
// Ingestão do County Business Patterns (Census Bureau, EUA): estabelecimentos por condado e segmento.
//   node scripts/ingest-us.mjs [--ano=2023] [--out=data-us] [--min=10] [--local=DIR] [--sintetico]
// Fonte: arquivo de condados do CBP (cbpYYco.zip), CC0 segundo o catálogo data.gov. Só contagens de estabelecimentos
// e faixas de tamanho; emprego e folha ficam de fora de propósito (valores com ruído/supressão).
// Requer `curl` e `unzip`. Os endereços e o layout do arquivo foram lidos na documentação do Census, mas o arquivo
// nunca foi aberto no ambiente de desenvolvimento: o cabeçalho é validado na execução.

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { linhaCsv, mapearCabecalho, criarAgregadorUS, nomesDeCondados, resolverCondados } from './lib/us.mjs';

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(raiz, args.out || 'data-us');
const TMP = path.join(raiz, '.tmp', 'us');
const ANO = String(args.ano || '2023');
const MINIMO = Number(args.min || 10);
const local = args.local ? path.resolve(args.local) : null;
const log = (...m) => console.log('[ingest-us]', ...m);
const falha = (m) => { console.error(`[ingest-us] ERRO: ${m}`); process.exit(1); };

function executar(cmd, a) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, a, { stdio: ['ignore', 'pipe', 'pipe'] });
    let o = ''; let e = '';
    p.stdout.on('data', (d) => (o += d));
    p.stderr.on('data', (d) => (e += d));
    p.on('error', reject);
    p.on('close', (c) => (c === 0 ? resolve(o) : reject(new Error(`${cmd} saiu com ${c}: ${e.slice(0, 300)}`))));
  });
}
const baixar = async (url, destino) => { log('baixando', url); await executar('curl', ['-fL', '--retry', '4', '--retry-delay', '5', '-sS', '-m', '600', '-o', destino, url]); };

async function lerCsvZip(zip, aoLer) {
  const filho = spawn('unzip', ['-p', zip], { stdio: ['ignore', 'pipe', 'pipe'] });
  let erro = '';
  filho.stderr.on('data', (d) => (erro += d));
  const rl = createInterface({ input: filho.stdout, crlfDelay: Infinity });
  for await (const linha of rl) if (linha) aoLer(linha);
  await new Promise((res, rej) => filho.on('close', (c) => (c === 0 ? res() : rej(new Error(`unzip saiu com ${c}: ${erro.slice(0, 300)}`)))));
}

async function main() {
  const segmentos = JSON.parse(await readFile(path.join(raiz, 'config', 'segments-us.json'), 'utf8'));
  await mkdir(TMP, { recursive: true });
  const yy = ANO.slice(2);
  const zip = local ? path.join(local, `cbp${yy}co.zip`) : path.join(TMP, `cbp${yy}co.zip`);
  if (local) { if (!existsSync(zip)) falha(`arquivo ausente: ${zip}`); } else await baixar(`https://www2.census.gov/programs-surveys/cbp/datasets/${ANO}/cbp${yy}co.zip`, zip);

  // Nomes dos condados primeiro: se falhar, falha em segundos.
  let textoNomes;
  if (local && existsSync(path.join(local, 'counties.txt'))) textoNomes = await readFile(path.join(local, 'counties.txt'), 'utf8');
  else {
    const fontes = [
      'https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt',
      'https://raw.githubusercontent.com/kjhealy/fips-codes/master/county_fips_master.csv',
    ];
    for (const u of fontes) {
      try { textoNomes = await executar('curl', ['-fsSL', '--retry', '3', '--retry-delay', '5', '-m', '90', u]); nomesDeCondados(textoNomes); log('nomes de condados de', u); break; } catch (e) { log('fonte de nomes falhou:', u, String(e.message).split('\n')[0]); textoNomes = null; }
    }
  }
  if (!textoNomes) falha('não consegui obter nomes de condados em nenhuma fonte.');
  const nomes = nomesDeCondados(textoNomes);

  const agreg = criarAgregadorUS(segmentos);
  let cab = null;
  await lerCsvZip(zip, (linha) => {
    if (!cab) { cab = mapearCabecalho(linhaCsv(linha)); log('cabeçalho ok; faixas de tamanho:', cab.faixas.map((f) => f.n).join(' ')); return; }
    agreg.ingerir(linhaCsv(linha), cab);
  });
  const { lidas, usadas, descartadas } = agreg.contagem();
  log(`linhas lidas: ${lidas}, no escopo: ${usadas}, descartadas: ${descartadas}`);
  if (lidas < 200000 && !args.sintetico) falha(`só ${lidas} linhas (esperado centenas de milhares). O arquivo parece incompleto ou o layout mudou.`);
  if (descartadas > lidas * 0.001) falha(`linhas descartadas demais (${descartadas} de ${lidas}).`);
  if (!usadas) falha('nenhuma linha caiu nos segmentos; os códigos NAICS podem não corresponder à versão do arquivo.');

  const condados = resolverCondados([...agreg.dados.keys()], nomes);
  const porChave = new Map(condados.map((c) => [`${c.fips.slice(0, 2)}|${c.fips.slice(2)}`, c]));
  const stats = {};
  const semNome = [];
  const porSegmento = Object.fromEntries(segmentos.map((s) => [s.slug, 0]));
  for (const [chave, porSeg] of agreg.dados) {
    const c = porChave.get(chave);
    if (!c.nameOk) { semNome.push(c.fips); continue; } // sem nome oficial: não publicamos página com nome inventado
    for (const [seg, reg] of Object.entries(porSeg)) {
      if (reg.e < 1) continue;
      ((stats[c.state] ||= {})[c.slug] ||= {})[seg] = reg;
      porSegmento[seg] += reg.e;
    }
  }
  const estados = Object.keys(stats).length;
  if (!args.sintetico && (estados < 50 || condados.length < 2500)) falha(`cobertura baixa: ${estados} estados, ${condados.length} condados.`);
  log('estabelecimentos por segmento:', JSON.stringify(porSegmento));
  log(`condados sem nome oficial, fora do Índice: ${semNome.length} (${semNome.slice(0, 12).join(' ')})`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, 'stats'), { recursive: true });
  const usados = new Set();
  for (const [st, porCond] of Object.entries(stats)) {
    await writeFile(path.join(OUT, 'stats', `${st}.json`), JSON.stringify(porCond));
    for (const slug of Object.keys(porCond)) usados.add(`${st}/${slug}`);
  }
  await writeFile(path.join(OUT, 'counties.json'), JSON.stringify(condados.filter((c) => usados.has(`${c.state}/${c.slug}`)).map(({ nameOk, ...c }) => c)));
  await writeFile(path.join(OUT, 'meta.json'), JSON.stringify({
    year: Number(ANO),
    generatedAt: new Date().toISOString(),
    source: { name: 'County Business Patterns (CBP), U.S. Census Bureau', url: 'https://www.census.gov/programs-surveys/cbp.html', license: 'CC0 1.0 (segundo o catálogo data.gov)' },
    minimumToIndex: MINIMO,
    segments: segmentos,
    sizeBins: cab.faixas.map((f) => f.n),
    linesRead: lidas,
    linesInScope: usadas,
    synthetic: Boolean(args.sintetico),
  }, null, 1));
  log('pronto em', OUT);
}
main().catch((e) => falha(String(e.stack || e)));
