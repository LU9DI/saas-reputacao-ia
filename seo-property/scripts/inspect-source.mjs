import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, writeFile, mkdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

const sourceArg = process.argv[2];
const month = process.argv[3];
if (!sourceArg || (sourceArg !== '--local-file' && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month || ''))) {
  console.error('Usage: node scripts/inspect-source.mjs <official-download-url|--local-file PATH> YYYY-MM');
  process.exit(2);
}

const isLocal = sourceArg === '--local-file';
function isOfficialMonthlyCsv(url, referenceMonth) {
  if (url.protocol !== 'https:' || url.hostname !== 'dados.mj.gov.br' ||
      url.username || url.password || url.search || url.hash) return false;
  const pathPattern = new RegExp('^/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/[0-9a-f-]{36}/download/basecompleta' + referenceMonth + '\\.csv$');
  return pathPattern.test(url.pathname);
}
const localPath = isLocal ? process.argv[3] : null;
const referenceMonth = isLocal ? process.argv[4] : month;
if (isLocal && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(referenceMonth || '')) {
  console.error('Usage: node scripts/inspect-source.mjs --local-file <path-to-csv> YYYY-MM');
  process.exit(2);
}
const effectiveMonth = isLocal ? referenceMonth : month;
let sourceUrl = null;
let finalUrl = null;
let contentType = isLocal ? 'local file' : '';
let contentLengthHeader = null;
let stream;

if (isLocal) {
  const path = resolve(localPath);
  const info = await stat(path);
  if (!info.isFile()) throw new Error('Local source must be a regular file');
  if (info.size > 2_000_000_000) throw new Error('Resource exceeds 2 GB safety limit');
  contentLengthHeader = String(info.size);
  sourceUrl = `local-file:${basename(path)}`;
  finalUrl = sourceUrl;
  stream = createReadStream(path);
} else {
  let url;
  try { url = new URL(sourceArg); } catch { throw new Error('Invalid source URL'); }
  if (!isOfficialMonthlyCsv(url, month)) {
    throw new Error('Only the exact official Consumidor.gov.br monthly CSV URL for YYYY-MM is allowed');
  }
  sourceUrl = url.toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000), redirect: 'manual' });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) throw new Error('Source redirect did not include a destination');
    const destination = new URL(location, url);
    if (!isOfficialMonthlyCsv(destination, month)) {
      throw new Error('Redirect destination is outside the exact official monthly CSV scope');
    }
    throw new Error('Same-host redirect detected. Re-run using the final official download URL: ' + destination.toString());
  }
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  finalUrl = response.url;
  contentType = response.headers.get('content-type') || '';
  contentLengthHeader = response.headers.get('content-length');
  if (/text\/html/i.test(contentType)) throw new Error('Received HTML, not a CSV resource');
  if (!response.body) throw new Error('Source response has no body');
  stream = response.body;
}

const hash = createHash('sha256');
const decoder = new TextDecoder('utf-8', { fatal: true });
let bytes = 0;
let firstLine = '';
let headerComplete = false;
let headerOverflow = false;
for await (const chunk of stream) {
  const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
  bytes += value.byteLength;
  if (bytes > 2_000_000_000) throw new Error('Resource exceeds 2 GB safety limit');
  hash.update(value);
  if (!headerComplete && !headerOverflow) {
    const text = decoder.decode(value, { stream: true });
    const newline = text.indexOf('\n');
    if (newline >= 0) {
      firstLine += text.slice(0, newline);
      headerComplete = true;
    } else {
      firstLine += text;
      if (firstLine.length > 200_000) headerOverflow = true;
    }
  }
}
if (!headerComplete || headerOverflow) throw new Error('Could not safely identify a bounded CSV header line');
firstLine = firstLine.replace(/^\uFEFF/, '').replace(/\r$/, '');

function countDelimiters(line, delimiter) {
  let quoted = false, count = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (quoted && line[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted && line[i] === delimiter) count++;
  }
  if (quoted) throw new Error('Unclosed quote in header; inspect file encoding/header manually');
  return count;
}
const delimiterCandidates = [';', ',', '\t', '|'].map(delimiter => ({ delimiter, count: countDelimiters(firstLine, delimiter) }));
delimiterCandidates.sort((a, b) => b.count - a.count);
if (delimiterCandidates[0].count < 1 || delimiterCandidates[0].count === delimiterCandidates[1].count) {
  throw new Error('CSV delimiter is ambiguous; refusing to guess');
}
const delimiter = delimiterCandidates[0].delimiter;
const headers = [];
let field = '', quoted = false;
for (let i = 0; i < firstLine.length; i++) {
  const ch = firstLine[i];
  if (ch === '"') {
    if (quoted && firstLine[i + 1] === '"') { field += '"'; i++; }
    else quoted = !quoted;
  } else if (ch === delimiter && !quoted) {
    headers.push(field.trim()); field = '';
  } else field += ch;
}
headers.push(field.trim());
if (headers.some(h => !h) || new Set(headers).size !== headers.length) {
  throw new Error('Header has empty or duplicate column names; refusing schema approval');
}

const report = {
  source: 'Dados Consumidor.gov.br — Ministério da Justiça e Segurança Pública / Senacon',
  sourceUrl,
  finalUrl,
  referenceMonth: effectiveMonth,
  inspectedAt: new Date().toISOString(),
  contentType,
  contentLengthHeader,
  downloadedBytes: bytes,
  sha256: hash.digest('hex'),
  delimiter: delimiter === '\t' ? 'TAB' : delimiter,
  encodingAssumption: 'UTF-8; BOM stripped from header if present',
  headerCount: headers.length,
  headers,
  schemaStatus: 'DISCOVERED_NOT_APPROVED',
  privacy: 'Only header metadata retained. Record values, consumer text, and personal identifiers were not written to disk or logged.'
};
const outDir = resolve(process.env.SEO_SOURCE_INSPECTION_OUTPUT_DIR || resolve(import.meta.dirname, '../artifacts/source-inspection'));
await mkdir(outDir, { recursive: true });
const outPath = resolve(outDir, `consumidor-gov-${effectiveMonth}-header.json`);
await writeFile(outPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ reportPath: outPath, referenceMonth: effectiveMonth, downloadedBytes: bytes, sha256: report.sha256, delimiter: report.delimiter, headerCount: headers.length, headers, schemaStatus: report.schemaStatus }, null, 2));
