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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { anosPublicados, calcularRanking, podePublicar } from './lib/rankings.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const HOST = '127.0.0.1';
const PORT = Number(process.env.INDICE_TEST_PORT || 3101);
const ORIGIN = `http://${HOST}:${PORT}`;
const BASE_PATH = '/indice';
const CANONICAL_BASE = 'https://filtraai.com/indice';
const SERVER_ENTRY = resolve(ROOT, 'server.mjs');
const BUILD_ID = resolve(ROOT, '.next/BUILD_ID');
const DATA_DIR = resolve(process.env.INDICE_DATA_DIR || resolve(ROOT, 'data'));

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
      robotsHeader: response.headers.get('x-robots-tag') || '',
      linkHeader: response.headers.get('link') || '',
      cacheControl: response.headers.get('cache-control') || '',
      body,
    });

    if (!follow || ![301, 302, 303, 307, 308].includes(response.status) || !location) break;
    current = new URL(location, current).toString();
  }

  return { chain, final: chain.at(-1) };
}

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function parseJsonLd(html) {
  const jsonLd = [];
  const invalid = [];
  const matches = [...html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [i, match] of matches.entries()) {
    try {
      jsonLd.push(JSON.parse(match[1]));
    } catch (error) {
      invalid.push(`bloco ${i + 1}: ${error.message}`);
    }
  }
  return { jsonLd, invalid, count: matches.length };
}

function parseHtml(html) {
  const tags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const canonicalTag = tags.find((tag) => /\brel\s*=\s*["']canonical["']/i.test(tag));
  const canonical = canonicalTag?.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;

  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  const robotsTag = metas.find((tag) => /\bname\s*=\s*["']robots["']/i.test(tag));
  const robots = robotsTag?.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;
  const descriptionTag = metas.find((tag) => /\bname\s*=\s*["']description["']/i.test(tag));
  const description = descriptionTag?.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] ?? null;

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => match[1]);
  const lang = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;

  const tables = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map((match) => {
    const table = match[0];
    const caption = table.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i)?.[1] ?? '';
    return {
      caption: decodeEntities(caption.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(),
      hasThead: /<thead\b/i.test(table),
      hasTbody: /<tbody\b/i.test(table),
      hasTfoot: /<tfoot\b/i.test(table),
      colHeaders: [...table.matchAll(/<th\b[^>]*\bscope\s*=\s*["']col["']/gi)].length,
      rowHeaders: [...table.matchAll(/<th\b[^>]*\bscope\s*=\s*["']row["']/gi)].length,
    };
  });

  const text = decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();

  const jsonLd = parseJsonLd(html);
  return {
    canonical,
    robots,
    description,
    title: title ? decodeEntities(title).replace(/\s+/g, ' ').trim() : null,
    h1s: h1s.map((h1) => decodeEntities(h1.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()),
    lang,
    tables,
    text,
    jsonLd: jsonLd.jsonLd,
    jsonLdInvalid: jsonLd.invalid,
    jsonLdCount: jsonLd.count,
  };
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

function canonicalPath(path) {
  return path === '/' ? CANONICAL_BASE : `${CANONICAL_BASE}${path}`;
}

function dataCurta(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}

function dataTime(html) {
  // React 19 emite o atributo como dateTime no HTML estático; em HTML o nome é
  // case-insensitive, então o teste aceita qualquer caixa.
  return html.match(/<time\b[^>]*\bdatetime\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;
}

function competenceLong(ym) {
  const [year, month] = ym.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

function lerJson(relative) {
  return JSON.parse(readFileSync(resolve(DATA_DIR, relative), 'utf8'));
}

function carregarDados() {
  if (!existsSync(resolve(DATA_DIR, 'meta.json'))) {
    console.error(`Dados não encontrados em ${DATA_DIR}. Execute npm run build antes de npm run test:seo.`);
    process.exit(1);
  }
  const meta = lerJson('meta.json');
  const municipios = lerJson('municipios.json');
  const stats = {};
  const statsDir = resolve(DATA_DIR, 'stats');
  for (const file of readdirSync(statsDir).filter((name) => /^[A-Z]{2}\.json$/.test(name)).sort()) {
    stats[file.slice(0, 2)] = lerJson(`stats/${file}`);
  }
  const lastmod = existsSync(resolve(DATA_DIR, 'lastmod.json')) ? lerJson('lastmod.json') : {};
  return { meta, municipios, stats, lastmod };
}

function caminhosEsperados({ meta, municipios, stats }) {
  const porChave = new Map(municipios.map((municipio) => [`${municipio.uf}/${municipio.slug}`, municipio]));
  const minimo = meta.minimoParaIndexar;
  const paths = ['/', '/metodologia', '/rankings/aberturas'];
  for (const uf of Object.keys(stats).sort()) {
    let ufTemPagina = false;
    const municipiosPublicados = [];
    for (const [slug, porSegmento] of Object.entries(stats[uf])) {
      if (!porChave.has(`${uf}/${slug}`)) continue;
      const segmentosPublicados = meta.segmentos
        .map((segmento) => segmento.slug)
        .filter((slugSegmento) => {
          const registro = porSegmento[slugSegmento];
          return registro && Number.isInteger(registro.a) && registro.a >= minimo;
        });
      if (!segmentosPublicados.length) continue;
      ufTemPagina = true;
      municipiosPublicados.push({ slug, segmentosPublicados });
    }
    if (!ufTemPagina) continue;
    const ufMinuscula = uf.toLowerCase();
    paths.push(`/${ufMinuscula}`);
    for (const { slug, segmentosPublicados } of municipiosPublicados) {
      paths.push(`/${ufMinuscula}/${slug}`);
      for (const segmento of segmentosPublicados) paths.push(`/${ufMinuscula}/${slug}/${segmento}`);
    }
  }
  for (const segmento of meta.segmentos) {
    for (const ano of anosPublicados(meta, stats, segmento.slug)) {
      if (podePublicar(calcularRanking(stats, segmento.slug, ano))) {
        paths.push(`/rankings/aberturas/${segmento.slug}/${ano}`);
      }
    }
  }
  return paths;
}

function escolherAmostras({ meta, municipios, stats }) {
  const porChave = new Map(municipios.map((municipio) => [`${municipio.uf}/${municipio.slug}`, municipio]));
  const minimo = meta.minimoParaIndexar;
  const cellsByUF = new Map();
  let abaixoDoMinimo = null;

  for (const uf of Object.keys(stats).sort()) {
    const celulas = [];
    for (const [slug, porSegmento] of Object.entries(stats[uf])) {
      const municipio = porChave.get(`${uf}/${slug}`);
      if (!municipio) continue;
      for (const segmento of meta.segmentos) {
        const registro = porSegmento[segmento.slug];
        if (!registro || !Number.isInteger(registro.a) || registro.a <= 0) continue;
        if (registro.a >= minimo) {
          celulas.push({
            uf,
            municipio: slug,
            municipioNome: municipio.nome,
            segmento: segmento.slug,
            segmentoNome: segmento.nome,
            ativos: registro.a,
            abertos: registro.ab,
            baixas: registro.ba,
            anos: Object.keys(registro.ano || {}).length,
          });
        } else if (!abaixoDoMinimo) {
          abaixoDoMinimo = {
            uf,
            municipio: slug,
            municipioNome: municipio.nome,
            segmento: segmento.slug,
            segmentoNome: segmento.nome,
            ativos: registro.a,
          };
        }
      }
    }
    if (celulas.length) cellsByUF.set(uf, celulas);
  }

  const [ufCampeao, celulasCampeao] = [...cellsByUF.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  )[0];
  const porMunicipio = new Map();
  for (const celula of celulasCampeao) {
    const grupo = porMunicipio.get(celula.municipio) || [];
    grupo.push(celula);
    porMunicipio.set(celula.municipio, grupo);
  }
  const [municipioCampeao, celulasDoMunicipio] = [...porMunicipio.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  )[0];

  return {
    uf: ufCampeao,
    celulas: celulasCampeao,
    municipio: municipioCampeao,
    municipioNome: celulasDoMunicipio[0].municipioNome,
    celulasDoMunicipio,
    celula: celulasDoMunicipio[0],
    outraCelula: celulasDoMunicipio.find((celula) => celula.segmento !== celulasDoMunicipio[0].segmento) || null,
    abaixoDoMinimo,
  };
}

function escolherRankingAmostra({ meta, municipios, stats }) {
  const porChave = new Map(municipios.map((municipio) => [`${municipio.uf}/${municipio.slug}`, municipio.nome]));
  let escolha = null;
  for (const segmento of meta.segmentos) {
    const anos = anosPublicados(meta, stats, segmento.slug).filter((ano) =>
      podePublicar(calcularRanking(stats, segmento.slug, ano)),
    );
    if (!anos.length) continue;
    const ano = anos[0];
    const ranking = calcularRanking(stats, segmento.slug, ano);
    if (!escolha || ranking.total > escolha.ranking.total) {
      escolha = { segmento, ano, ranking };
    }
  }
  return escolha ? { ...escolha, porChave } : null;
}

function todosOsBlocos(meta) {
  return meta.jsonLd.flatMap((bloco) => (Array.isArray(bloco) ? bloco : [bloco]));
}

function conferirCta(nome, body) {
  const bloco = body.match(/<aside class="cta">([\s\S]*?)<\/aside>/i)?.[1] ?? '';
  const texto = decodeEntities(bloco.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  check(
    `${nome}: CTA usa a rota real da auditoria gratuita`,
    bloco.includes('https://filtraai.com/auditoria-gratuita'),
    bloco,
  );
  check(
    `${nome}: CTA não trata o ranking como prova de competição por nota ou avaliações`,
    !/nota|coment[áa]rio|avaliaç/i.test(texto),
    texto,
  );
}

function conferirJsonLd(nome, meta, { esperarFaq = true, temporalEsperado = null } = {}) {
  check(`${nome}: todos os JSON-LD são JSON válido`, meta.jsonLdInvalid.length === 0, meta.jsonLdInvalid.join('; '));
  check(`${nome}: página tem JSON-LD`, meta.jsonLdCount > 0, String(meta.jsonLdCount));

  const blocos = todosOsBlocos(meta);
  check(
    `${nome}: todos os blocos usam schema.org`,
    blocos.length > 0 && blocos.every((bloco) => bloco['@context'] === 'https://schema.org'),
  );
  check(
    `${nome}: não há autor Pessoa inventado`,
    !JSON.stringify(blocos).includes('"@type":"Person"'),
  );

  const datasets = blocos.filter((bloco) => bloco['@type'] === 'Dataset');
  const breadcrumbs = blocos.filter((bloco) => bloco['@type'] === 'BreadcrumbList');
  const faqs = blocos.filter((bloco) => bloco['@type'] === 'FAQPage');

  check(`${nome}: Dataset presente`, datasets.length === 1, String(datasets.length));
  check(`${nome}: BreadcrumbList presente`, breadcrumbs.length === 1, String(breadcrumbs.length));
  if (esperarFaq) {
    check(`${nome}: FAQPage presente`, faqs.length === 1, String(faqs.length));
  } else {
    check(`${nome}: sem FAQPage (diretriz atual de rich results)`, faqs.length === 0, String(faqs.length));
  }

  for (const dataset of datasets) {
    check(`${nome}: Dataset tem nome`, typeof dataset.name === 'string' && dataset.name.length > 10);
    check(
      `${nome}: Dataset usa a data real de geração`,
      dataset.dateModified === META.geradoEm,
      `${dataset.dateModified} != ${META.geradoEm}`,
    );
    check(
      `${nome}: Dataset cobre a janela publicada`,
      dataset.temporalCoverage === (temporalEsperado || `${META.janela.inicio}/${META.competencia}`),
      dataset.temporalCoverage,
    );
    check(
      `${nome}: Dataset é derivado da fonte oficial`,
      typeof dataset.isBasedOn?.url === 'string' && dataset.isBasedOn.url.startsWith('https://www.gov.br/receitafederal/'),
      dataset.isBasedOn?.url,
    );
    check(`${nome}: Dataset tem variável medida`, Array.isArray(dataset.variableMeasured) && dataset.variableMeasured.length > 0);
    check(`${nome}: Dataset está ligado à organização`, dataset.creator?.['@id'] === 'https://filtraai.com/#organization');
    check(`${nome}: Dataset não aponta para onrender.com`, !JSON.stringify(dataset).includes('onrender.com'));
    check(
      `${nome}: Dataset tem cobertura espacial`,
      typeof dataset.spatialCoverage === 'object' && typeof dataset.spatialCoverage.name === 'string' && dataset.spatialCoverage.name.length > 0,
    );
    check(
      `${nome}: Dataset tem técnica de medição`,
      typeof dataset.measurementTechnique === 'string' && /contagem/i.test(dataset.measurementTechnique),
    );
  }

  const breadcrumb = breadcrumbs[0];
  if (breadcrumb) {
    const itens = breadcrumb.itemListElement;
    check(`${nome}: breadcrumb tem itens`, Array.isArray(itens) && itens.length >= 1);
    check(
      `${nome}: breadcrumb numera posições em ordem`,
      Array.isArray(itens) && itens.every((item, index) => item.position === index + 1),
    );
    check(
      `${nome}: breadcrumb usa URLs canônicas`,
      Array.isArray(itens) &&
        itens.every(
          (item) =>
            item.item === 'https://filtraai.com/' ||
            item.item === CANONICAL_BASE ||
            (typeof item.item === 'string' && item.item.startsWith(`${CANONICAL_BASE}/`)),
        ),
    );
    check(
      `${nome}: último breadcrumb é a própria página`,
      Array.isArray(itens) && itens.at(-1)?.item === meta.canonical,
      `${itens?.at(-1)?.item} != ${meta.canonical}`,
    );
  }

  const faq = faqs[0];
  if (faq) {
    const perguntas = faq.mainEntity;
    check(`${nome}: FAQ tem ao menos 3 perguntas`, Array.isArray(perguntas) && perguntas.length >= 3, String(perguntas?.length));
    check(
      `${nome}: FAQ tem perguntas e respostas completas`,
      Array.isArray(perguntas) &&
        perguntas.every(
          (item) =>
            typeof item.name === 'string' &&
            item.name.length > 10 &&
            typeof item.acceptedAnswer?.text === 'string' &&
            item.acceptedAnswer.text.length > 20,
        ),
    );
    for (const pergunta of perguntas || []) {
      check(`${nome}: pergunta do FAQ está visível no HTML`, meta.text.includes(pergunta.name), pergunta.name);
    }
  }
}

function conferirTabelas(nome, meta, { minimo = 1, tfoot = true, denominador = true } = {}) {
  check(`${nome}: tem tabela HTML semântica`, meta.tables.length >= minimo, String(meta.tables.length));
  for (const [indice, tabela] of meta.tables.entries()) {
    check(`${nome}: tabela ${indice + 1} tem caption`, tabela.caption.length > 20, tabela.caption);
    check(`${nome}: tabela ${indice + 1} tem thead`, tabela.hasThead);
    check(`${nome}: tabela ${indice + 1} tem tbody`, tabela.hasTbody);
    check(`${nome}: tabela ${indice + 1} tem cabeçalho de coluna`, tabela.colHeaders >= 2, String(tabela.colHeaders));
    check(`${nome}: tabela ${indice + 1} tem cabeçalho de linha`, tabela.rowHeaders >= 1, String(tabela.rowHeaders));
  }
  if (tfoot) {
    check(`${nome}: tabela principal tem tfoot`, meta.tables.some((tabela) => tabela.hasTfoot));
  }
  if (denominador) {
    check(
      `${nome}: tabela explicita o denominador`,
      meta.tables.some((tabela) => /denominador/i.test(tabela.caption)),
      meta.tables.map((tabela) => tabela.caption).join(' | '),
    );
  }
}

async function conferirPagina(nome, caminho, { minTabelas = 1, tfoot = true, denominador = true, esperarFaq = true, temporal = null } = {}) {
  const url = caminho === '/' ? BASE_PATH : `${BASE_PATH}${caminho}`;
  const page = await request(url);
  const meta = parseHtml(page.final.body);
  const canonical = canonicalPath(caminho);

  checkEqual(`${nome}: status`, page.final.status, 200);
  checkEqual(`${nome}: canonical`, meta.canonical, canonical);
  check(`${nome}: não usa noindex`, !/noindex/i.test(meta.robots || ''), meta.robots);
  check(`${nome}: não expõe onrender.com`, !/onrender\.com/i.test(page.final.body));
  checkEqual(`${nome}: idioma do documento`, meta.lang, 'pt-BR');
  checkEqual(`${nome}: exatamente um h1`, meta.h1s.length, 1);
  check(`${nome}: h1 não está vazio`, (meta.h1s[0] || '').length > 15, meta.h1s[0]);
  check(`${nome}: title presente`, Boolean(meta.title) && meta.title.length >= 20, meta.title);
  check(
    `${nome}: meta description presente e não truncada no HTML`,
    Boolean(meta.description) && meta.description.length >= 50 && meta.description.length <= 170,
    `${meta.description?.length}: ${meta.description}`,
  );

  check(
    `${nome}: exibe fonte e período junto aos dados`,
    /Fonte e período dos dados/.test(meta.text) && meta.text.includes('Receita Federal'),
  );
  check(
    `${nome}: exibe a competência publicada`,
    meta.text.includes(competenceLong(META.competencia)),
    META.competencia,
  );
  check(
    `${nome}: exibe a data de geração real`,
    meta.text.includes(dataCurta(META.geradoEm)) && dataTime(page.final.body) === META.geradoEm,
    `texto=${meta.text.includes(dataCurta(META.geradoEm))}; time=${dataTime(page.final.body)}`,
  );
  check(
    `${nome}: linka a fonte primária oficial`,
    page.final.body.includes('https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/cadastros/cnpj'),
  );
  check(`${nome}: linka a metodologia do Índice`, page.final.body.includes(`href="${BASE_PATH}/metodologia"`));
  check(`${nome}: tem bloco de citação`, meta.text.includes('Como citar esta página') && meta.text.includes(canonical));
  check(`${nome}: não declara medir reputação`, /não mede reputação|não mede a reputação/i.test(meta.text));

  conferirJsonLd(nome, meta, { esperarFaq, temporalEsperado: temporal });
  conferirTabelas(nome, meta, { minimo: minTabelas, tfoot, denominador });

  return { page, meta };
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

if (!existsSync(SERVER_ENTRY)) {
  console.error(`Entrada de produção não encontrada em ${SERVER_ENTRY}.`);
  process.exit(1);
}
if (!existsSync(BUILD_ID)) {
  console.error(`Build não encontrado em ${BUILD_ID}. Execute npm run build antes de npm run test:seo.`);
  process.exit(1);
}

const DADOS = carregarDados();
const META = DADOS.meta;
const LAST_MOD = DADOS.lastmod;
const ESPERADOS = caminhosEsperados(DADOS);
const AMOSTRAS = escolherAmostras(DADOS);
const CONJUNTO_ESPERADO = new Set(ESPERADOS.map(canonicalPath));

const server = spawn(process.execPath, [SERVER_ENTRY], {
  cwd: ROOT,
  env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

server.stdout.on('data', (chunk) => serverLog.push(chunk.toString()));
server.stderr.on('data', (chunk) => serverLog.push(chunk.toString()));

try {
  await waitForServer();

  const root = await conferirPagina('raiz', '/', { minTabelas: 1 });
  const rootHtml = root.page.final.body;
  const rootMeta = root.meta;

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

  check('raiz não usa noindex', !/noindex/i.test(rootMeta.robots || ''), rootMeta.robots);
  check('raiz não expõe onrender.com', !/onrender\.com/i.test(rootHtml));
  check(
    'raiz distingue universo e cobertura',
    rootMeta.text.includes('Ativos no Brasil') &&
      rootMeta.text.includes('Ativos nas páginas') &&
      rootMeta.text.includes('Cobertura'),
  );
  check('raiz linka todos os estados com dados', rootMeta.text.includes('Escolha um estado'));
  check(
    'raiz tem definição independente e como ler',
    rootMeta.text.includes('O que é o Índice Filtra.AI?') && rootMeta.text.includes('Como ler os números'),
  );

  const metodologia = await conferirPagina('metodologia', '/metodologia', { minTabelas: 4, tfoot: false, denominador: false });
  check('metodologia cobre fonte, universo, fórmulas e limites', [
    'Fonte e período dos dados',
    'Universo: segmentos, unidade e geografia',
    'Critérios e fórmulas',
    'Observado, estimado e indisponível',
    'Atualização e revisões',
    'Limitações',
    'Como contestar',
  ].every((secao) => metodologia.meta.text.includes(secao)));
  check('metodologia não promete cobertura de todas as empresas', /não mede[\s\S]*total de empresas|não é o total de empresas/i.test(metodologia.meta.text));
  check('metodologia separa Consumidor.gov.br do Índice', /Consumidor\.gov\.br/.test(metodologia.meta.text) && /universo separado/i.test(metodologia.meta.text));
  check('metodologia informa a frequência de atualização', /mensal/i.test(metodologia.meta.text) && /dia 15/i.test(metodologia.meta.text));

  const metodologiaSlash = await request(`${BASE_PATH}/metodologia/`, { follow: true });
  checkEqual('GET /indice/metodologia/ após redirect', metodologiaSlash.final.status, 200);
  checkEqual('URL final de /indice/metodologia/', new URL(metodologiaSlash.final.url).pathname, `${BASE_PATH}/metodologia`);

  check('amostra tem estado', Boolean(AMOSTRAS.uf), JSON.stringify(AMOSTRAS));
  check('amostra tem município', Boolean(AMOSTRAS.municipio), JSON.stringify(AMOSTRAS));
  check('amostra tem célula', Boolean(AMOSTRAS.celula), JSON.stringify(AMOSTRAS));
  check('amostra tem célula abaixo do mínimo', Boolean(AMOSTRAS.abaixoDoMinimo), JSON.stringify(AMOSTRAS.abaixoDoMinimo));

  const estado = await conferirPagina(`estado ${AMOSTRAS.uf}`, `/${AMOSTRAS.uf.toLowerCase()}`, { minTabelas: 2 });
  check('estado lista todos os municípios com página', /Todos os municípios/.test(estado.meta.text));
  check('estado explica que o total não é o total de empresas', /não é o total de empresas|Não\. O Índice cobre apenas/i.test(estado.meta.text));

  const municipio = await conferirPagina(
    `município ${AMOSTRAS.municipioNome}`,
    `/${AMOSTRAS.uf.toLowerCase()}/${AMOSTRAS.municipio}`,
    { minTabelas: 1 },
  );
  check('município detalha matrizes, aberturas e baixas', ['Matrizes', 'Abertos em 12 meses', 'Baixas em 12 meses'].every((rotulo) => municipio.meta.text.includes(rotulo)));
  check('município explica denominador e não-saldo', /denominador/i.test(municipio.meta.text) && /não é um saldo|não formam um saldo/i.test(municipio.meta.text));

  const caminhoCelula = `/${AMOSTRAS.uf.toLowerCase()}/${AMOSTRAS.celula.municipio}/${AMOSTRAS.celula.segmento}`;
  const celula = await conferirPagina(`célula ${AMOSTRAS.celula.segmento}`, caminhoCelula, { minTabelas: 2 });
  check('célula informa a contagem no h1', celula.meta.h1s[0].includes(String(AMOSTRAS.celula.ativos.toLocaleString('pt-BR'))), celula.meta.h1s[0]);
  check('célula explicita estoque versus aberturas', /não é o estoque ativo|Não é o estoque ativo/i.test(celula.meta.text));
  check('célula separa matrizes e filiais', /matrizes e .* filiais/i.test(celula.meta.text));
  check('célula não trata correlação como causalidade', /não mede|não significa|não formam um saldo/i.test(celula.meta.text));

  if (AMOSTRAS.outraCelula) {
    const outra = await conferirPagina(
      `segunda célula ${AMOSTRAS.outraCelula.segmento}`,
      `/${AMOSTRAS.uf.toLowerCase()}/${AMOSTRAS.outraCelula.municipio}/${AMOSTRAS.outraCelula.segmento}`,
      { minTabelas: 1 },
    );
    check('segunda célula amostrada é coerente', outra.meta.h1s[0].includes('estabelecimentos ativos'));
  }

  // Rankings de aberturas por ano.
  const rankingAmostra = escolherRankingAmostra(DADOS);
  check('amostra de ranking existe', Boolean(rankingAmostra), 'nenhum segmento com ranking publicável');
  if (rankingAmostra) {
    const { segmento, ano, ranking, porChave } = rankingAmostra;
    const caminhoRanking = `/rankings/aberturas/${segmento.slug}/${ano}`;
    const numero = (x) => x.toLocaleString('pt-BR');
    const rk = await conferirPagina(`ranking ${segmento.slug} ${ano}`, caminhoRanking, {
      minTabelas: 2,
      esperarFaq: false,
      temporal: `${ano}-01/${ano}-12`,
    });

    const lider = ranking.ordenado[0];
    const nomeLider = porChave.get(`${lider.uf}/${lider.municipio}`) ?? lider.municipio;
    const lead = rk.page.final.body.match(/<p class="lead">([\s\S]*?)<\/p>/i)?.[1] ?? '';
    const leadTexto = decodeEntities(lead.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    check('ranking abre com o resultado principal calculado', leadTexto.includes(`${nomeLider} (${lider.uf})`), leadTexto);
    check(
      'resposta direta usa números consistentes com os dados',
      leadTexto.includes(numero(lider.v)) && leadTexto.includes(numero(ranking.total)) && leadTexto.includes(String(ano)),
      leadTexto,
    );
    check(
      'resposta direta cita competência e data de referência',
      leadTexto.includes(dataCurta(META.geradoEm)) && leadTexto.includes(META.competencia),
      leadTexto,
    );
    check('tabela do top 10 lista o líder calculado', rk.meta.text.includes(nomeLider));
    check('ranking separa abertura de estoque ativo', /não é o estoque ativo|não é saldo líquido/i.test(rk.meta.text));
    conferirCta(`CTA do ranking ${segmento.slug} ${ano}`, rk.page.final.body);

    const anoCompetencia = META.competencia.slice(0, 4);
    if (Number(anoCompetencia) > ano) {
      const parcial = await request(`${BASE_PATH}/rankings/aberturas/${segmento.slug}/${anoCompetencia}`);
      checkEqual(`ranking do ano parcial ${anoCompetencia} responde 404`, parcial.final.status, 404);
      check(
        'ranking do ano parcial não está no sitemap',
        !CONJUNTO_ESPERADO.has(canonicalPath(`/rankings/aberturas/${segmento.slug}/${anoCompetencia}`)),
      );
    }
    const segInvalido = await request(`${BASE_PATH}/rankings/aberturas/nao-existe/${ano}`);
    checkEqual('ranking de segmento inválido responde 404', segInvalido.final.status, 404);
    check(
      'ranking de segmento inválido não está no sitemap',
      !CONJUNTO_ESPERADO.has(canonicalPath(`/rankings/aberturas/nao-existe/${ano}`)),
    );

    const mdRanking = await request(`${BASE_PATH}/md${caminhoRanking}`);
    checkEqual('GET /indice/md/ranking status', mdRanking.final.status, 200);
    check(
      'gêmea do ranking aponta a fonte canônica',
      mdRanking.final.body.startsWith(`> Fonte canônica: ${canonicalPath(caminhoRanking)} `),
      mdRanking.final.body.slice(0, 120),
    );
    check('gêmea do ranking é noindex', /noindex/i.test(mdRanking.final.robotsHeader), mdRanking.final.robotsHeader);
    check('gêmea do ranking traz a resposta direta', mdRanking.final.body.includes(numero(lider.v)));

    const hub = await conferirPagina('hub de rankings', '/rankings/aberturas', { minTabelas: 1, tfoot: false, denominador: false, esperarFaq: false });
    check('hub lista o ranking amostrado', hub.page.final.body.includes(caminhoRanking));
    check('hub explica anos fechados e parciais', /fechado/i.test(hub.meta.text) && /parcial/i.test(hub.meta.text));
    conferirCta('CTA do hub de rankings', hub.page.final.body);

    const mdHub = await request(`${BASE_PATH}/md/rankings/aberturas`);
    checkEqual('GET /indice/md/rankings/aberturas status', mdHub.final.status, 200);
    check('gêmea do hub de rankings é noindex', /noindex/i.test(mdHub.final.robotsHeader), mdHub.final.robotsHeader);

    check('home descobre os rankings', rootHtml.includes('/rankings/aberturas'));
    check('célula linka o ranking nacional de aberturas', celula.page.final.body.includes('/rankings/aberturas/'));
  }

  const abaixo = AMOSTRAS.abaixoDoMinimo;
  if (abaixo) {
    const caminhoAbaixo = `/${abaixo.uf.toLowerCase()}/${abaixo.municipio}/${abaixo.segmento}`;
    const page = await request(`${BASE_PATH}${caminhoAbaixo}`);
    const meta = parseHtml(page.final.body);
    checkEqual('célula abaixo do mínimo responde 404', page.final.status, 404);
    check(
      'célula abaixo do mínimo não é indexável',
      (!meta.robots || /noindex/i.test(meta.robots)) && (!page.final.robotsHeader || /noindex/i.test(page.final.robotsHeader)),
      `robots=${meta.robots}; header=${page.final.robotsHeader}`,
    );
    check('404 abaixo do mínimo explica a ausência', /não encontrada|não existe/i.test(meta.text));
    check(
      '404 abaixo do mínimo não é cacheável',
      /no-store/i.test(page.final.cacheControl) && !/s-maxage/.test(page.final.cacheControl),
      page.final.cacheControl,
    );
    check(
      'célula abaixo do mínimo não está no sitemap',
      !CONJUNTO_ESPERADO.has(canonicalPath(caminhoAbaixo)),
      caminhoAbaixo,
    );
  }

  const sitemapIndex = await request(`${BASE_PATH}/sitemap-index.xml`);
  const sitemapIndexXml = sitemapIndex.final.body;
  checkEqual('GET /indice/sitemap-index.xml status', sitemapIndex.final.status, 200);
  check('sitemap index é XML', sitemapIndex.final.contentType.includes('xml'), sitemapIndex.final.contentType);
  check('sitemap index usa o namespace do protocolo', sitemapIndexXml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
  check('sitemap index fecha corretamente', sitemapIndexXml.trim().endsWith('</sitemapindex>'));
  check('sitemap index contém o filho 0', sitemapIndexXml.includes(`<loc>${CANONICAL_BASE}/sitemap/0.xml</loc>`));
  check('sitemap index não expõe onrender.com', !/onrender\.com/i.test(sitemapIndexXml));

  const filhos = sitemapLocs(sitemapIndexXml);
  check('sitemap index tem filhos', filhos.length > 0, String(filhos.length));
  check('sitemap index não repete filhos', new Set(filhos).size === filhos.length);
  check('todos os filhos do sitemap estão sob /indice', filhos.every((url) => url.startsWith(`${CANONICAL_BASE}/sitemap/`)));

  const todasAsLocs = [];
  for (const filho of filhos) {
    const caminhoFilho = new URL(filho).pathname;
    const child = await request(caminhoFilho);
    const childXml = child.final.body;
    checkEqual(`GET ${caminhoFilho} status`, child.final.status, 200);
    check(`${caminhoFilho} é XML`, child.final.contentType.includes('xml'), child.final.contentType);
    check(`${caminhoFilho} usa o namespace do protocolo`, childXml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
    check(`${caminhoFilho} fecha corretamente`, childXml.trim().endsWith('</urlset>'));
    check(`${caminhoFilho} não expõe onrender.com`, !/onrender\.com/i.test(childXml));
    const locsFilho = sitemapLocs(childXml);
    const lastmodsFilho = [...childXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/gi)].map((match) => match[1]);
    check(`${caminhoFilho} tem URLs`, locsFilho.length > 0);
    check(`${caminhoFilho} tem lastmod em todas as URLs`, lastmodsFilho.length === locsFilho.length, `${lastmodsFilho.length}/${locsFilho.length}`);
    const dataGeracao = META.geradoEm.slice(0, 10);
    for (const [indiceUrl, loc] of locsFilho.entries()) {
      const lastmod = lastmodsFilho[indiceUrl];
      const caminho = loc.replace(CANONICAL_BASE, '') || '/';
      const entrada = LAST_MOD[caminho];
      const dataEsperada = entrada ? entrada.split('|')[1] : dataGeracao;
      check(
        `${caminhoFilho} lastmod de ${caminho} segue lastmod.json (ou a data de geração)`,
        Boolean(lastmod) && lastmod.startsWith(dataEsperada),
        `${lastmod} != ${dataEsperada}`,
      );
      check(
        `${caminhoFilho} lastmod de ${caminho} não é futuro`,
        Boolean(lastmod) && lastmod.slice(0, 10) <= dataGeracao,
        lastmod,
      );
      if (caminho.startsWith('/rankings/')) {
        check(`${caminhoFilho} lastmod de ${caminho} tem entrada própria em lastmod.json`, Boolean(entrada), caminho);
      }
    }
    todasAsLocs.push(...locsFilho);
  }

  const conjuntoLocs = new Set(todasAsLocs);
  check('sitemap não tem duplicatas', conjuntoLocs.size === todasAsLocs.length, `${todasAsLocs.length} URLs`);
  check(
    'sitemap não tem raiz com barra final',
    !conjuntoLocs.has(`${CANONICAL_BASE}/`),
  );
  check('sitemap tem raiz canônica sem barra final', conjuntoLocs.has(CANONICAL_BASE));
  check('sitemap tem a metodologia', conjuntoLocs.has(`${CANONICAL_BASE}/metodologia`));
  check(
    'todas as URLs do sitemap estão sob /indice',
    todasAsLocs.every((url) => url === CANONICAL_BASE || url.startsWith(`${CANONICAL_BASE}/`)),
  );
  check(
    'sitemap cobre exatamente as URLs indexáveis',
    conjuntoLocs.size === CONJUNTO_ESPERADO.size && [...CONJUNTO_ESPERADO].every((url) => conjuntoLocs.has(url)),
    `${conjuntoLocs.size} no sitemap, ${CONJUNTO_ESPERADO.size} esperadas`,
  );
  check(
    'sitemap inclui a célula amostrada',
    conjuntoLocs.has(canonicalPath(caminhoCelula)),
    caminhoCelula,
  );
  check(
    'sitemap inclui o estado e o município amostrados',
    conjuntoLocs.has(canonicalPath(`/${AMOSTRAS.uf.toLowerCase()}`)) &&
      conjuntoLocs.has(canonicalPath(`/${AMOSTRAS.uf.toLowerCase()}/${AMOSTRAS.municipio}`)),
  );

  // GEO/AEO: arquivos para agentes e gêmeas em Markdown.
  const llms = await request(`${BASE_PATH}/llms.txt`);
  checkEqual('GET /indice/llms.txt status', llms.final.status, 200);
  check('llms.txt é texto', llms.final.contentType.includes('text/plain'), llms.final.contentType);
  check('llms.txt aponta a home do Índice', llms.final.body.includes(CANONICAL_BASE));
  check(
    'llms.txt inclui a fonte primária',
    llms.final.body.includes('https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/cadastros/cnpj'),
  );
  check('llms.txt delimita o que não mede', /não mede reputação/i.test(llms.final.body));
  check('llms.txt não promete indexação', /não promete indexação/i.test(llms.final.body));
  check('llms.txt lista as gêmeas em Markdown', llms.final.body.includes(`${CANONICAL_BASE}/md`));
  check('llms.txt lista os rankings de aberturas', llms.final.body.includes(`${CANONICAL_BASE}/rankings/aberturas`));

  const llmsFull = await request(`${BASE_PATH}/llms-full.txt`);
  checkEqual('GET /indice/llms-full.txt status', llmsFull.final.status, 200);
  check('llms-full.txt é texto', llmsFull.final.contentType.includes('text/plain'), llmsFull.final.contentType);
  check('llms-full.txt traz a metodologia resumida', /Metodologia resumida/.test(llmsFull.final.body));
  check('llms-full.txt traz o bloco de citação', /Como citar/.test(llmsFull.final.body));

  const mdHome = await request(`${BASE_PATH}/md`);
  checkEqual('GET /indice/md status', mdHome.final.status, 200);
  check('gêmea da home é text/markdown', mdHome.final.contentType.includes('text/markdown'), mdHome.final.contentType);
  check(
    'gêmea da home declara o canonical via Link',
    /rel="canonical"/.test(mdHome.final.linkHeader) && mdHome.final.linkHeader.includes(`<${CANONICAL_BASE}>`),
    mdHome.final.linkHeader,
  );
  check('gêmea da home é noindex', /noindex/i.test(mdHome.final.robotsHeader), mdHome.final.robotsHeader);
  check('gêmea da home tem H1', /^# .+/m.test(mdHome.final.body));
  check('gêmea da home não tem HTML', !/<(div|script|nav)[\s>]/i.test(mdHome.final.body));

  const mdUf = await request(`${BASE_PATH}/md/${AMOSTRAS.uf.toLowerCase()}`);
  checkEqual('GET /indice/md/<uf> status', mdUf.final.status, 200);
  check('gêmea do estado traz o recorte', /# Estabelecimentos ativos por segmento em/.test(mdUf.final.body));

  const mdCelula = await request(`${BASE_PATH}/md${caminhoCelula}`);
  checkEqual('GET /indice/md/<célula> status', mdCelula.final.status, 200);
  check(
    'gêmea da célula aponta a fonte canônica',
    mdCelula.final.body.startsWith(`> Fonte canônica: ${canonicalPath(caminhoCelula)} `),
    mdCelula.final.body.slice(0, 120),
  );

  const ufInvalida = await request(`${BASE_PATH}/xx`);
  checkEqual('rota de UF inválida responde 404', ufInvalida.final.status, 404);
  check(
    '404 de UF inválida não é cacheável',
    /no-store/i.test(ufInvalida.final.cacheControl) && !/s-maxage/.test(ufInvalida.final.cacheControl),
    ufInvalida.final.cacheControl,
  );

  const mdAusente = await request(`${BASE_PATH}/md/zz/nao-existe`);
  checkEqual('gêmea de rota inexistente responde 404', mdAusente.final.status, 404);
  check(
    'sitemap não lista gêmeas em Markdown',
    ![...conjuntoLocs].some((url) => url.endsWith('.md') || url.includes('/md/')),
  );

  console.log(`\nDados: competência ${META.competencia}, ${ESPERADOS.length} URLs indexáveis, ${conjuntoLocs.size} no sitemap.`);
} catch (error) {
  fail('execução do teste', error instanceof Error ? error.message : String(error));
} finally {
  await stopServer();
}

if (failures.length) {
  console.error(`\n${failures.length} verificação(ões) falharam.`);
  process.exitCode = 1;
} else {
  console.log('\nTodas as verificações de canonical, conteúdo, JSON-LD, tabelas, 404 e sitemap passaram.');
}
