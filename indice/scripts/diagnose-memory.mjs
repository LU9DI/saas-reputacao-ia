#!/usr/bin/env node
/**
 * Diagnóstico local e somente leitura da memória do filtra-indice.
 *
 * Execute na pasta indice, depois de npm ci:
 *   npm run build
 *   node scripts/diagnose-memory.mjs
 *
 * Opcional:
 *   node scripts/diagnose-memory.mjs --base-url http://127.0.0.1:3100
 *   node scripts/diagnose-memory.mjs --no-server --pid 1234
 *   node scripts/diagnose-memory.mjs --br 300 --us 300
 *
 * O modo padrão inicia server.mjs em uma porta isolada (3197), consulta páginas
 * reais geradas a partir de data/ e data-us/ e encerra o processo ao final.
 * Não altera arquivos (além do cache ISR em .next/cache), banco, Render ou
 * configurações de deploy.
 *
 * Correção em relação à primeira versão: as URLs dos EUA usavam a sigla do
 * estado ("/us/al/...") em vez do slug usado pelo app ("/us/alabama/..."),
 * então todas as requisições respondiam 404 e a medição não exercitava a
 * renderização. Agora os caminhos são derivados das mesmas regras do sitemap
 * (incluindo o Brasil) e qualquer status >= 400 falha o diagnóstico.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { caminhosUS, lerEstadosUS } from './lib/static-sitemaps.mjs';
import * as rankingsCore from './lib/rankings.mjs';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const baseUrl = arg('--base-url', 'http://127.0.0.1:3197').replace(/\/$/, '');
const external = args.includes('--no-server');
const brDir = path.resolve(process.env.INDICE_DATA_DIR || 'data');
const usDir = path.resolve(process.env.INDICE_US_DATA_DIR || 'data-us');
const loteBr = Number(arg('--br', '100'));
const loteUs = Number(arg('--us', '100'));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function rssBytes(pid) {
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', `(Get-Process -Id ${pid} -ErrorAction Stop).WorkingSet64`], { encoding: 'utf8', timeout: 5000 });
      return Number(out.trim().split(/\r?\n/).at(-1));
    }
    const out = execFileSync('ps', ['-o', 'rss=', '-p', String(pid)], { encoding: 'utf8', timeout: 5000 });
    return Number(out.trim()) * 1024;
  } catch { return null; }
}
const mib = (n) => (n == null || !Number.isFinite(n) ? 'n/a' : (n / 1048576).toFixed(1) + ' MiB');

/** Caminhos do Brasil: espelha src/lib/data.ts (iterarCaminhos) + src/lib/rankings.ts. */
function caminhosBR() {
  const meta = JSON.parse(readFileSync(path.join(brDir, 'meta.json'), 'utf8'));
  const municipios = JSON.parse(readFileSync(path.join(brDir, 'municipios.json'), 'utf8'));
  const porChave = new Set(municipios.map((m) => `${m.uf}/${m.slug}`));
  const ufs = readdirSync(path.join(brDir, 'stats')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
  const urls = ['/indice', '/indice/metodologia', '/indice/rankings/aberturas', '/indice/rankings/ativos'];
  const stats = {};
  for (const uf of ufs) stats[uf] = JSON.parse(readFileSync(path.join(brDir, 'stats', uf + '.json'), 'utf8'));
  for (const uf of ufs) {
    const sigla = uf.toLowerCase();
    let temPagina = false;
    for (const [mun, porSeg] of Object.entries(stats[uf])) {
      if (!porChave.has(`${uf}/${mun}`)) continue;
      const segs = meta.segmentos.filter((s) => porSeg[s.slug] && porSeg[s.slug].a >= meta.minimoParaIndexar);
      if (!segs.length) continue;
      temPagina = true;
      urls.push(`/indice/${sigla}/${mun}`);
      for (const s of segs) urls.push(`/indice/${sigla}/${mun}/${s.slug}`);
    }
    if (temPagina) urls.push(`/indice/${sigla}`);
  }
  // Rankings de aberturas por ano (mesma regra de src/lib/rankings.ts).
  for (const seg of meta.segmentos) {
    for (const ano of rankingsCore.anosPublicados(meta, stats, seg.slug)) urls.push(`/indice/rankings/aberturas/${seg.slug}/${ano}`);
  }
  return urls;
}

/** Caminhos dos EUA: mesma regra de src/lib/us.ts (usCaminhos). */
function caminhosUSUrls() {
  if (!existsSync(path.join(usDir, 'meta.json'))) return [];
  const meta = JSON.parse(readFileSync(path.join(usDir, 'meta.json'), 'utf8'));
  const counties = JSON.parse(readFileSync(path.join(usDir, 'counties.json'), 'utf8'));
  const stats = {};
  for (const f of readdirSync(path.join(usDir, 'stats')).filter((x) => x.endsWith('.json'))) {
    stats[f.replace('.json', '')] = JSON.parse(readFileSync(path.join(usDir, 'stats', f), 'utf8'));
  }
  const estados = lerEstadosUS(readFileSync('src/lib/us-states.ts', 'utf8'));
  return caminhosUS({ meta, counties, stats, estados }).map((c) => '/indice' + c);
}

async function request(url) {
  const start = performance.now();
  try {
    const response = await fetch(baseUrl + url, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
    await response.arrayBuffer();
    return { status: response.status, ms: performance.now() - start, url };
  } catch (error) {
    return { status: 'ERR', ms: performance.now() - start, url, error: error.message };
  }
}

async function waitReady() {
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(baseUrl + '/indice/metodologia', { signal: AbortSignal.timeout(2000) });
      if (r.ok || r.status === 404) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error('Servidor não ficou pronto em 90 segundos.');
}

function summary(label, results, pid) {
  const statuses = {};
  for (const r of results) statuses[r.status] = (statuses[r.status] || 0) + 1;
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  const percentile = (p) => (times.length ? times[Math.min(times.length - 1, Math.ceil(times.length * p) - 1)] : 0);
  console.log(JSON.stringify({
    fase: label, requisicoes: results.length, status: statuses,
    p50_ms: Math.round(percentile(0.50)), p95_ms: Math.round(percentile(0.95)),
    rss_MiB: mib(rssBytes(pid)),
    erros: results.filter((r) => r.error).slice(0, 3),
  }));
  return results.filter((r) => typeof r.status === 'number' && r.status >= 400);
}

async function emLotes(lista, tamanho, pid, label) {
  const resultados = [];
  for (let i = 0; i < tamanho; i++) {
    resultados.push(await request(lista[i % lista.length]));
    if ((i + 1) % 25 === 0) await sleep(100);
  }
  return summary(`${label}-${tamanho}`, resultados, pid);
}

let child;
try {
  const br = caminhosBR();
  const us = caminhosUSUrls();
  const brDetalhe = br.filter((u) => /^\/indice\/(?!us\/)[a-z]{2}\/[^/]+\/[^/]+$/.test(u));
  const usDetalhe = us.filter((u) => /^\/indice\/us\/[^/]+\/[^/]+\/[^/]+$/.test(u));
  if (!brDetalhe.length) throw new Error('Não foram encontradas páginas BR publicáveis em data/.');
  if (!usDetalhe.length) throw new Error('Não foram encontradas páginas US publicáveis em data-us/.');

  if (!external) {
    child = spawn(process.execPath, ['server.mjs'], {
      cwd: process.cwd(), env: { ...process.env, PORT: '3197', HOST: '127.0.0.1' },
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    await waitReady();
  } else {
    await fetch(baseUrl + '/indice/metodologia', { signal: AbortSignal.timeout(10000) });
  }
  const pid = child?.pid ?? Number(arg('--pid', '0'));
  if (!pid) throw new Error('Com --no-server, informe também --pid PID para medir RSS do processo.');
  console.log(JSON.stringify({ diagnostico: 'indice-memoria', baseUrl, pid, brUrls: br.length, usUrls: us.length, brDetalhe: brDetalhe.length, usDetalhe: usDetalhe.length, rssInicial_MiB: mib(rssBytes(pid)) }));

  const falhas = [];
  falhas.push(...await emLotes(br.filter((u) => u === '/indice'), 1, pid, 'aquecimento-br-home'));
  falhas.push(...await emLotes(us.filter((u) => u === '/indice/us'), 1, pid, 'aquecimento-us-home'));
  falhas.push(...await emLotes([brDetalhe[0]], 1, pid, 'primeiro-acesso-br-detalhe'));
  falhas.push(...await emLotes([usDetalhe[0]], 1, pid, 'primeiro-acesso-us-detalhe'));
  falhas.push(...await emLotes(brDetalhe, loteBr, pid, 'sequencial-br-detalhes'));
  await sleep(10000);
  console.log(JSON.stringify({ fase: `repouso-10s-apos-br-${loteBr}`, rss_MiB: mib(rssBytes(pid)) }));
  falhas.push(...await emLotes(usDetalhe, loteUs, pid, 'sequencial-us-detalhes'));
  await sleep(10000);
  console.log(JSON.stringify({ fase: `repouso-10s-apos-us-${loteUs}`, rss_MiB: mib(rssBytes(pid)) }));

  const repetidas = Array.from({ length: 100 }, (_, i) => brDetalhe[i % Math.min(10, brDetalhe.length)]);
  falhas.push(...await emLotes(repetidas, 100, pid, 'repeticao-100-br-aquecido'));
  await sleep(10000);
  console.log(JSON.stringify({ fase: 'final-repouso-10s', rss_MiB: mib(rssBytes(pid)), observacao: 'RSS do processo; heap/external exigem instrumentação dentro do processo Node.' }));

  if (falhas.length) {
    console.error(`[diagnose-memory] ${falhas.length} requisição(ões) com status >= 400 — a medição NÃO representa renderização.`);
    console.error(JSON.stringify(falhas.slice(0, 5)));
    process.exitCode = 1;
  }
} catch (error) {
  console.error('[diagnose-memory]', error.stack || error.message);
  process.exitCode = 1;
} finally {
  if (child && !child.killed) child.kill('SIGTERM');
}
