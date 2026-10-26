#!/usr/bin/env node

/**
 * Integration checks for the public URL contract of the Filtra.AI index.
 *
 * Run after `npm run build`:
 *   npm run test:seo
 *
 * The test starts the production server on a local port and checks the real
 * HTTP responses and HTML, not source strings. It does not touch production.
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = resolve(import.meta.dirname, '..');
const HOST = '127.0.0.1';
const PORT = Number(process.env.INDICE_TEST_PORT || 3101);
const ORIGIN = `http://${HOST}:${PORT}`;
const BASE_PATH = '/indice';
const CANONICAL_BASE = 'https://filtraai.com/indice';
const NEXT_BIN = resolve(ROOT, 'node_modules/next/dist/bin/next');
const BUILD_ID = resolve(ROOT, '.next/BUILD_ID');

const failures = [];
const serverLog = [];

function pass(name) {
  console.log(`PASS ${name}`);
}

function fail(name, detail) {
  const message = detail ? `${name}: ${detail}` : name;
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function check(name, condition, detail) {
  if (condition) pass(name);
  else fail(name, detail);
}

function checkEqual(name, actual, expected) {
  check(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function requestUrl(path) {
  return new URL(path, ORIGIN).toString();
}

async function request(path, { method = 'GET', follow = false } = {}) {
  let current = requestUrl(path);
  const chain = [];

  for (let i = 0; i < 6; i += 1) {
    const response = await fetch(current, {
      method,
      redirect: 'manual',
      headers: { 'user-agent': 'FiltraIndiceSeoTest/1.0' },
    });
    const body = method === 'HEAD' ? '' : await response.text();
    const location = response.headers.get('location');
    chain.push({
      url: current,
      status: response.status,
      location,
      contentType: response.headers.get('content-type') || '',
      body,
    });

    if (!follow || ![301, 302, 303, 307, 308].includes(response.status) || !location) break;
    current = new URL(location, current).toString();
  }

  return { chain, final: chain.at(-1) };
}

function parseHtml(html) {
  const tags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const canonicalTag = tags.find((tag) => /\brel\s*=\s*["']canonical["']/i.test(tag));
  const canonical = canonicalTag?.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;

  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  const robotsTag = metas.find((tag) => /\bname\s*=\s*["']robots["']/i.test(tag));
  const robots = robotsTag?.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;

  return { canonical, robots };
}

function localPath(location, fromUrl) {
  if (!location) return null;
  try {
    const url = new URL(location, fromUrl);
    return url.origin === ORIGIN ? url.pathname : url.toString();
  } catch {
    return location;
  }
}

function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`next start exited with code ${server.exitCode}\n${serverLog.join('')}`);
    }

    try {
      const response = await fetch(requestUrl(BASE_PATH), { redirect: 'manual' });
      if (response.status === 200) return;
    } catch {
      // Server is still starting.
    }

    await sleep(500);
  }

  throw new Error(`next start did not become ready at ${ORIGIN}${BASE_PATH}\n${serverLog.join('')}`);
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }

  server.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    sleep(3_000),
  ]);
  if (server.exitCode === null) server.kill('SIGKILL');
}

if (!existsSync(NEXT_BIN)) {
  console.error(`next não encontrado em ${NEXT_BIN}. Execute npm ci.`);
  process.exit(1);
}
if (!existsSync(BUILD_ID)) {
  console.error(`Build não encontrado em ${BUILD_ID}. Execute npm run build antes de npm run test:seo.`);
  process.exit(1);
}

const server = spawn(process.execPath, [NEXT_BIN, 'start', '-H', HOST, '-p', String(PORT)], {
  cwd: ROOT,
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

server.stdout.on('data', (chunk) => serverLog.push(chunk.toString()));
server.stderr.on('data', (chunk) => serverLog.push(chunk.toString()));

try {
  await waitForServer();

  const root = await request(BASE_PATH);
  const rootHtml = root.final.body;
  const rootMeta = parseHtml(rootHtml);

  checkEqual('GET /indice status', root.final.status, 200);
  checkEqual('canonical da raiz', rootMeta.canonical, CANONICAL_BASE);
  check('raiz não usa noindex', !/noindex/i.test(rootMeta.robots || ''), rootMeta.robots);
  check('raiz não expõe onrender.com', !/onrender\.com/i.test(rootHtml));

  const rootHead = await request(BASE_PATH, { method: 'HEAD' });
  checkEqual('HEAD /indice status', rootHead.final.status, 200);

  const slash = await request(`${BASE_PATH}/`);
  checkEqual('GET /indice/ status', slash.final.status, 308);
  checkEqual('Location de /indice/', localPath(slash.final.location, slash.final.url), BASE_PATH);

  const slashFollow = await request(`${BASE_PATH}/`, { follow: true });
  checkEqual('GET /indice/ após redirect', slashFollow.final.status, 200);
  checkEqual('URL final de /indice/', new URL(slashFollow.final.url).pathname, BASE_PATH);
  checkEqual('canonical após redirect de /indice/', parseHtml(slashFollow.final.body).canonical, CANONICAL_BASE);

  const slashHead = await request(`${BASE_PATH}/`, { method: 'HEAD' });
  checkEqual('HEAD /indice/ status', slashHead.final.status, 308);
  checkEqual('Location de HEAD /indice/', localPath(slashHead.final.location, slashHead.final.url), BASE_PATH);

  const metodologia = await request(`${BASE_PATH}/metodologia`);
  const metodologiaMeta = parseHtml(metodologia.final.body);
  checkEqual('GET /indice/metodologia status', metodologia.final.status, 200);
  checkEqual('canonical de /indice/metodologia', metodologiaMeta.canonical, `${CANONICAL_BASE}/metodologia`);
  check('metodologia não usa noindex', !/noindex/i.test(metodologiaMeta.robots || ''), metodologiaMeta.robots);

  const metodologiaSlash = await request(`${BASE_PATH}/metodologia/`, { follow: true });
  checkEqual('GET /indice/metodologia/ após redirect', metodologiaSlash.final.status, 200);
  checkEqual('URL final de /indice/metodologia/', new URL(metodologiaSlash.final.url).pathname, `${BASE_PATH}/metodologia`);

  const geographicPaths = [
    `${BASE_PATH}/go/itaberai/clinicas`,
    `${BASE_PATH}/pr/alto-parana/restaurantes`,
    `${BASE_PATH}/sp/presidente-prudente/oficinas`,
  ];

  for (const path of geographicPaths) {
    const page = await request(path);
    const meta = parseHtml(page.final.body);
    checkEqual(`GET ${path} status`, page.final.status, 200);
    checkEqual(`canonical de ${path}`, meta.canonical, `https://filtraai.com${path}`);
    check(`${path} não usa noindex`, !/noindex/i.test(meta.robots || ''), meta.robots);
    check(`${path} não expõe onrender.com`, !/onrender\.com/i.test(page.final.body));
  }

  const sitemapIndex = await request(`${BASE_PATH}/sitemap-index.xml`);
  const sitemapIndexXml = sitemapIndex.final.body;
  checkEqual('GET /indice/sitemap-index.xml status', sitemapIndex.final.status, 200);
  check('sitemap index é XML', sitemapIndex.final.contentType.includes('xml'), sitemapIndex.final.contentType);
  check('sitemap index usa o namespace do protocolo', sitemapIndexXml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
  check('sitemap index fecha corretamente', sitemapIndexXml.trim().endsWith('</sitemapindex>'));
  check('sitemap index contém o filho 0', sitemapIndexXml.includes(`<loc>${CANONICAL_BASE}/sitemap/0.xml</loc>`));
  check('sitemap index não expõe onrender.com', !/onrender\.com/i.test(sitemapIndexXml));

  const sitemapChild = await request(`${BASE_PATH}/sitemap/0.xml`);
  const sitemapChildXml = sitemapChild.final.body;
  const locs = sitemapLocs(sitemapChildXml);
  checkEqual('GET /indice/sitemap/0.xml status', sitemapChild.final.status, 200);
  check('sitemap filho é XML', sitemapChild.final.contentType.includes('xml'), sitemapChild.final.contentType);
  check('sitemap filho usa o namespace do protocolo', sitemapChildXml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
  check('sitemap filho fecha corretamente', sitemapChildXml.trim().endsWith('</urlset>'));
  check('sitemap filho tem URLs', locs.length > 0, String(locs.length));
  check('sitemap filho não tem raiz com barra final', !locs.includes(`${CANONICAL_BASE}/`));
  check('sitemap filho tem raiz canônica sem barra final', locs.includes(CANONICAL_BASE));
  check('sitemap filho não tem duplicatas', new Set(locs).size === locs.length);
  check(
    'todas as URLs do sitemap estão sob /indice',
    locs.every((url) => url === CANONICAL_BASE || url.startsWith(`${CANONICAL_BASE}/`)),
  );
  check('sitemap filho não expõe onrender.com', !/onrender\.com/i.test(sitemapChildXml));
} catch (error) {
  fail('execução do teste', error instanceof Error ? error.message : String(error));
} finally {
  await stopServer();
}

if (failures.length) {
  console.error(`\n${failures.length} verificação(ões) falharam.`);
  process.exitCode = 1;
} else {
  console.log('\nTodas as verificações de canonical, redirect e sitemap passaram.');
}
