import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
const sectors = JSON.parse(await readFile(resolve(root, 'data/sectors.json'), 'utf8'));
const intents = JSON.parse(await readFile(resolve(root, 'data/intents.json'), 'utf8'));
const records = JSON.parse(await readFile(resolve(root, 'data/benchmarks.json'), 'utf8'));
const configuredOrigin = process.env.SEO_PROPERTY_ORIGIN?.trim() || '';
let origin = '';
if (configuredOrigin) {
  let parsedOrigin;
  try { parsedOrigin = new URL(configuredOrigin); } catch { throw new Error('SEO_PROPERTY_ORIGIN must be a valid HTTPS origin, e.g. https://example.com'); }
  if (parsedOrigin.protocol !== 'https:' || parsedOrigin.username || parsedOrigin.password || parsedOrigin.pathname !== '/' || parsedOrigin.search || parsedOrigin.hash) {
    throw new Error('SEO_PROPERTY_ORIGIN must be an HTTPS origin without credentials, path, query or fragment');
  }
  origin = parsedOrigin.origin;
}
const MIN_BUSINESSES = 20;
const MIN_REVIEWS = 100;
const SHARD_SIZE = 40000;
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const states = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);
const sectorBySlug = new Map(sectors.map(s => [s.slug, s]));
const validDateOnly = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const validTimestamp = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
};
const validHttpsUrl = value => {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
};
const qualified = record => {
  if (!sectorBySlug.has(record.sector) || !states.has(record.state)) return false;
  if (!Number.isInteger(record.sampleBusinesses) || record.sampleBusinesses < MIN_BUSINESSES) return false;
  if (!Number.isInteger(record.reviewCount) || record.reviewCount < MIN_REVIEWS) return false;
  if (!Number.isFinite(record.averageRating) || record.averageRating < 1 || record.averageRating > 5) return false;
  if (!Number.isFinite(record.responseRate) || record.responseRate < 0 || record.responseRate > 100) return false;
  if (!validDateOnly(record.periodStart) || !validDateOnly(record.periodEnd) || Date.parse(record.periodStart) > Date.parse(record.periodEnd)) return false;
  if (!validTimestamp(record.updatedAt) || typeof record.sourceDescription !== 'string' || !record.sourceDescription.trim() || record.sourceDescription.length > 500 || !validHttpsUrl(record.sourceUrl) || typeof record.sourceLicense !== 'string' || !record.sourceLicense.trim() || record.sourceLicense.length > 100 || typeof record.sourceAttribution !== 'string' || !record.sourceAttribution.trim() || record.sourceAttribution.length > 200 || !validHttpsUrl(record.methodologyUrl)) return false;
  if (!Array.isArray(record.topThemes) || record.topThemes.length === 0 || record.topThemes.length > 8 || record.topThemes.some(t => typeof t !== 'string' || !t.trim() || t.length > 80)) return false;
  return true;
};
const pathFor = record => `/indice/${record.sector}/${record.state.toLowerCase()}/`;
const unique = new Map();
for (const record of records) {
  if (!qualified(record)) continue;
  const path = pathFor(record);
  if (unique.has(path)) throw new Error(`Duplicate benchmark URL: ${path}`);
  unique.set(path, record);
}
if (unique.size > 0 && !origin) {
  throw new Error('SEO_PROPERTY_ORIGIN is required when publishing data-backed pages; refusing placeholder canonical URLs');
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const eligiblePages = [];
for (const [path, record] of unique) {
  const sector = sectorBySlug.get(record.sector);
  const title = `Índice de reputação: ${sector.name} em ${record.state}`;
  const description = `Indicadores agregados de reputação para ${sector.name.toLowerCase()} em ${record.state}, período de ${record.periodStart} a ${record.periodEnd}. Consulte a amostra e a metodologia.`;
  const themes = record.topThemes.map(t => `<li>${esc(t)}</li>`).join('');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(origin+path)}"><meta name="robots" content="index,follow"></head><body><header><a href="/">Índice público de reputação</a></header><main><h1>${esc(title)}</h1><p>Indicadores agregados; não representam todas as empresas do setor nem garantem a experiência de um negócio individual.</p><dl><dt>Nota média agregada</dt><dd>${record.averageRating.toFixed(2)} / 5</dd><dt>Taxa agregada de resposta</dt><dd>${record.responseRate.toFixed(1)}%</dd><dt>Empresas na amostra</dt><dd>${record.sampleBusinesses}</dd><dt>Avaliações analisadas</dt><dd>${record.reviewCount}</dd><dt>Período coberto</dt><dd>${esc(record.periodStart)} a ${esc(record.periodEnd)}</dd></dl><h2>Temas agregados observados</h2><ul>${themes}</ul><h2>Fonte e metodologia</h2><p>${esc(record.sourceDescription)}</p><p>Fonte: <a href="${esc(record.sourceUrl)}" rel="nofollow noopener">${esc(record.sourceAttribution)}</a> (${esc(record.sourceLicense)}).</p><p><a href="${esc(record.methodologyUrl)}">Consultar metodologia e limitações</a></p><p>Última atualização dos dados: <time datetime="${esc(record.updatedAt)}">${esc(record.updatedAt)}</time>.</p></main></body></html>`;
  const file = resolve(output, `.${path}index.html`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  eligiblePages.push({ path, title, sector: record.sector, state: record.state, lastmod: new Date(record.updatedAt).toISOString() });
}
const shards = [];
for (let i=0; i<eligiblePages.length; i+=SHARD_SIZE) {
  const name = `sitemap-${String(shards.length).padStart(3,'0')}.xml`;
  const entries = eligiblePages.slice(i,i+SHARD_SIZE).map(p => `<url><loc>${esc(origin+p.path)}</loc><lastmod>${p.lastmod}</lastmod></url>`);
  await writeFile(resolve(output,name), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
  shards.push(name);
}
const index = shards.map(name => `<sitemap><loc>${esc(origin+'/'+name)}</loc></sitemap>`).join('\n');
await writeFile(resolve(output,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${index}\n</sitemapindex>\n`);
const candidates = [];
for (const sector of sectors) for (const intent of intents) candidates.push({path:`/${sector.slug}/${intent.slug}/`,sector:sector.slug,intent:intent.slug,status:'opportunity-not-published'});
await writeFile(resolve(output,'inventory.json'), JSON.stringify({origin,candidateCount:candidates.length,eligiblePageCount:eligiblePages.length,minBusinesses:MIN_BUSINESSES,minReviews:MIN_REVIEWS,shardSize:SHARD_SIZE,candidates,eligiblePages},null,2)+'\n');
console.log(`Inventory: ${candidates.length} opportunities. Generated ${eligiblePages.length} data-backed pages in ${shards.length} sitemap shard(s).`);
