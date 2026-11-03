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
 *   node scripts/diagnose-memory.mjs --no-server
 *
 * O modo padrão inicia server.mjs em uma porta isolada (3197), consulta páginas
 * reais geradas a partir de data-us e encerra o processo ao final. Não altera
 * arquivos, banco, Render ou configurações de deploy.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const baseUrl = arg('--base-url', 'http://127.0.0.1:3197').replace(/\/$/, '');
const external = args.includes('--no-server');
const dataDir = path.resolve(process.env.INDICE_US_DATA_DIR || 'data-us');
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
const mib = (n) => n == null || !Number.isFinite(n) ? 'n/a' : (n / 1048576).toFixed(1) + ' MiB';

function buildUrls() {
  const meta = JSON.parse(readFileSync(path.join(dataDir, 'meta.json'), 'utf8'));
  const counties = JSON.parse(readFileSync(path.join(dataDir, 'counties.json'), 'utf8'));
  const countyMap = new Map(counties.map((c) => [c.state + '/' + c.slug, c]));
  const segments = meta.segmentos.map((s) => s.slug);
  const urls = new Set(['/indice/us', '/indice/us/methodology']);
  for (const state of [...new Set(counties.map((c) => c.state))].sort()) {
    const file = path.join(dataDir, 'stats', state + '.json');
    if (!existsSync(file)) continue;
    const stats = JSON.parse(readFileSync(file, 'utf8'));
    const stateSlug = state.toLowerCase();
    let stateHasPage = false;
    for (const [countySlug, bySegment] of Object.entries(stats)) {
      const county = countyMap.get(state + '/' + countySlug);
      if (!county) continue;
      const available = segments.filter((s) => bySegment[s] && bySegment[s].e >= meta.minimoParaIndexar);
      if (!available.length) continue;
      stateHasPage = true;
      urls.add(`/indice/us/${stateSlug}/${countySlug}`);
      for (const segment of available) urls.add(`/indice/us/${stateSlug}/${countySlug}/${segment}`);
    }
    if (stateHasPage) urls.add('/indice/us/' + stateSlug);
  }
  return [...urls];
}

async function request(url) {
  const start = performance.now();
  try {
    const response = await fetch(baseUrl + url, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
    await response.arrayBuffer();
    return { status: response.status, ms: performance.now() - start };
  } catch (error) {
    return { status: 'ERR', ms: performance.now() - start, error: error.message };
  }
}
async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(baseUrl + '/indice/metodologia', { signal: AbortSignal.timeout(2000) });
      if (r.ok || r.status === 404) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error('Servidor não ficou pronto em 60 segundos.');
}
function summary(label, results, pid) {
  const statuses = {};
  for (const r of results) statuses[r.status] = (statuses[r.status] || 0) + 1;
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  const percentile = (p) => times.length ? times[Math.min(times.length - 1, Math.ceil(times.length * p) - 1)] : 0;
  console.log(JSON.stringify({
    fase: label, requisicoes: results.length, status: statuses,
    p50_ms: Math.round(percentile(0.50)), p95_ms: Math.round(percentile(0.95)),
    rss_MiB: mib(rssBytes(pid)),
    erros: results.filter((r) => r.error).slice(0, 5),
  }));
}

let child;
try {
  if (!existsSync(path.join(dataDir, 'meta.json'))) throw new Error('data-us/meta.json não encontrado. Execute na pasta indice.');
  const urls = buildUrls();
  const pages = urls.filter((u) => u.startsWith('/indice/us/') && u !== '/indice/us' && u !== '/indice/us/methodology');
  if (!pages.length) throw new Error('Não foram encontradas páginas US publicáveis em data-us.');
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
  console.log(JSON.stringify({ diagnostico: 'indice-us', baseUrl, pid, urlsDisponiveis: pages.length, rssInicial_MiB: mib(rssBytes(pid)) }));

  summary('aquecimento-home-us', [await request('/indice/us')], pid);
  await sleep(3000);
  summary('primeiro-acesso-detalhe', [await request(pages[0])], pid);
  await sleep(3000);
  for (const count of [100, 500]) {
    const batch = Array.from({ length: count }, (_, i) => pages[i % pages.length]);
    const results = [];
    for (let i = 0; i < batch.length; i++) {
      results.push(await request(batch[i]));
      if ((i + 1) % 25 === 0) await sleep(100);
    }
    summary(`sequencial-${count}-detalhes`, results, pid);
    await sleep(10000);
    console.log(JSON.stringify({ fase: `repouso-10s-apos-${count}`, rss_MiB: mib(rssBytes(pid)) }));
  }
  const repeated = Array.from({ length: 100 }, (_, i) => pages[i % Math.min(10, pages.length)]);
  summary('repeticao-100-das-primeiras-10', await Promise.all(repeated.map(request)), pid);
  await sleep(10000);
  console.log(JSON.stringify({ fase: 'final-repouso-10s', rss_MiB: mib(rssBytes(pid)), observacao: 'RSS do processo; heap/external exigem instrumentação dentro do processo Node.' }));
} catch (error) {
  console.error('[diagnose-memory]', error.stack || error.message);
  process.exitCode = 1;
} finally {
  if (child && !child.killed) child.kill('SIGTERM');
}
