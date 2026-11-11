#!/usr/bin/env node

/**
 * Analisa a exportação "Indexação → Páginas" do Google Search Console.
 *
 * Não acessa o GSC e não estima indexação. Lê o CSV exportado, separa cada
 * motivo informado pelo Google, conta por tipo de URL, mostra exemplos e,
 * opcionalmente, cruza com o sitemap para achar conflitos.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { classifyPage, detectDelimiter, parseCsv } from './gsc-export.mjs';

const URL_KEYS = ['url', 'pagina', 'pages', 'page', 'endereco'];
const STATUS_KEYS = ['status', 'situacao', 'indexacao', 'indexing'];
const REASON_KEYS = ['reason', 'motivo', 'cobertura', 'coverage', 'tipo de exclusao', 'exclusion reason'];
const CRAWL_KEYS = ['last crawled', 'ultimo rastreamento', 'last crawl', 'ultima rastreabilidade'];

const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

function findKey(headers, aliases) {
  for (const [index, header] of headers.entries()) {
    if (aliases.includes(normalize(header))) return index;
  }
  return -1;
}

const REASON_RULES = [
  { key: 'indexed', label: 'Indexada', re: /^(indexed|indexada)\b/ },
  { key: 'discovered_not_indexed', label: 'Descoberta, atualmente não indexada', re: /descoberta.*nao indexada|discovered.*not indexed/ },
  { key: 'crawled_not_indexed', label: 'Rastreada, atualmente não indexada', re: /rastreada.*nao indexada|crawled.*not indexed/ },
  { key: 'duplicate_google_canonical', label: 'Duplicada: Google escolheu canonical diferente', re: /duplicada.*google.*canonical|duplicate.*google chose different canonical/ },
  { key: 'duplicate_no_user_canonical', label: 'Duplicada sem canonical selecionada pelo usuário', re: /duplicada.*sem canonical|duplicate without user-selected canonical/ },
  { key: 'duplicate_submitted_not_canonical', label: 'Duplicada: URL enviada não selecionada como canonical', re: /duplicada.*enviada.*nao selecionada|submitted url not selected as canonical/ },
  { key: 'alternate_canonical', label: 'Página alternativa com canonical adequada', re: /pagina alternativa.*canonical|alternate page with proper canonical/ },
  { key: 'soft_404', label: 'Soft 404', re: /soft 404/ },
  { key: 'not_found_404', label: 'Não encontrada (404)', re: /nao encontrada.*404|not found.*404/ },
  { key: 'server_error_5xx', label: 'Erro de servidor (5xx)', re: /erro de servidor|server error.*5xx/ },
  { key: 'redirect_error', label: 'Erro de redirecionamento', re: /erro de redirecionamento|redirect error/ },
  { key: 'page_with_redirect', label: 'Página com redirecionamento', re: /pagina com redirecionamento|page with redirect/ },
  { key: 'blocked_robots', label: 'Bloqueada pelo robots.txt', re: /bloqueada.*robots|blocked by robots/ },
  { key: 'noindex', label: 'Excluída por noindex', re: /noindex|no index/ },
  { key: 'indexed_blocked_robots', label: 'Indexada, embora bloqueada por robots.txt', re: /indexada.*robots|indexed.*blocked by robots/ },
  { key: 'unauthorized_401', label: 'Não autorizada (401)', re: /401|nao autorizada/ },
  { key: 'forbidden_403', label: 'Acesso proibido (403)', re: /403|proibida|forbidden/ },
  { key: 'other_4xx', label: 'Outro erro 4xx', re: /outro.*4xx|other 4xx/ },
  { key: 'excluded_other', label: 'Excluída por outro motivo', re: /excluida|excluded/ },
];

/** Motivo canônico sem agrupar motivos diferentes. Desconhecidos viram `outro:<texto>`. */
export function classifyReason(raw) {
  const text = normalize(raw);
  if (!text) return { key: 'sem_motivo', label: 'Sem motivo informado' };
  for (const rule of REASON_RULES) {
    if (rule.re.test(text)) return { key: rule.key, label: rule.label };
  }
  return { key: `outro:${text}`, label: String(raw).trim() };
}

export function classifyStatus(raw, reasonKey) {
  const text = normalize(raw);
  if (/^not indexed|nao indexada|excluida/.test(text)) return 'not_indexed';
  if (/^indexed|indexada/.test(text)) return 'indexed';
  if (reasonKey === 'indexed') return 'indexed';
  if (reasonKey && reasonKey !== 'sem_motivo') return 'not_indexed';
  return 'unknown';
}

function geoOf(url) {
  const type = classifyPage(url);
  const path = new URL(url, 'https://filtraai.com').pathname.replace(/^\/indice(?=\/|$)/, '') || '/';
  const p = path.split('/').filter(Boolean);
  if (type.startsWith('us_')) {
    return { country: 'US', uf: p[1] ? p[1].toUpperCase() : null, segment: type === 'us_segmento' ? p[3] : null };
  }
  if (type.startsWith('indice_')) {
    if (type === 'indice_ranking_uf') return { country: 'BR', uf: p[3]?.toUpperCase() ?? null, segment: p[2] ?? null };
    if (type === 'indice_ranking_nacional' || type === 'indice_ranking_aberturas_ano') return { country: 'BR', uf: null, segment: p[2] ?? null };
    if (type === 'indice_segmento') return { country: 'BR', uf: p[0]?.toUpperCase() ?? null, segment: p[2] ?? null };
    if (type === 'indice_municipio' || type === 'indice_uf') return { country: 'BR', uf: p[0]?.toUpperCase() ?? null, segment: null };
    return { country: 'BR', uf: null, segment: null };
  }
  return { country: 'site', uf: null, segment: null };
}

/**
 * Lê a exportação de indexação.
 * Aceita cabeçalhos em PT/EN, BOM/CRLF e separadores , ; ou tab.
 */
export function parseIndexingCsv(text) {
  const clean = String(text).replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(clean);
  const table = parseCsv(clean, delimiter);
  if (table.length < 2) return { rows: [], skipped: 0, delimiter };
  const headerIndex = table.slice(0, 5).findIndex((row) => findKey(row, URL_KEYS) >= 0);
  if (headerIndex < 0) throw new Error('CSV sem coluna de URL/Página');
  const headers = table[headerIndex];
  const urlIndex = findKey(headers, URL_KEYS);
  const statusIndex = findKey(headers, STATUS_KEYS);
  const reasonIndex = findKey(headers, REASON_KEYS);
  const crawlIndex = findKey(headers, CRAWL_KEYS);
  if (urlIndex < 0) throw new Error('CSV sem coluna de URL/Página');
  const rows = [];
  let skipped = 0;
  for (const cells of table.slice(headerIndex + 1)) {
    const url = (cells[urlIndex] || '').trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      skipped += 1;
      continue;
    }
    const rawReason = reasonIndex >= 0 ? cells[reasonIndex] : '';
    const reason = classifyReason(rawReason);
    const status = classifyStatus(statusIndex >= 0 ? cells[statusIndex] : '', reason.key);
    rows.push({
      url,
      status,
      reasonKey: reason.key,
      reasonLabel: reason.label,
      lastCrawled: crawlIndex >= 0 ? (cells[crawlIndex] || '').trim() : null,
    });
  }
  return { rows, skipped, delimiter };
}

const HIGH_VALUE = new Set([
  'indice_home', 'indice_metodologia', 'indice_rankings_ativos_hub', 'indice_rankings_aberturas_hub',
  'indice_ranking_nacional', 'indice_ranking_uf', 'indice_ranking_aberturas_ano',
  'indice_uf', 'indice_municipio', 'us_home', 'us_metodologia', 'us_estado', 'us_condado',
]);

function suggestPriority(row, inSitemap) {
  if (!inSitemap) return 'P3';
  if (['server_error_5xx', 'soft_404', 'not_found_404', 'redirect_error', 'blocked_robots', 'noindex'].includes(row.reasonKey)) return 'P0';
  if (['duplicate_google_canonical', 'duplicate_no_user_canonical', 'duplicate_submitted_not_canonical', 'alternate_canonical', 'crawled_not_indexed'].includes(row.reasonKey)) return 'P1';
  if (row.reasonKey === 'discovered_not_indexed') return HIGH_VALUE.has(classifyPage(row.url)) ? 'P1' : 'P2';
  return 'P2';
}

/**
 * Agrupa exclusões preservando cada motivo. Percentuais usam apenas as linhas
 * classificadas como não indexadas; linhas indexadas ficam fora do denominador.
 */
export function summarizeIndexing(rows, { sitemapUrls = null, examples = 5 } = {}) {
  const indexed = rows.filter((row) => row.status === 'indexed');
  const unknown = rows.filter((row) => row.status === 'unknown');
  const notIndexed = rows.filter((row) => row.status === 'not_indexed');
  const sitemap = sitemapUrls ? new Set([...sitemapUrls].map((url) => url.trim())) : null;
  const byReason = new Map();
  const byType = new Map();
  const byCountry = new Map();
  const byUf = new Map();
  const bySegment = new Map();
  const byPriority = new Map();
  let notIndexedInSitemap = 0;
  let notIndexedOutsideSitemap = 0;
  const inSitemapByUrl = new Map();
  for (const row of rows) {
    const type = classifyPage(row.url);
    const geo = geoOf(row.url);
    const inSitemap = sitemap ? sitemap.has(row.url) : null;
    inSitemapByUrl.set(row.url, inSitemap);
    byType.set(type, (byType.get(type) || 0) + 1);
    byCountry.set(geo.country, (byCountry.get(geo.country) || 0) + 1);
    if (row.status === 'not_indexed') {
      if (inSitemap === true) notIndexedInSitemap += 1;
      if (inSitemap === false) notIndexedOutsideSitemap += 1;
      if (geo.uf) byUf.set(`${geo.country}:${geo.uf}`, (byUf.get(`${geo.country}:${geo.uf}`) || 0) + 1);
      if (geo.segment) bySegment.set(geo.segment, (bySegment.get(geo.segment) || 0) + 1);
      const priority = suggestPriority(row, inSitemap !== false);
      byPriority.set(priority, (byPriority.get(priority) || 0) + 1);
      const current = byReason.get(row.reasonKey) || {
        key: row.reasonKey,
        label: row.reasonLabel,
        count: 0,
        examples: [],
        types: {},
        countries: {},
        priority: {},
      };
      current.count += 1;
      if (current.examples.length < examples) current.examples.push(row.url);
      current.types[type] = (current.types[type] || 0) + 1;
      current.countries[geo.country] = (current.countries[geo.country] || 0) + 1;
      current.priority[priority] = (current.priority[priority] || 0) + 1;
      byReason.set(row.reasonKey, current);
    }
  }
  const reasons = [...byReason.values()]
    .map((item) => ({
      ...item,
      percent: notIndexed.length ? (item.count / notIndexed.length) * 100 : 0,
      examples: sitemap ? item.examples.map((url) => ({ url, inSitemap: inSitemapByUrl.get(url) })) : item.examples,
    }))
    .sort((a, b) => b.count - a.count);
  let sitemapSeen = null;
  let sitemapMissing = null;
  let sitemapMissingByType = null;
  if (sitemap) {
    const gscUrls = new Set(rows.map((row) => row.url));
    sitemapSeen = [...sitemap].filter((url) => gscUrls.has(url)).length;
    const missing = [...sitemap].filter((url) => !gscUrls.has(url));
    sitemapMissing = missing.length;
    sitemapMissingByType = {};
    for (const url of missing) {
      const type = classifyPage(url);
      sitemapMissingByType[type] = (sitemapMissingByType[type] || 0) + 1;
    }
  }
  return {
    totalRows: rows.length,
    indexed: indexed.length,
    notIndexed: notIndexed.length,
    unknown: unknown.length,
    reasons,
    byType: [...byType.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    byCountry: [...byCountry.entries()].map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
    byUf: [...byUf.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    bySegment: [...bySegment.entries()].map(([segment, count]) => ({ segment, count })).sort((a, b) => b.count - a.count),
    byPriority: [...byPriority.entries()].map(([priority, count]) => ({ priority, count })).sort((a, b) => a.priority.localeCompare(b.priority)),
    sitemap: sitemap ? { total: sitemap.size, seenInGsc: sitemapSeen, missingFromGsc: sitemapMissing, missingByType: sitemapMissingByType, notIndexedInSitemap, notIndexedOutsideSitemap } : null,
    rows,
  };
}

const pct = (value) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
const num = (value) => value.toLocaleString('pt-BR');

export function formatIndexingMarkdown(summary, { file = '', period = 'período do arquivo', examples = 5 } = {}) {
  const lines = [
    `# GSC — indexação por motivo (${period})`,
    '',
    `Arquivo: ${file || 'não informado'} · Linhas: ${num(summary.totalRows)} · Indexadas: ${num(summary.indexed)} · Não indexadas: ${num(summary.notIndexed)} · Status desconhecido: ${num(summary.unknown)}`,
    '',
    '## Motivos de exclusão (sem agrupamento)',
    '',
    '| Motivo | URLs | % do não indexado | Prioridade sugerida | Exemplos |',
    '|---|---:|---:|---|---|',
    ...summary.reasons.map((reason) => {
      const priority = Object.entries(reason.priority).map(([key, value]) => `${key} (${num(value)})`).join(', ');
      const ex = reason.examples.map((item) => (typeof item === 'string' ? item : item.url)).slice(0, examples).join('<br>');
      return `| ${reason.label} | ${num(reason.count)} | ${pct(reason.percent)} | ${priority || '—'} | ${ex || '—'} |`;
    }),
    '',
    '## Distribuição por país',
    '',
    '| País | URLs |',
    '|---|---:|',
    ...summary.byCountry.map((row) => `| ${row.country} | ${num(row.count)} |`),
    '',
    '## Distribuição por tipo de página',
    '',
    '| Tipo | URLs |',
    '|---|---:|',
    ...summary.byType.map((row) => `| ${row.type} | ${num(row.count)} |`),
    '',
  ];
  if (summary.sitemap) {
    lines.push(
      '## Cruzamento com o sitemap',
      '',
      `Sitemap: ${num(summary.sitemap.total)} URLs · presentes no GSC: ${num(summary.sitemap.seenInGsc)} · ausentes do GSC: ${num(summary.sitemap.missingFromGsc)} · não indexadas no sitemap: ${num(summary.sitemap.notIndexedInSitemap)} · não indexadas fora do sitemap: ${num(summary.sitemap.notIndexedOutsideSitemap)}`,
      '',
      '| Tipo de URL ausente do GSC | URLs |',
      '|---|---:|',
      ...Object.entries(summary.sitemap.missingByType).map(([type, count]) => `| ${type} | ${num(count)} |`),
      '',
    );
  }
  lines.push(
    '## Prioridades sugeridas',
    '',
    '| Prioridade | URLs |',
    '|---|---:|',
    ...summary.byPriority.map((row) => `| ${row.priority} | ${num(row.count)} |`),
    '',
    'As prioridades são sugestões determinísticas por motivo e presença no sitemap; não são uma medição de impacto. Os números vêm do arquivo exportado e não provam recuperação de indexação.',
  );
  return lines.join('\n');
}

async function loadSitemapUrls(source) {
  const read = async (target) => {
    if (/^https?:\/\//i.test(target)) {
      const response = await fetch(target, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; FiltraAudit/1.0)' } });
      if (!response.ok) throw new Error(`Sitemap ${target} respondeu ${response.status}`);
      return response.text();
    }
    return readFileSync(target, 'utf8');
  };
  const xml = await read(source);
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1]);
  if (/<sitemapindex\b/i.test(xml)) {
    const children = [];
    for (const child of locs.slice(0, 20)) {
      const childXml = await read(child);
      children.push(...[...childXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1]));
    }
    return new Set(children);
  }
  return new Set(locs);
}

function parseArgs(argv) {
  const args = { format: 'md', examples: 5 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--file') { args.file = value; i += 1; }
    else if (arg === '--sitemap') { args.sitemap = value; i += 1; }
    else if (arg === '--format') { args.format = value; i += 1; }
    else if (arg === '--period') { args.period = value; i += 1; }
    else if (arg === '--out') { args.out = value; i += 1; }
    else if (arg === '--examples') { args.examples = Number(value); i += 1; }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    console.error('Uso: node scripts/gsc-indexing.mjs --file indexing.csv [--sitemap URL|arquivo] [--format md|json] [--period "..."]');
    process.exit(1);
  }
  const parsed = parseIndexingCsv(readFileSync(args.file, 'utf8'));
  const sitemapUrls = args.sitemap ? await loadSitemapUrls(args.sitemap) : null;
  const summary = summarizeIndexing(parsed.rows, { sitemapUrls, examples: args.examples });
  const output = args.format === 'json'
    ? JSON.stringify({ ...summary, skipped: parsed.skipped, period: args.period || null }, null, 2)
    : formatIndexingMarkdown(summary, { file: args.file, period: args.period, examples: args.examples });
  if (args.out) writeFileSync(args.out, output);
  else console.log(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
