#!/usr/bin/env node
/**
 * Import Google Search Console query exports into a review-only evidence queue.
 * It never changes publishAllowed and never creates pages.
 *
 * Usage:
 *   node scripts/import-seo-demand-evidence.mjs --input /path/queries.csv --site https://example.com/ --start-date 2026-09-01 --end-date 2026-09-30
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(name);
  return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '') : fallback;
};
const inputPath = arg('--input');
const outputDir = path.resolve(arg('--out', path.join(root, 'reports/seo-aeo-opportunities')));
const siteUrl = arg('--site', '');
const startDate = arg('--start-date', '');
const endDate = arg('--end-date', '');
const sourceLabel = arg('--source', 'Google Search Console CSV export');
const candidatesPath = arg('--candidates', path.join(root, 'reports/seo-aeo-opportunities/opportunities.json'));
if (!inputPath) {
  console.error('Required: --input path/to/search-console-queries.csv');
  process.exit(2);
}
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
if ((startDate && !validDate(startDate)) || (endDate && !validDate(endDate)) || (startDate && endDate && startDate > endDate)) {
  console.error('Dates must be valid YYYY-MM-DD values and start-date must not exceed end-date.');
  process.exit(2);
}
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const detectDelimiter = (text) => {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  let quoted = false, commas = 0, semicolons = 0;
  for (let i = 0; i < firstLine.length; i++) {
    const ch = firstLine[i];
    if (ch === '"' && quoted && firstLine[i + 1] === '"') { i++; continue; }
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch === ',') commas++;
    else if (!quoted && ch === ';') semicolons++;
  }
  return semicolons > commas ? ';' : ',';
};
const parseCsv = (text) => {
  const delimiter = detectDelimiter(text);
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
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (quoted) throw new Error('Malformed CSV: unterminated quoted field.');
  if (cell !== '' || row.length) { row.push(cell); if (row.some((v) => v.trim() !== '')) rows.push(row); }
  if (rows.length < 2) throw new Error('CSV must contain a header and at least one data row.');
  const headers = rows.shift().map((h) => normalize(h).replace(/ /g, ''));
  return rows.map((values, index) => {
    const obj = {};
    headers.forEach((header, i) => { obj[header] = String(values[i] ?? '').trim(); });
    obj.__row = index + 2;
    return obj;
  });
};
const pick = (row, aliases) => {
  for (const key of aliases) if (row[key] !== undefined && row[key] !== '') return row[key];
  return '';
};
const number = (value, field, rowNo) => {
  const cleaned = String(value).replace(/\s/g, '').replace(/%$/, '').replace(/,(?=\d{1,2}$)/, '.');
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${field} value on CSV row ${rowNo}: ${value}`);
  return n;
};
const raw = await readFile(path.resolve(inputPath), 'utf8');
const rows = parseCsv(raw.replace(/^\uFEFF/, ''));
const aggregated = new Map();
const rejected = [];
for (const row of rows) {
  const query = pick(row, ['query', 'topqueries', 'principaisconsultas', 'consultasprincipais', 'consultas', 'consulta', 'searchquery']);
  if (!query) { rejected.push({ row: row.__row, reason: 'missing-query' }); continue; }
  try {
    const clicks = number(pick(row, ['clicks', 'cliques']), 'clicks', row.__row);
    const impressions = number(pick(row, ['impressions', 'impressoes']), 'impressions', row.__row);
    const ctrText = pick(row, ['ctr', 'clickthroughrate']);
    const positionText = pick(row, ['position', 'averageposition', 'posicao', 'posicaomedia', 'avgposition']);
    const position = positionText ? number(positionText, 'position', row.__row) : null;
    // GSC UI CSVs usually render CTR as percent. A bare value is interpreted as percent.
    const ctrPercent = ctrText ? number(ctrText, 'ctr', row.__row) : (impressions ? clicks / impressions * 100 : 0);
    const key = normalize(query);
    const existing = aggregated.get(key) ?? { query, normalizedQuery: key, clicks: 0, impressions: 0, weightedPosition: 0, positionWeight: 0, sourceRows: [] };
    existing.clicks += clicks;
    existing.impressions += impressions;
    if (position !== null && impressions > 0) { existing.weightedPosition += position * impressions; existing.positionWeight += impressions; }
    existing.sourceRows.push(row.__row);
    // Recompute CTR from totals below; raw CTR is not averaged because that would distort duplicate rows.
    aggregated.set(key, existing);
  } catch (error) {
    rejected.push({ row: row.__row, reason: error.message });
  }
}
if (!aggregated.size) throw new Error('No valid query rows found. Check CSV headers and metric columns.');
let candidates = [];
try {
  const parsed = JSON.parse(await readFile(path.resolve(candidatesPath), 'utf8'));
  candidates = Array.isArray(parsed.candidates) ? parsed.candidates : [];
} catch { /* Evidence import remains useful before candidate generation. */ }
const candidateByQuery = new Map();
for (const candidate of candidates) {
  const key = normalize(candidate.queryHypothesis);
  if (!key) continue;
  const owners = candidateByQuery.get(key) ?? [];
  owners.push(candidate.id);
  candidateByQuery.set(key, owners);
}
const importedAt = new Date().toISOString();
const evidence = [...aggregated.values()].map((item) => {
  const ctrPercent = item.impressions ? item.clicks / item.impressions * 100 : 0;
  const avgPosition = item.positionWeight ? item.weightedPosition / item.positionWeight : null;
  const exactMatches = candidateByQuery.get(item.normalizedQuery) ?? [];
  const evidenceId = createHash('sha256').update([siteUrl, startDate, endDate, item.normalizedQuery, sourceLabel].join('|')).digest('hex').slice(0, 20);
  const flags = [];
  if (!siteUrl) flags.push('site-property-not-specified');
  if (!startDate || !endDate) flags.push('date-window-not-fully-specified');
  if (item.impressions === 0) flags.push('no-impression-evidence');
  if (exactMatches.length > 1) flags.push('ambiguous-exact-candidate-match');
  if (exactMatches.length === 0) flags.push('manual-intent-mapping-required');
  return {
    evidenceId,
    query: item.query,
    normalizedQuery: item.normalizedQuery,
    siteUrl: siteUrl || null,
    source: sourceLabel,
    importedAt,
    dateRange: { startDate: startDate || null, endDate: endDate || null },
    metrics: { clicks: item.clicks, impressions: item.impressions, ctrPercent: Number(ctrPercent.toFixed(4)), averagePosition: avgPosition === null ? null : Number(avgPosition.toFixed(4)) },
    evidenceQuality: item.impressions > 0 ? 'observed-search-console-impressions' : 'observed-query-row-no-impressions',
    exactCandidateMatchIds: exactMatches,
    status: 'evidence-imported-review-required',
    publishAllowed: false,
    sourceCsvRows: item.sourceRows,
    flags,
  };
});
const report = {
  schemaVersion: 1,
  generatedAt: importedAt,
  purpose: 'Observed demand evidence queue only; no publication, indexing, or candidate approval is authorized.',
  provenance: { source: sourceLabel, siteUrl: siteUrl || null, dateRange: { startDate: startDate || null, endDate: endDate || null }, inputFileName: path.basename(path.resolve(inputPath)) },
  counts: { inputRows: rows.length, validUniqueQueries: evidence.length, rejectedRows: rejected.length, exactCandidateMatches: evidence.filter((x) => x.exactCandidateMatchIds.length === 1).length, unmatchedQueries: evidence.filter((x) => x.exactCandidateMatchIds.length === 0).length, publishAllowed: 0 },
  rejectedRows: rejected,
  evidence,
};
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'demand-evidence.json'), JSON.stringify(report, null, 2) + '\n');
const csvColumns = ['evidenceId','query','siteUrl','source','importedAt','startDate','endDate','clicks','impressions','ctrPercent','averagePosition','exactCandidateMatchIds','status','publishAllowed','flags','sourceCsvRows'];
const csvCell = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
const outputCsv = [csvColumns.join(','), ...evidence.map((e) => {
  const flat = { ...e, startDate: e.dateRange.startDate, endDate: e.dateRange.endDate, ...e.metrics, exactCandidateMatchIds: e.exactCandidateMatchIds.join(';'), flags: e.flags.join(';'), sourceCsvRows: e.sourceCsvRows.join(';') };
  return csvColumns.map((key) => csvCell(flat[key])).join(',');
})].join('\n') + '\n';
await writeFile(path.join(outputDir, 'demand-evidence.csv'), outputCsv);
console.log(JSON.stringify({ ...report.counts, outputDir, publicationAuthorized: false }, null, 2));
