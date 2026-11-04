#!/usr/bin/env node
// Valida os artefatos de SEO PUBLICADOS (não o código).
//
// Por que existe: CI verde, build verde e testes unitários verdes não provam que
// https://filtraai.com serve o build aprovado. Em 31/10/2026 a produção servia
// um sitemap de um build antigo (97 URLs, sem `lastmod`, com hreflang `zh`),
// enquanto o `main` gerava outro artefato — e nenhum teste percebeu.
//
// Uso (não roda no CI: depende da rede e da produção):
//   node scripts/verify-production-seo.mjs
//   node scripts/verify-production-seo.mjs --samples=20 --skip-twins
//
// Sai com código 1 quando qualquer verificação falha. Só lê; não publica nada.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => {
  const found = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return found ? found.slice(nome.length + 3) : padrao;
};
const BASE = arg('base', 'https://filtraai.com');
const AMOSTRAS = Number(arg('samples', '20'));
const PULAR_GEMEAS = process.argv.includes('--skip-twins');
const SITE = 'https://filtraai.com';

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

async function pegar(url, init) {
  try {
    // Sem timeout explícito, uma resposta de desafio do Cloudflare pode deixar o
    // fetch pendurado e travar o gate inteiro.
    const resposta = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20_000), ...init });
    const corpo = await resposta.text();
    return { status: resposta.status, headers: resposta.headers, corpo };
  } catch (erro) {
    return { status: 0, headers: new Headers(), corpo: '', erro: String(erro?.message ?? erro) };
  }
}

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&'));
const snapshot = JSON.parse(readFileSync(path.join(raiz, 'src/generated/indice-snapshot.json'), 'utf8'));
const shardsEsperados = Math.max(1, Math.ceil(snapshot.urls.total / 10000));

// 1) Índice central -----------------------------------------------------------
console.log(`\n== Índice central (${BASE}/sitemap-index.xml)`);
const indiceCentral = await pegar(`${BASE}/sitemap-index.xml`);
if (indiceCentral.status !== 200) {
  fail(`sitemap-index.xml respondeu ${indiceCentral.status}`);
} else {
  ok(`sitemap-index.xml 200 (${indiceCentral.corpo.length} bytes)`);
  const filhosCentral = locs(indiceCentral.corpo);
  if (/<urlset/.test(indiceCentral.corpo)) fail('sitemap-index.xml deveria ser <sitemapindex>');
  if (!filhosCentral.includes(`${SITE}/sitemap.xml`)) fail('índice central não declara o leaf principal /sitemap.xml');
  for (let id = 0; id < shardsEsperados; id += 1) {
    if (!filhosCentral.includes(`${SITE}/indice/sitemap/${id}.xml`)) fail(`índice central não declara /indice/sitemap/${id}.xml`);
  }
  if (filhosCentral.some((u) => u.includes('/indice/sitemap-index.xml'))) {
    fail('índice central não deve referenciar índice aninhado (/indice/sitemap-index.xml)');
  }
}

// 2) Sitemap principal --------------------------------------------------------
console.log('\n== Sitemap principal (/sitemap.xml)');
const principal = await pegar(`${BASE}/sitemap.xml`);
let urlsPrincipais = [];
if (principal.status !== 200) {
  fail(`/sitemap.xml respondeu ${principal.status}`);
} else {
  const xml = principal.corpo;
  urlsPrincipais = locs(xml);
  ok(`/sitemap.xml 200 com ${urlsPrincipais.length} URLs`);
  if (new Set(urlsPrincipais).size !== urlsPrincipais.length) fail('/sitemap.xml tem URLs duplicadas');
  if (urlsPrincipais.some((u) => u.includes('/indice'))) fail('/sitemap.xml não deve listar URLs do Índice');
  const comLastmod = (xml.match(/<lastmod>/g) ?? []).length;
  if (comLastmod === 0) fail('/sitemap.xml publicado sem nenhum <lastmod> (build antigo?)');
  else ok(`/sitemap.xml com ${comLastmod} <lastmod>`);
  const zh = (xml.match(/hreflang="zh"/g) ?? []).length;
  if (zh > 0) fail(`/sitemap.xml declara ${zh} alternates zh para páginas noindex`);
  else ok('/sitemap.xml sem alternates zh');
  if (!xml.includes('hreflang="x-default"')) fail('/sitemap.xml sem hreflang x-default (o HTML declara x-default)');
  else ok('/sitemap.xml com hreflang x-default');
  for (const obrigatoria of ['/sobre', '/planos', '/metodologia', '/glossario', '/calculadora-nota-google']) {
    if (!urlsPrincipais.some((u) => u === `${SITE}${obrigatoria}`)) fail(`/sitemap.xml não inclui ${obrigatoria}`);
  }
}

// 3) robots.txt ---------------------------------------------------------------
console.log('\n== robots.txt');
const robots = await pegar(`${BASE}/robots.txt`);
if (robots.status !== 200) fail(`/robots.txt respondeu ${robots.status}`);
else {
  if (!robots.corpo.includes(`Sitemap: ${SITE}/sitemap-index.xml`)) fail('robots.txt não declara o índice central');
  else ok('robots.txt declara o índice central');
  if (!/Disallow: \/api\//.test(robots.corpo)) fail('robots.txt não bloqueia /api/');
  // `User-agent` e `User-Agent` são equivalentes (o campo é case-insensitive em
  // robots.txt). Comparar sem caixa evita falso negativo quando o deploy usa
  // `User-Agent:` — o gerador do Next mudou a caixa entre builds.
  const robotsMinusculo = robots.corpo.toLowerCase();
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'Google-Extended', 'CCBot']) {
    if (!robotsMinusculo.includes(`user-agent: ${bot.toLowerCase()}`)) {
      warn(`robots.txt sem grupo explícito para ${bot}`);
    }
  }
}
// 4) Shards do Índice: disponibilidade real (cache não é prova de disponibilidade)
console.log(`\n== Shards do Índice (${AMOSTRAS} requisições consecutivas por shard)`);
const urlsIndice = new Set();
for (let id = 0; id < shardsEsperados; id += 1) {
  const url = `${BASE}/indice/sitemap/${id}.xml`;
  const status = [];
  let ultimo = null;
  for (let n = 0; n < AMOSTRAS; n += 1) {
    // As amostras usam HEAD: provam disponibilidade sem baixar ~1,2 MB por
    // requisição. O corpo é lido uma única vez, na última amostra.
    const ultima = n === AMOSTRAS - 1;
    const resposta = await pegar(url, ultima ? undefined : { method: 'HEAD' });
    status.push(resposta.status);
    if (ultima && resposta.status === 200) ultimo = resposta;
  }
  const ruins = status.filter((s) => s !== 200);
  if (ruins.length) {
    fail(`${url}: ${ruins.length}/${AMOSTRAS} respostas não-200 (${[...new Set(ruins)].join(', ')})`);
    continue;
  }
  ok(`${url}: ${AMOSTRAS}/${AMOSTRAS} respostas 200`);
  const proxiado = ultimo.headers.get('x-indice-proxy') ?? '';
  if (proxiado.includes('cache')) warn(`${url}: servido de cache do Worker (${proxiado}); confirme a origem`);
  // Sonda de origem: o Worker não cacheia requisição com query string, então este
  // é o único jeito confiável de saber se a origem responde. Os cabeçalhos da
  // cópia em cache (`x-indice-upstream-status: 200`, `x-indice-cache: refreshed`)
  // são HISTÓRICOS e não provam saúde — em 31/10/2026 a origem estava em 503
  // enquanto o cache devolvia 200 com x-indice-upstream-status=200.
  const sonda = await pegar(`${url}?probe=${Date.now()}`, { method: 'HEAD' });
  if (sonda.status !== 200) {
    fail(`${url}: origem do Índice não responde (sonda sem cache → ${sonda.status}); o 200 vem apenas de cache`);
  } else {
    ok(`${url}: sonda de origem sem cache → 200`);
  }
  const contentType = ultimo.headers.get('content-type') ?? '';
  if (!contentType.includes('xml')) fail(`${url}: content-type ${contentType || 'ausente'}`);
  const locsShard = locs(ultimo.corpo);
  if (locsShard.length > 10000) fail(`${url}: ${locsShard.length} URLs (limite 10.000)`);
  if (locsShard.some((u) => /[?#]/.test(u))) fail(`${url}: URL com parâmetro ou fragmento`);
  if (locsShard.some((u) => u !== `${SITE}/indice` && u.endsWith('/'))) fail(`${url}: URL com barra final`);
  for (const u of locsShard) urlsIndice.add(u);
  ok(`${url}: ${locsShard.length} URLs, content-type ${contentType}`);
}
if (urlsIndice.size) {
  if (urlsIndice.size !== snapshot.urls.total) {
    fail(`shards acessíveis somam ${urlsIndice.size} URLs; snapshot declara ${snapshot.urls.total}`);
  } else {
    ok(`${urlsIndice.size} URLs nos shards = snapshot.urls.total`);
  }
}

// 5) llms.txt: nenhum link quebrado ------------------------------------------
console.log('\n== llms.txt / llms-full.txt');
for (const arquivo of ['llms.txt', 'llms-full.txt']) {
  const resposta = await pegar(`${BASE}/${arquivo}`);
  if (resposta.status !== 200) {
    fail(`/${arquivo} respondeu ${resposta.status}`);
    continue;
  }
  const limpar = (url) => {
    let limpo = url;
    // Pontuação de fim de frase no texto ("... em https://filtraai.com/planos.")
    // não faz parte da URL; extensões reais (.md, .xml, .txt, .html) são mantidas.
    while (/[.,;:]$/.test(limpo) && !/\.(md|xml|txt|html?)$/.test(limpo)) limpo = limpo.slice(0, -1);
    return limpo;
  };
  const links = [...new Set([...resposta.corpo.matchAll(/https:\/\/filtraai\.com\/[^\s)<>"`]+/g)].map((m) => limpar(m[0])))];
  let quebrados = 0;
  for (const link of links) {
    const alvo = await pegar(link);
    if (alvo.status !== 200) {
      quebrados += 1;
      fail(`/${arquivo} aponta para ${link} → ${alvo.status}`);
    }
  }
  if (!quebrados) ok(`/${arquivo} com ${links.length} links, todos 200`);
}

// 6) Páginas do leaf: status, canonical próprio e noindex indevido ------------
console.log('\n== Páginas do sitemap principal');
let paginasRuins = 0;
const normalizar = (u) => u.replace(/\/$/, '');
for (const url of urlsPrincipais) {
  const pagina = await pegar(url);
  if (pagina.status !== 200) {
    fail(`${url} → ${pagina.status}`);
    paginasRuins += 1;
    continue;
  }
  const canonical = pagina.corpo.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical || normalizar(canonical) !== normalizar(url)) {
    fail(`${url} canonical divergente (${canonical ?? 'ausente'})`);
  }
  if (/<meta name="robots" content="[^"]*noindex/.test(pagina.corpo)) fail(`${url} está noindex mas aparece no sitemap`);
}
if (!paginasRuins) ok(`${urlsPrincipais.length} URLs do sitemap principal responderam 200 com canonical próprio`);

// 6b) Idioma do HTML inicial e política de cache do HTML publicado -----------
// O `<html lang>` precisa estar correto já no HTML que o crawler recebe: o
// script inline do root layout só corrige depois do JavaScript. E o HTML não
// pode sair com `s-maxage=31536000` (padrão do Next para página pré-renderizada),
// porque um cache compartilhado guardaria a versão antiga por um ano.
console.log('\n== Idioma do HTML inicial e cache do HTML');
const IDIOMAS_ESPERADOS = [
  { caminho: '/en', lang: 'en' },
  { caminho: '/es', lang: 'es' },
  { caminho: '/zh', lang: 'zh' },
  { caminho: '/', lang: 'pt-BR' },
];
for (const { caminho, lang } of IDIOMAS_ESPERADOS) {
  const pagina = await pegar(`${BASE}${caminho}`);
  if (pagina.status !== 200) {
    fail(`${caminho} respondeu ${pagina.status}; não foi possível verificar <html lang>`);
    continue;
  }
  const langRecebido = pagina.corpo.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i)?.[1];
  if (langRecebido !== lang) {
    fail(`${caminho} entrega <html lang="${langRecebido ?? 'ausente'}"> no HTML inicial (esperado "${lang}")`);
  } else {
    ok(`${caminho} entrega <html lang="${lang}"> no HTML inicial`);
  }
}
for (const caminho of ['/', '/en', '/es']) {
  const pagina = await pegar(`${BASE}${caminho}`);
  const cache = pagina.headers.get('cache-control') ?? '';
  const anos = Number(cache.match(/s-maxage=(\d+)/)?.[1] ?? 0);
  if (!cache) {
    fail(`${caminho} sem Cache-Control no HTML`);
  } else if (anos > 3600) {
    fail(`${caminho} serve HTML com Cache-Control "${cache}": cache compartilhado longo trava a atualização pós-deploy`);
  } else {
    ok(`${caminho} serve HTML com Cache-Control "${cache}"`);
  }
}
const homeHtml = await pegar(`${BASE}/en`);
const assetEstatico = homeHtml.corpo.match(/\/_next\/static\/[^"']+\.css/)?.[0];
if (!assetEstatico) {
  warn('não foi possível localizar um CSS de /_next/static no HTML de /en');
} else {
  const asset = await pegar(`${BASE}${assetEstatico}`, { method: 'HEAD' });
  const cacheAsset = asset.headers.get('cache-control') ?? '';
  if (!/max-age=31536000/.test(cacheAsset)) {
    fail(`${assetEstatico} deveria manter cache longo imutável; recebido "${cacheAsset}"`);
  } else {
    ok(`${assetEstatico} mantém cache longo imutável ("${cacheAsset}")`);
  }
}

// 7) Gêmeas Markdown (aviso por padrão; erro com --require-twins) -------------
//
// A existência das gêmeas depende do Build Command do host publicar `out/` e rodar
// `generate-markdown-twins.mjs` (que só roda quando há export estático). Sem acesso
// ao painel, o gate não pode consertar isso: ele avisa com a causa e o remédio.
// Com `--require-twins` o aviso vira falha, para a rodada de aceite após o deploy.
const EXIGIR_GEMEAS = process.argv.includes('--require-twins');
if (!PULAR_GEMEAS && urlsPrincipais.length) {
  console.log('\n== Gêmeas Markdown');
  let faltando = 0;
  for (const url of urlsPrincipais) {
    if (normalizar(url) === SITE) continue;
    const resposta = await pegar(`${url}.md`);
    if (resposta.status !== 200 || !(resposta.headers.get('content-type') ?? '').includes('markdown')) {
      faltando += 1;
      if (faltando <= 5) console.log(`  · ${url}.md → ${resposta.status}`);
    }
  }
  if (!faltando) ok('todas as gêmeas .md respondem 200 com text/markdown');
  else if (EXIGIR_GEMEAS) fail(`${faltando} gêmeas .md ausentes ou sem text/markdown (--require-twins)`);
  else {
    warn(
      `${faltando} gêmeas .md ausentes: o Build Command do host precisa ser "npm run build" ` +
        'com CLOUDFLARE_PAGES=1 para gerar out/ e rodar generate-markdown-twins.mjs',
    );
  }
}

// Resumo ----------------------------------------------------------------------
console.log('\n== Resumo');
if (avisos.length) console.log(`Avisos: ${avisos.length}`);
if (falhas.length) {
  console.error(`Verificação de produção FALHOU (${falhas.length} problemas): a produção não serve o artefato esperado.`);
  process.exit(1);
}
console.log('Verificação de produção aprovada: produção servindo os artefatos esperados.');
