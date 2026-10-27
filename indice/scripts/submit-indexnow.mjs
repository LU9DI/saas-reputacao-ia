// Notifica o IndexNow (Bing, Yandex, Seznam, Naver) sobre URLs do Índice.
//
// O Google NÃO participa do protocolo; para ele o caminho continua sendo o
// sitemap com lastmod real. Uma notificação aceita não prova indexação.
//
// Uso:
//   node scripts/submit-indexnow.mjs              # núcleo: home, metodologia e 27 UFs
//   node scripts/submit-indexnow.mjs --all        # todas as URLs do sitemap, em lotes
//   node scripts/submit-indexnow.mjs --dry-run    # lê o sitemap e mostra o plano, sem POST
//
// Rode depois do deploy, quando as URLs já respondem em produção.

const host = 'filtraai.com';
const key = 'a3d7f1c94b2e6a805d1f7c3b9e4a6d82';
const keyLocation = `https://${host}/${key}.txt`;
const sitemapIndexUrl = `https://${host}/indice/sitemap-index.xml`;
const BASE = `https://${host}/indice`;
const LIMITE_POR_LOTE = 10000;

const args = new Set(process.argv.slice(2));
const todas = args.has('--all');
const dryRun = args.has('--dry-run');

async function texto(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao buscar ${url}: HTTP ${response.status}`);
  return response.text();
}

const indexXml = await texto(sitemapIndexUrl);
const filhos = [...indexXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].replaceAll('&amp;', '&'));
if (!filhos.length) throw new Error('O sitemap do Índice não declarou nenhum sitemap filho.');

const urls = [];
for (const filho of filhos) {
  const xml = await texto(filho);
  urls.push(
    ...[...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
      .map((m) => m[1].replaceAll('&amp;', '&'))
      .filter((url) => {
        try {
          const parsed = new URL(url);
          return parsed.hostname === host && parsed.pathname.startsWith('/indice');
        } catch {
          return false;
        }
      }),
  );
}

const unicas = [...new Set(urls)];
if (!unicas.length) throw new Error('Nenhuma URL do Índice encontrada no sitemap.');

// Núcleo: home, metodologia e uma URL por estado. O restante muda por dados,
// não por conteúdo novo, e entra apenas com --all.
const nucleo = unicas.filter((url) => /^https:\/\/filtraai\.com\/indice(?:\/metodologia|\/[a-z]{2})?$/.test(url));
const alvo = todas ? unicas : nucleo;

if (dryRun) {
  console.log(`IndexNow (dry-run): ${alvo.length} de ${unicas.length} URLs seriam enviadas em ${Math.ceil(alvo.length / LIMITE_POR_LOTE)} lote(s).`);
  process.exit(0);
}

let enviadas = 0;
for (let i = 0; i < alvo.length; i += LIMITE_POR_LOTE) {
  const lote = alvo.slice(i, i + LIMITE_POR_LOTE);
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList: lote }),
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejeitou o lote ${i / LIMITE_POR_LOTE + 1}: HTTP ${response.status} ${await response.text()}`);
  }
  enviadas += lote.length;
  console.log(`IndexNow aceitou ${lote.length} URLs (HTTP ${response.status}).`);
}
console.log(`IndexNow: ${enviadas} URLs do Índice enviadas de ${unicas.length} no sitemap.`);
