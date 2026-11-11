#!/usr/bin/env node

/**
 * Análise reproduzível de exportações CSV do Google Search Console.
 *
 * Não acessa a API nem o GSC: recebe o arquivo exportado pela UI (Páginas ou
 * Consultas) e separa oportunidades de posição 8–30 e de CTR baixo no topo.
 * Nenhum número é estimado; os campos exibidos são os do arquivo.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PAGE_KEYS = ['page', 'pages', 'pagina', 'paginas', 'top pages', 'url', 'endereco'];
const QUERY_KEYS = ['query', 'queries', 'consulta', 'consultas', 'top queries', 'termo', 'termos'];
const CLICK_KEYS = ['clicks', 'cliques'];
const IMPRESSION_KEYS = ['impressions', 'impressoes'];
const CTR_KEYS = ['ctr'];
const POSITION_KEYS = ['position', 'posicao', 'posicao media', 'average position'];

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

export function detectDelimiter(text) {
  const line = text.split(/\r?\n/, 1)[0] || '';
  const counts = [',', ';', '\t'].map((d) => [d, line.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

export function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

function parseMetric(raw, { decimalComma = false } = {}) {
  let value = String(raw ?? '').replace(/%/g, '').replace(/[\s\u00a0]/g, '').trim();
  if (!value) return Number.NaN;
  if (decimalComma) value = value.replace(/\./g, '').replace(',', '.');
  else value = value.replace(/,/g, '');
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

function parseCtr(raw, { decimalComma = false } = {}) {
  const text = String(raw ?? '');
  const value = parseMetric(text, { decimalComma });
  if (!Number.isFinite(value)) return Number.NaN;
  if (text.includes('%') || value > 1) return value / 100;
  return value;
}

/**
 * Lê uma exportação do GSC em CSV (Páginas ou Consultas).
 *
 * @param {string} text conteúdo do arquivo
 * @returns {{kind: 'pages'|'queries', rows: object[], skipped: number, delimiter: string}}
 */
export function parseGscCsv(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(clean);
  const table = parseCsv(clean, delimiter);
  if (table.length < 2) return { kind: 'pages', rows: [], skipped: 0, delimiter };
  const headers = table[0];
  const pageIndex = findKey(headers, PAGE_KEYS);
  const queryIndex = findKey(headers, QUERY_KEYS);
  const clickIndex = findKey(headers, CLICK_KEYS);
  const impressionIndex = findKey(headers, IMPRESSION_KEYS);
  const ctrIndex = findKey(headers, CTR_KEYS);
  const positionIndex = findKey(headers, POSITION_KEYS);
  const kind = pageIndex >= 0 ? 'pages' : queryIndex >= 0 ? 'queries' : null;
  const keyIndex = kind === 'pages' ? pageIndex : queryIndex;
  if (!kind || keyIndex < 0 || impressionIndex < 0 || positionIndex < 0) {
    throw new Error('CSV sem colunas reconhecíveis de Páginas/Consultas, Impressões e Posição');
  }
  const decimalComma = delimiter === ';';
  const rows = [];
  let skipped = 0;
  for (const cells of table.slice(1)) {
    const key = (cells[keyIndex] || '').trim();
    const impressions = parseMetric(cells[impressionIndex], { decimalComma });
    const position = parseMetric(cells[positionIndex], { decimalComma });
    if (!key || !Number.isFinite(impressions) || !Number.isFinite(position)) {
      skipped += 1;
      continue;
    }
    const clicks = clickIndex >= 0 ? parseMetric(cells[clickIndex], { decimalComma }) : 0;
    const ctr = ctrIndex >= 0 ? parseCtr(cells[ctrIndex], { decimalComma }) : impressions > 0 ? clicks / impressions : 0;
    rows.push({
      key,
      clicks: Number.isFinite(clicks) ? clicks : 0,
      impressions,
      ctr: Number.isFinite(ctr) ? ctr : 0,
      position,
    });
  }
  return { kind, rows, skipped, delimiter };
}

/** Tipo de URL do Índice ou do site principal, derivado apenas do caminho. */
export function classifyPage(url) {
  let path;
  try {
    path = new URL(url, 'https://filtraai.com').pathname;
  } catch {
    return 'invalida';
  }
  const indice = path.replace(/^\/indice(?=\/|$)/, '') || '/';
  if (indice === '/') return 'indice_home';
  if (indice === '/metodologia') return 'indice_metodologia';
  if (indice === '/rankings/ativos') return 'indice_rankings_ativos_hub';
  if (indice === '/rankings/aberturas') return 'indice_rankings_aberturas_hub';
  if (/^\/rankings\/ativos\/[^/]+$/.test(indice)) return 'indice_ranking_nacional';
  if (/^\/rankings\/ativos\/[^/]+\/[^/]+$/.test(indice)) return 'indice_ranking_uf';
  if (/^\/rankings\/aberturas\/[^/]+\/\d{4}$/.test(indice)) return 'indice_ranking_aberturas_ano';
  if (indice === '/us') return 'us_home';
  if (indice === '/us/methodology') return 'us_metodologia';
  if (/^\/us\/[^/]+$/.test(indice)) return 'us_estado';
  if (/^\/us\/[^/]+\/[^/]+$/.test(indice)) return 'us_condado';
  if (/^\/us\/[^/]+\/[^/]+\/[^/]+$/.test(indice)) return 'us_segmento';
  if (/^\/(en|es|zh)(\/|$)/.test(path)) return 'site_localizado';
  if (/^\/[a-z]{2}$/.test(indice)) return 'indice_uf';
  if (/^\/[a-z]{2}\/[^/]+$/.test(indice)) return 'indice_municipio';
  if (/^\/[a-z]{2}\/[^/]+\/[^/]+$/.test(indice)) return 'indice_segmento';
  if (/^\/blog(\/|$)/.test(path)) return 'site_blog';
  return 'site_outro';
}

/**
 * Separa oportunidades sem inventar score ou previsão de CTR.
 * - `striking`: posição 8–30 com impressões acima do mínimo.
 * - `lowCtrTop`: posição 1–7 com CTR abaixo do limite e impressões relevantes.
 */
export function prioritize(rows, {
  minImpressions = 10,
  minPosition = 8,
  maxPosition = 30,
  topPosition = 7,
  topCtr = 0.02,
  limit = 50,
  kind = 'pages',
} = {}) {
  const withType = rows.map((row) => ({ ...row, type: kind === 'pages' ? classifyPage(row.key) : 'consulta' }));
  const striking = withType
    .filter((row) => row.position >= minPosition && row.position <= maxPosition && row.impressions >= minImpressions)
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position)
    .slice(0, limit);
  const lowCtrTop = withType
    .filter((row) => row.position <= topPosition && row.impressions >= minImpressions && row.ctr <= topCtr)
    .sort((a, b) => b.impressions - a.impressions || a.ctr - b.ctr)
    .slice(0, limit);
  const byType = new Map();
  if (kind === 'pages') {
    for (const row of withType) {
      const current = byType.get(row.type) || { type: row.type, pages: 0, impressions: 0, clicks: 0 };
      current.pages += 1;
      current.impressions += row.impressions;
      current.clicks += row.clicks;
      byType.set(row.type, current);
    }
  }
  const totals = withType.reduce((acc, row) => {
    acc.impressions += row.impressions;
    acc.clicks += row.clicks;
    return acc;
  }, { impressions: 0, clicks: 0 });
  return {
    kind,
    totalRows: rows.length,
    totals,
    striking,
    lowCtrTop,
    byType: [...byType.values()].sort((a, b) => b.impressions - a.impressions),
  };
}

const pct = (value) => `${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
const num = (value) => value.toLocaleString('pt-BR');
const place = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatMarkdown(result, { period = 'período do arquivo', file = '' } = {}) {
  const label = result.kind === 'queries' ? 'Consulta' : 'Página';
  const cell = (value) => String(value).replace(/\|/g, '\\|');
  const table = (rows) => [
    `| # | ${label} | Tipo | Impressões | Cliques | CTR | Posição |`,
    '|---:|---|---|---:|---:|---:|---:|',
    ...rows.map((row, index) => `| ${index + 1} | ${cell(row.key)} | ${row.type} | ${num(row.impressions)} | ${num(row.clicks)} | ${pct(row.ctr)} | ${place(row.position)} |`),
  ].join('\n');
  const lines = [
    `# GSC — oportunidades por posição e CTR (${period})`,
    '',
    `Arquivo: ${file || 'não informado'} · Tipo: ${result.kind} · Linhas válidas: ${num(result.totalRows)} · Impressões: ${num(result.totals.impressions)} · Cliques: ${num(result.totals.clicks)}`,
    '',
    `## Posições 8–30 com impressões relevantes (${result.striking.length})`,
    '',
    result.striking.length ? table(result.striking) : 'Nenhuma linha atende ao filtro.',
    '',
    `## Posições 1–7 com CTR abaixo do limite (${result.lowCtrTop.length})`,
    '',
    result.lowCtrTop.length ? table(result.lowCtrTop) : 'Nenhuma linha atende ao filtro.',
    '',
    '## Impressões por tipo de página',
    '',
    result.byType.length
      ? ['| Tipo | Páginas | Impressões | Cliques |', '|---|---:|---:|---:|', ...result.byType.map((row) => `| ${row.type} | ${num(row.pages)} | ${num(row.impressions)} | ${num(row.clicks)} |`)].join('\n')
      : 'Disponível apenas para exportações de Páginas.',
    '',
    'Os campos acima vêm da exportação. O arquivo não prova causalidade nem garante ganho de posição.',
  ];
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { format: 'md', minImpressions: 10, limit: 50 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--file') { args.file = value; i += 1; }
    else if (arg === '--format') { args.format = value; i += 1; }
    else if (arg === '--period') { args.period = value; i += 1; }
    else if (arg === '--out') { args.out = value; i += 1; }
    else if (arg === '--min-impressions') { args.minImpressions = Number(value); i += 1; }
    else if (arg === '--min-position') { args.minPosition = Number(value); i += 1; }
    else if (arg === '--max-position') { args.maxPosition = Number(value); i += 1; }
    else if (arg === '--top-ctr') { args.topCtr = Number(value); i += 1; }
    else if (arg === '--limit') { args.limit = Number(value); i += 1; }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    console.error('Uso: node scripts/analyze-gsc-export.mjs --file export.csv [--format md|json|csv] [--period "2026-10-01..2026-10-28"]');
    process.exit(1);
  }
  const parsed = parseGscCsv(readFileSync(args.file, 'utf8'));
  const result = prioritize(parsed.rows, { ...args, kind: parsed.kind });
  let output;
  if (args.format === 'json') output = JSON.stringify({ ...result, skipped: parsed.skipped, period: args.period || null }, null, 2);
  else if (args.format === 'csv') {
    const sep = ';';
    const csvCell = (value) => {
      const text = String(value);
      return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const header = ['secao', 'chave', 'tipo', 'impressoes', 'cliques', 'ctr', 'posicao'];
    const rows = [
      ...result.striking.map((r) => ['8-30', r.key, r.type, r.impressions, r.clicks, r.ctr, r.position]),
      ...result.lowCtrTop.map((r) => ['1-7-ctr-baixo', r.key, r.type, r.impressions, r.clicks, r.ctr, r.position]),
    ];
    output = [header, ...rows].map((row) => row.map(csvCell).join(sep)).join('\n');
  } else output = formatMarkdown(result, { period: args.period, file: args.file });
  if (args.out) writeFileSync(args.out, output);
  else console.log(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
