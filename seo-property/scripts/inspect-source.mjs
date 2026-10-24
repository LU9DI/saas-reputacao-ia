import { createHash } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const urlArg = process.argv[2];
const month = process.argv[3];
if (!urlArg || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month || '')) {
  console.error('Usage: node scripts/inspect-source.mjs <official-download-url> YYYY-MM');
  process.exit(2);
}

let url;
try { url = new URL(urlArg); } catch { throw new Error('Invalid source URL'); }
if (url.protocol !== 'https:' || url.hostname !== 'dados.mj.gov.br' ||
    !url.pathname.startsWith('/dataset/') || !url.pathname.includes('/download/')) {
  throw new Error('Only direct HTTPS downloads from dados.mj.gov.br are allowed');
}

const response = await fetch(url, { signal: AbortSignal.timeout(120_000), redirect: 'follow' });
if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
const finalUrl = new URL(response.url);
if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'dados.mj.gov.br') {
  throw new Error('Unexpected redirect destination; refusing to inspect response');
}
const contentType = response.headers.get('content-type') || '';
if (/text\/html/i.test(contentType)) throw new Error('Received HTML, not a CSV resource');
if (!response.body) throw new Error('Source response has no body');

const hash = createHash('sha256');
const decoder = new TextDecoder('utf-8', { fatal: false });
let bytes = 0;
let firstLine = '';
let headerComplete = false;
let headerOverflow = false;
const reader = response.body.getReader();
try {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
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
} finally {
  reader.releaseLock();
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
const delimiterCandidates = [ ';', ',', '\t', '|' ].map(delimiter => ({ delimiter, count: countDelimiters(firstLine, delimiter) }));
delimiterCandidates.sort((a,b) => b.count - a.count);
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
  sourceUrl: url.toString(),
  finalUrl: response.url,
  referenceMonth: month,
  inspectedAt: new Date().toISOString(),
  contentType,
  contentLengthHeader: response.headers.get('content-length'),
  downloadedBytes: bytes,
  sha256: hash.digest('hex'),
  delimiter: delimiter === '\t' ? 'TAB' : delimiter,
  encodingAssumption: 'UTF-8; BOM stripped from header if present',
  headerCount: headers.length,
  headers,
  schemaStatus: 'DISCOVERED_NOT_APPROVED',
  privacy: 'Only header metadata retained. Record values, consumer text, and personal identifiers were not written to disk or logged.'
};
const outDir = resolve(import.meta.dirname, '../artifacts/source-inspection');
await mkdir(outDir, { recursive: true });
const outPath = resolve(outDir, `consumidor-gov-${month}-header.json`);
await writeFile(outPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ reportPath: outPath, referenceMonth: month, downloadedBytes: bytes, sha256: report.sha256, delimiter: report.delimiter, headerCount: headers.length, headers, schemaStatus: report.schemaStatus }, null, 2));
