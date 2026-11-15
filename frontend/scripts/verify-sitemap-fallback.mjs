#!/usr/bin/env node
// Verifica a cadeia publicada do /sitemap.xml e do /robots.txt.
//
// Por que existe: em 2026-11-11 o fallback estático servia 97 URLs enquanto o
// primário tinha 107, e o cache interno não era versionado. CI verde não prova
// que a borda está servindo o conjunto íntegro. Este script compara o primário
// (Render), o fallback canônico (Vercel), a borda pública e o host legado.
//
// Uso (não roda no CI: depende da rede e da produção):
//   node scripts/verify-sitemap-fallback.mjs
//   node scripts/verify-sitemap-fallback.mjs --skip-pages
//   node scripts/verify-sitemap-fallback.mjs --edge=https://filtraai.com/sitemap.xml
//
// Sai com código 1 quando qualquer verificação obrigatória falha. Só lê.

const SITE = 'https://filtraai.com';
const arg = (nome, padrao) => {
  const achado = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return achado ? achado.slice(nome.length + 3) : padrao;
};
const flag = (nome) => process.argv.includes(`--${nome}`);

const PRIMARY = arg('primary', 'https://filtra-ai-web-runtime.onrender.com/sitemap.xml');
const FALLBACK = arg('fallback', 'https://saas-reputacao-ia.vercel.app/sitemap.xml');
const EDGE = arg('edge', `${SITE}/sitemap.xml`);
const LEGACY = arg('legacy', 'https://filtra-ai-frontend.filtra-ai.workers.dev/sitemap.xml');
const TIMEOUT_MS = Number(arg('timeout', '20000'));
const CHECAR_PAGINAS = !flag('skip-pages');

// As 10 URLs que o fallback legado não tinha em 2026-11-11.
const PAGINAS_REGRESSAO = [
  '/calculadora-nota-google',
  '/metodologia',
  '/glossario',
  '/sobre',
  '/blog/quanto-custa-gestao-de-reputacao-online',
  '/blog/como-escolher-software-de-gestao-de-reputacao',
  '/blog/panorama-estabelecimentos-ativos-brasil-2026',
  '/planos',
  '/en/blog/ai-review-analysis-guide',
  '/es/blog/analisis-resenas-ia',
];

const falhas = [];
const avisos = [];
const ok = (msg) => console.log(`PASS ${msg}`);
const fail = (msg) => {
  falhas.push(msg);
  console.log(`FAIL ${msg}`);
};
const warn = (msg) => {
  avisos.push(msg);
  console.log(`WARN ${msg}`);
};
const info = (msg) => console.log(`INFO ${msg}`);

async function pegar(url) {
  try {
    const resposta = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/xml,text/xml,text/plain,text/html' },
    });
    return { status: resposta.status, headers: resposta.headers, corpo: await resposta.text(), url };
  } catch (erro) {
    return {
      status: 0,
      headers: new Headers(),
      corpo: '',
      url,
      erro: String(erro?.message ?? erro),
    };
  }
}

const locs = (xml) =>
  [...String(xml).matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((m) => m[1].replaceAll('&amp;', '&').trim());

/** Normaliza para o conjunto canônico: HTTPS, filtraai.com, sem query/hash/zh. */
function normalizar(valor) {
  try {
    const url = new URL(String(valor).trim());
    if (url.protocol !== 'https:' || url.hostname !== 'filtraai.com') return null;
    if (url.search || url.hash) return null;
    const pathname = url.pathname.replace(/\/+$/, '');
    if (pathname === '/zh' || pathname.startsWith('/zh/')) return null;
    return `https://filtraai.com${pathname || '/'}`;
  } catch {
    return null;
  }
}

async function analisarSitemap(nome, url, { obrigatorio }) {
  const resposta = await pegar(url);
  if (resposta.status !== 200) {
    const detalhe = resposta.erro ? ` (${resposta.erro})` : '';
    if (obrigatorio) fail(`${nome}: HTTP ${resposta.status}${detalhe}`);
    else info(`${nome}: HTTP ${resposta.status}${detalhe} (não bloqueante)`);
    return null;
  }
  const tipo = resposta.headers.get('content-type') ?? '';
  if (!/xml/i.test(tipo)) fail(`${nome}: content-type "${tipo || 'ausente'}" (esperado XML)`);

  const brutas = locs(resposta.corpo);
  const validas = new Set();
  let invalidas = 0;
  let zh = 0;
  for (const loc of brutas) {
    if (/\/zh(\/|$)/.test(loc)) {
      zh += 1;
      continue;
    }
    const normalizada = normalizar(loc);
    if (!normalizada) invalidas += 1;
    else validas.add(normalizada);
  }
  const brutasValidas = brutas.reduce(
    (total, loc) => total + (!/\/zh(\/|$)/.test(loc) && normalizar(loc) ? 1 : 0),
    0,
  );
  const duplicadas = brutasValidas - validas.size;

  if (!obrigatorio) {
    info(
      `${nome}: ${brutas.length} brutas, ${validas.size} canônicas, ` +
        `${zh} /zh, ${invalidas} inválidas, ${duplicadas} duplicadas`,
    );
  } else {
    if (brutas.length === 0) fail(`${nome}: nenhum <loc>`);
    if (zh > 0) fail(`${nome}: ${zh} URLs /zh (páginas noindex)`);
    if (invalidas > 0) fail(`${nome}: ${invalidas} URLs fora do host/protocolo canônico ou com query/hash`);
    if (duplicadas > 0) fail(`${nome}: ${duplicadas} URLs duplicadas`);
    if (brutas.length > 0 && zh === 0 && invalidas === 0 && duplicadas === 0) {
      ok(`${nome}: ${validas.size} URLs canônicas, sem /zh, duplicatas ou query`);
    }
  }
  return { nome, url, status: resposta.status, headers: resposta.headers, set: validas, brutas: brutas.length };
}

function comparar(nome, referencia, candidato) {
  if (!referencia || !candidato) return;
  const faltando = [...referencia.set].filter((url) => !candidato.set.has(url));
  const extras = [...candidato.set].filter((url) => !referencia.set.has(url));
  if (faltando.length === 0 && extras.length === 0) {
    ok(`${nome}: conjunto idêntico ao primário (${referencia.set.size} URLs)`);
    return;
  }
  fail(`${nome}: divergente do primário (${faltando.length} ausentes, ${extras.length} extras)`);
  for (const url of faltando.slice(0, 10)) console.log(`  · ausente: ${url}`);
  for (const url of extras.slice(0, 10)) console.log(`  · extra:   ${url}`);
}

function verificarCabecalhos(nome, resposta, urlsEsperadas) {
  const cache = resposta.headers.get('cache-control') ?? '';
  if (!cache.includes('no-store')) fail(`${nome}: cache-control "${cache || 'ausente'}" (esperado no-store)`);

  const versao = resposta.headers.get('x-filtra-seo-version');
  if (versao !== 'v2') fail(`${nome}: x-filtra-seo-version "${versao ?? 'ausente'}" (esperado v2)`);

  const origem = resposta.headers.get('x-filtra-seo-origin');
  if (!['render-primary', 'vercel-fallback'].includes(origem)) {
    fail(`${nome}: x-filtra-seo-origin "${origem ?? 'ausente'}" (esperado render-primary ou vercel-fallback)`);
  }

  const estado = resposta.headers.get('x-filtra-seo-cache');
  if (!['fresh', 'miss', 'stale'].includes(estado)) {
    fail(`${nome}: x-filtra-seo-cache "${estado ?? 'ausente'}"`);
  } else if (estado === 'stale') {
    warn(`${nome}: servindo cache stale (Warning: ${resposta.headers.get('warning') ?? 'ausente'})`);
  }

  const contagemBruta = resposta.headers.get('x-filtra-seo-urls');
  const contagem = contagemBruta === null ? NaN : Number(contagemBruta);
  if (!Number.isFinite(contagem)) {
    fail(`${nome}: x-filtra-seo-urls ausente`);
  } else if (urlsEsperadas !== undefined && contagem !== urlsEsperadas) {
    fail(`${nome}: x-filtra-seo-urls=${contagem}, mas o XML tem ${urlsEsperadas} URLs`);
  } else {
    ok(`${nome}: no-store, versão v2, origem ${origem}, cache ${estado}, ${contagem} URLs`);
  }
}

async function verificarPaginasRegressao() {
  if (!CHECAR_PAGINAS) {
    info('Páginas de regressão: puladas (--skip-pages)');
    return;
  }
  console.log('\n== Páginas que faltavam no fallback legado');
  for (const caminho of PAGINAS_REGRESSAO) {
    const url = `${SITE}${caminho}`;
    const resposta = await pegar(url);
    if (resposta.status !== 200) {
      fail(`${url} → HTTP ${resposta.status}`);
      continue;
    }
    const canonical = resposta.corpo.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const esperado = url.replace(/\/$/, '');
    if (!canonical || canonical.replace(/\/$/, '') !== esperado) {
      fail(`${url}: canonical "${canonical ?? 'ausente'}" (esperado "${esperado}")`);
      continue;
    }
    if (/<meta name="robots" content="[^"]*noindex/i.test(resposta.corpo)) {
      fail(`${url}: está noindex mas aparece no sitemap`);
      continue;
    }
    ok(`${url}: 200, canonical próprio, indexável`);
  }
}

async function verificarRobots() {
  const url = new URL('/robots.txt', EDGE).href;
  console.log(`\n== robots.txt (${url})`);
  const falhasAntes = falhas.length;
  const resposta = await pegar(url);
  if (resposta.status !== 200) {
    fail(`robots.txt → HTTP ${resposta.status}`);
    return;
  }
  const tipo = resposta.headers.get('content-type') ?? '';
  if (!tipo.includes('text/plain')) fail(`robots.txt: content-type "${tipo || 'ausente'}"`);
  if (!/Disallow:\s*\/api\//i.test(resposta.corpo)) fail('robots.txt não bloqueia /api/');
  if (!/Sitemap:\s*https:\/\/filtraai\.com\/sitemap-index\.xml/i.test(resposta.corpo)) {
    fail('robots.txt não declara o índice central');
  }
  const cache = resposta.headers.get('cache-control') ?? '';
  if (!cache.includes('no-store')) fail(`robots.txt: cache-control "${cache || 'ausente'}"`);
  if (resposta.headers.get('x-filtra-seo-version') !== 'v2') {
    fail(`robots.txt: x-filtra-seo-version "${resposta.headers.get('x-filtra-seo-version') ?? 'ausente'}"`);
  }
  if (falhas.length === falhasAntes) ok('robots.txt 200 com índice central, /api/ bloqueado e no-store');
}

// --- Execução ---------------------------------------------------------------

console.log(`Primário: ${PRIMARY}`);
console.log(`Fallback: ${FALLBACK}`);
console.log(`Borda:    ${EDGE}`);
console.log(`Legado:   ${LEGACY}`);

console.log('\n== Sitemaps');
const primario = await analisarSitemap('Primário (Render)', PRIMARY, { obrigatorio: true });
const fallback = await analisarSitemap('Fallback (Vercel)', FALLBACK, { obrigatorio: true });
const borda = await analisarSitemap('Borda pública', EDGE, { obrigatorio: true });
const legado = await analisarSitemap('Host legado (aposentado)', LEGACY, { obrigatorio: false });

console.log('\n== Paridade');
comparar('Fallback', primario, fallback);
comparar('Borda pública', primario, borda);

console.log('\n== Cabeçalhos da borda');
if (borda) verificarCabecalhos('Borda pública', borda, borda.set.size);
if (legado && primario) {
  const ausentes = [...primario.set].filter((url) => !legado.set.has(url));
  info(`Host legado continua com ${ausentes.length} URLs ausentes em relação ao primário (não é servido)`);
}

await verificarRobots();
await verificarPaginasRegressao();

console.log('\n== Resumo');
if (avisos.length) console.log(`Avisos: ${avisos.length}`);
if (falhas.length) {
  console.error(`Verificação FALHOU (${falhas.length} problemas).`);
  process.exit(1);
}
console.log('Verificação aprovada: primário, fallback e borda servem o mesmo conjunto canônico.');
