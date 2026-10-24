#!/usr/bin/env node
/**
 * Analyze Google Search Console query x page exports for potential URL overlap.
 * Flags are review signals, not proof of SEO cannibalization. Never publishes pages.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const inputPath = arg('--input');
const siteUrl = arg('--site', '');
const startDate = arg('--start-date', '');
const endDate = arg('--end-date', '');
const outputDir = path.resolve(arg('--out', path.join(root, 'reports/seo-aeo-opportunities')));
const minImpressions = Number(arg('--min-impressions', '1'));
if (!inputPath) {
  console.error('Required: --input path/to/query-page-export.csv');
  process.exit(2);
}
if (!siteUrl || !/^https?:\/\//i.test(siteUrl)) {
  console.error('Required: --site https://your-domain/');
  process.exit(2);
}
if (!Number.isInteger(minImpressions) || minImpressions < 1) {
  console.error('--min-impressions must be a positive integer.');
  process.exit(2);
}
const validDate = (value) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)));
if (!validDate(startDate) || !validDate(endDate) || (startDate && endDate && startDate > endDate)) {
  console.error('Dates must be valid YYYY-MM-DD values and start-date must not exceed end-date.');
  process.exit(2);
}
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const detectDelimiter = (line) => {
  let quoted = false, commas = 0, semicolons = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && quoted && line[i + 1] === '"') { i++; continue; }
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch === ',') commas++;
    else if (!quoted && ch === ';') semicolons++;
  }
  return semicolons > commas ? ';' : ',';
};
function parseCsv(text) {
  const delimiter = detectDelimiter(text.split(/\r?\n/, 1)[0] ?? '');
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (quoted) throw new Error('Malformed CSV: unterminated quoted field.');
  if (cell !== '' || row.length) { row.push(cell); if (row.some((value) => value.trim())) rows.push(row); }
  if (rows.length < 2) throw new Error('CSV must contain headers and at least one data row.');
  const headers = rows.shift().map((value) => normalize(value).replace(/ /g, ''));
  return rows.map((values, index) => {
    const object = { __row: index + 2 };
    headers.forEach((header, i) => { object[header] = String(values[i] ?? '').trim(); });
    return object;
  });
}
const pick = (row, aliases) => {
  for (const key of aliases) if (row[key] !== undefined && row[key] !== '') return row[key];
  return '';
};
function number(value, field, rowNo) {
  const cleaned = String(value).replace(/\s/g, '').replace(/%$/, '').replace(/,(?=\d{1,2}$)/, '.');
  const result = Number(cleaned);
  if (!Number.isFinite(result) || result < 0) throw new Error(`Invalid ${field} on CSV row ${rowNo}: ${value}`);
  return result;
}
function canonicalUrl(value) {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
  return url.href;
}
const sourceText = (await readFile(path.resolve(inputPath), 'utf8')).replace(/^\uFEFF/, '');
const rows = parseCsv(sourceText);
const grouped = new Map();
const rejected = [];
const siteOrigin = new URL(siteUrl).origin;
for (const row of rows) {
  const query = pick(row, ['query', 'topqueries', 'principaisconsultas', 'consultasprincipais', 'consultas', 'consulta', 'searchquery']);
  const page = pick(row, ['page', 'pages', 'pagina', 'paginas', 'top pages', 'url', 'landingpage', 'landingpages'].map(normalize).map((value) => value.replace(/ /g, '')));
  if (!query || !page) { rejected.push({ row: row.__row, reason: !query ? 'missing-query' : 'missing-page' }); continue; }
  try {
    const clicks = number(pick(row, ['clicks', 'cliques']), 'clicks', row.__row);
    const impressions = number(pick(row, ['impressions', 'impressoes']), 'impressions', row.__row);
    const positionText = pick(row, ['position', 'averageposition', 'posicao', 'posicaomedia', 'avgposition']);
    const position = positionText ? number(positionText, 'position', row.__row) : null;
    const url = canonicalUrl(page);
    const key = normalize(query);
    if (!key) { rejected.push({ row: row.__row, reason: 'empty-normalized-query' }); continue; }
    const entry = grouped.get(key) ?? { query, normalizedQuery: key, pages: new Map(), sourceRows: [] };
    const pageEntry = entry.pages.get(url) ?? { url, clicks: 0, impressions: 0, weightedPosition: 0, positionWeight: 0, sourceRows: [] };
    pageEntry.clicks += clicks;
    pageEntry.impressions += impressions;
    if (position !== null && impressions > 0) { pageEntry.weightedPosition += position * impressions; pageEntry.positionWeight += impressions; }
    pageEntry.sourceRows.push(row.__row);
    entry.pages.set(url, pageEntry);
    entry.sourceRows.push(row.__row);
    grouped.set(key, entry);
  } catch (error) { rejected.push({ row: row.__row, reason: error.message }); }
}
if (!grouped.size) throw new Error('No valid query/page rows found. Check the CSV headers and metrics.');
const evidence = [...grouped.values()].map((entry) => {
  const pages = [...entry.pages.values()].map((page) => ({
    url: page.url,
    clicks: page.clicks,
    impressions: page.impressions,
    ctrPercent: page.impressions ? Number((page.clicks / page.impressions * 100).toFixed(4)) : 0,
    averagePosition: page.positionWeight ? Number((page.weightedPosition / page.positionWeight).toFixed(3)) : null,
    sourceRows: page.sourceRows,
    flags: [
      ...(new URL(page.url).origin !== siteOrigin ? ['page-origin-does-not-match-site-property'] : []),
      ...(page.impressions < minImpressions ? ['below-minimum-impressions-threshold'] : []),
    ],
  })).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.url.localeCompare(b.url));
  const eligible = pages.filter((page) => page.impressions >= minImpressions && !page.flags.includes('page-origin-does-not-match-site-property'));
  return {
    query: entry.query,
    normalizedQuery: entry.normalizedQuery,
    pages,
    eligiblePageCount: eligible.length,
    totalClicks: pages.reduce((sum, page) => sum + page.clicks, 0),
    totalImpressions: pages.reduce((sum, page) => sum + page.impressions, 0),
    classification: eligible.length > 1 ? 'potential-query-page-overlap-review' : 'no-multi-page-overlap-signal',
    interpretation: eligible.length > 1
      ? 'Multiple URLs received impressions for this normalized query. Review intent, page purpose, dates and SERP evidence before deciding whether cannibalization exists.'
      : 'This export does not show multiple eligible URLs for this query; it does not prove that no cannibalization exists.',
    sourceRows: entry.sourceRows,
    publishAllowed: false,
  };
}).sort((a, b) => (b.classification === 'potential-query-page-overlap-review') - (a.classification === 'potential-query-page-overlap-review') || b.totalImpressions - a.totalImpressions);
const generatedAt = new Date().toISOString();
const report = {
  schemaVersion: 1,
  generatedAt,
  purpose: 'Evidence-based query-to-URL overlap review; flags are not a definitive cannibalization diagnosis.',
  provenance: { source: 'Google Search Console query x page CSV export', siteUrl, siteOrigin, startDate: startDate || null, endDate: endDate || null, inputRows: rows.length, validQueries: evidence.length, rejectedRows: rejected.length, minimumImpressionsPerPage: minImpressions },
  policy: { inferredIntent: false, pageCreated: false, routeCreated: false, publishAllowed: false },
  counts: { queries: evidence.length, potentialOverlapQueries: evidence.filter((item) => item.classification === 'potential-query-page-overlap-review').length, rejectedRows: rejected.length, publishAllowed: 0 },
  rejected,
  evidence,
};
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'query-page-overlap.json'), JSON.stringify(report, null, 2) + '\n');
const columns = ['query','normalizedQuery','classification','eligiblePageCount','totalClicks','totalImpressions','pageUrl','pageClicks','pageImpressions','pageCtrPercent','pageAveragePosition','pageFlags','sourceRows','publishAllowed'];
const csvRows = [columns.join(','), ...evidence.flatMap((item) => item.pages.map((page) => {
  const values = { query: item.query, normalizedQuery: item.normalizedQuery, classification: item.classification, eligiblePageCount: item.eligiblePageCount,
    totalClicks: item.totalClicks, totalImpressions: item.totalImpressions, pageUrl: page.url, pageClicks: page.clicks,
    pageImpressions: page.impressions, pageCtrPercent: page.ctrPercent, pageAveragePosition: page.averagePosition,
    pageFlags: page.flags.join(';'), sourceRows: page.sourceRows.join(';'), publishAllowed: false };
  return columns.map((column) => '"' + String(values[column] ?? '').replace(/"/g, '""') + '"').join(',');
}))];
await writeFile(path.join(outputDir, 'query-page-overlap.csv'), csvRows.join('\n') + '\n');
console.log(JSON.stringify({ ...report.counts, outputDir }, null, 2));
