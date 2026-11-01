#!/usr/bin/env node
// Ingestão do County Business Patterns (Census Bureau, EUA) -> data-us/
//   node scripts/ingest-us.mjs [--ano=2023] [--local=ARQUIVO.zip] [--condados=ARQUIVO.txt] [--out=DIR] [--min=10] [--sintetico]
// Baixa cbp{AA}co.zip (arquivo público, sem chave de API) e national_county2020.txt (nomes dos condados).
// Só guarda contagens agregadas por condado e segmento. Requer curl e unzip.
import { createInterface } from 'node:readline';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerCabecalho, parseLinhaCbp, criarAgregadorCbp, condadosDeTxt, resolverCondados } from './lib/cbp.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(args.out || path.join(raiz, 'data-us'));
const TMP = path.join(raiz, '.tmp', 'us');
const MIN = Number(args.min || 10);
const BASE = 'https://www2.census.gov/programs-surveys/cbp/datasets';
const URL_CONDADOS = 'https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt';
const LINHAS_MINIMAS = 900_000; // o arquivo de 2023 tem ~1,1 milhão de linhas
const log = (...a) => console.log('[ingest-us]', ...a);
const falha = (m) => {
  console.error(`[ingest-us] ERRO: ${m}`);
  process.exit(1);
};

function executar(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let saida = '';
    let erro = '';
    p.stdout.on('data', (d) => (saida += d));
    p.stderr.on('data', (d) => (erro += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(saida) : reject(new Error(`${cmd} saiu com ${code}: ${erro.slice(0, 300)}`))));
  });
}
const status = async (url) => {
  try {
    return Number((await executar('curl', ['-sS', '-I', '-L', '-m', '30', '-o', '/dev/null', '-w', '%{http_code}', url])).trim());
  } catch {
    return 0;
  }
};

function lerLinhasZip(zip, aoLer) {
  return new Promise((resolve, reject) => {
    const filho = spawn('unzip', ['-p', zip], { stdio: ['ignore', 'pipe', 'pipe'] });
    const rl = createInterface({ input: filho.stdout, crlfDelay: Infinity });
    rl.on('line', aoLer);
    filho.on('error', reject);
    filho.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`unzip saiu com ${code}`))));
  });
}

async function main() {
  await mkdir(TMP, { recursive: true });
  const segmentos = JSON.parse(await readFile(path.join(raiz, 'config', 'segments-us.json'), 'utf8'));

  // 1) Escolhe o ano e obtém o zip
  let zip = args.local;
  let ano = args.ano ? String(args.ano) : null;
  if (!zip) {
    if (!ano) {
      const hoje = new Date().getUTCFullYear();
      for (let a = hoje - 1; a >= hoje - 4 && !ano; a -= 1) {
        const s = await status(`${BASE}/${a}/cbp${String(a).slice(2)}co.zip`);
        log(`ano ${a}: HTTP ${s}`);
        if (s === 200) ano = String(a);
      }
      if (!ano) falha('não encontrei o arquivo CBP nos últimos 4 anos. Informe --ano.');
    }
    zip = path.join(TMP, `cbp${ano.slice(2)}co.zip`);
    log('baixando', `${BASE}/${ano}/cbp${ano.slice(2)}co.zip`);
    await executar('curl', ['-fL', '--retry', '3', '--retry-delay', '5', '-sS', '-o', zip, `${BASE}/${ano}/cbp${ano.slice(2)}co.zip`]);
  } else if (!ano) {
    falha('com --local informe também --ano=AAAA');
  }

  // 2) Nomes dos condados
  let txt;
  if (args.condados) txt = await readFile(path.resolve(args.condados), 'utf8');
  else txt = await executar('curl', ['-fsSL', '--retry', '4', '--retry-delay', '5', '-m', '90', URL_CONDADOS]);
  const condados = condadosDeTxt(txt);
  log('condados no arquivo do Census:', condados.length);

  // 3) Agrega
  let idx = null;
  let ag = null;
  let primeira = true;
  await lerLinhasZip(zip, (linha) => {
    if (primeira) {
      primeira = false;
      try { idx = lerCabecalho(linha); } catch (e) { falha(`layout do arquivo mudou: ${e.message}`); }
      ag = criarAgregadorCbp(segmentos, idx);
      return;
    }
    ag.ingerir(parseLinhaCbp(linha));
  });
  if (!ag) falha('arquivo vazio');
  const { lidas, usadas } = ag.contagem();
  log(`linhas lidas: ${lidas.toLocaleString('en-US')} | no escopo: ${usadas.toLocaleString('en-US')}`);
  if (lidas < LINHAS_MINIMAS && !args.sintetico) falha(`só ${lidas} linhas (mínimo esperado ${LINHAS_MINIMAS}); base incompleta?`);

  // 4) Resolve condados e monta a saída
  const lista = resolverCondados(ag.dados.keys(), condados);
  const semNome = ag.dados.size - lista.length;
  log(`condados com dados: ${ag.dados.size} | resolvidos: ${lista.length} | descartados (sem nome/estado fora do escopo): ${semNome}`);
  if (!args.sintetico && lista.length < 2500) falha(`só ${lista.length} condados resolvidos (esperado ~3.100).`);

  const stats = {};
  const totais = Object.fromEntries(segmentos.map((s) => [s.slug, 0]));
  for (const c of lista) {
    for (const [seg, r] of Object.entries(ag.dados.get(c.chave))) {
      if (r.e < 1) continue;
      ((stats[c.state] ||= {})[c.slug] ||= {})[seg] = { e: r.e, ...(r.empOk && r.emp > 0 ? { emp: r.emp } : {}), sz: r.sz };
      totais[seg] += r.e;
    }
  }
  for (const [s, t] of Object.entries(totais)) log(`total EUA ${s}: ${t.toLocaleString('en-US')}`);
  if (!args.sintetico && Object.values(totais).some((t) => t < 1000)) falha('algum segmento ficou com menos de 1.000 estabelecimentos; verifique os códigos NAICS.');

  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, 'stats'), { recursive: true });
  const usados = new Set(Object.entries(stats).flatMap(([st, m]) => Object.keys(m).map((s) => `${st}/${s}`)));
  await writeFile(path.join(OUT, 'counties.json'), JSON.stringify(lista.filter((c) => usados.has(`${c.state}/${c.slug}`)).map(({ state, slug, nome }) => ({ state, slug, nome }))));
  for (const [st, m] of Object.entries(stats)) await writeFile(path.join(OUT, 'stats', `${st}.json`), JSON.stringify(m));
  const meta = {
    ano,
    geradoEm: new Date().toISOString(),
    fonte: { nome: 'County Business Patterns, U.S. Census Bureau', url: 'https://www.census.gov/programs-surveys/cbp.html' },
    minimoParaIndexar: MIN,
    segmentos: segmentos.map(({ slug, nome, curto, naics }) => ({ slug, nome, curto, naics })),
    linhasLidas: lidas,
    linhasNoEscopo: usadas,
    ...(args.sintetico ? { sintetico: true } : {}),
  };
  await writeFile(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
  log('ok ->', OUT);
  await rm(TMP, { recursive: true, force: true });
}

main().catch((e) => falha(String(e && e.stack ? e.stack : e)));
