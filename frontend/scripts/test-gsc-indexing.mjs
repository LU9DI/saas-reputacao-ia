import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyReason, formatIndexingMarkdown, parseIndexingCsv, summarizeIndexing } from './gsc-indexing.mjs';

const PT_CSV = [
  'URL;Status;Motivo;Último rastreamento',
  'https://filtraai.com/indice/sp/sao-paulo/restaurantes;Não indexada;Descoberta, atualmente não indexada;2026-11-10',
  'https://filtraai.com/indice/go/goiania/restaurantes;Não indexada;Rastreada, atualmente não indexada;2026-11-09',
  'https://filtraai.com/indice/mg/belo-horizonte;Não indexada;Duplicada: o Google escolheu uma canonical diferente da declarada;2026-11-08',
  'https://filtraai.com/indice/rankings/ativos/restaurantes;Não indexada;Página alternativa com tag canonical adequada;2026-11-07',
  'https://filtraai.com/indice/us/california;Não indexada;Descoberta, atualmente não indexada;2026-11-06',
  'https://filtraai.com/indice/sp/nao-existe;Não indexada;Não encontrada (404);2026-11-05',
  'https://filtraai.com/indice/md/rankings/ativos;Não indexada;Excluída pela tag noindex;2026-11-04',
  'https://filtraai.com/indice/sp/sao-paulo;Indexada;;2026-11-03',
].join('\r\n');

test('lê exportação PT-BR e conta indexadas e não indexadas', () => {
  const parsed = parseIndexingCsv(PT_CSV);
  assert.equal(parsed.skipped, 0);
  assert.equal(parsed.rows.length, 8);
  const summary = summarizeIndexing(parsed.rows);
  assert.equal(summary.indexed, 1);
  assert.equal(summary.notIndexed, 7);
  assert.equal(summary.unknown, 0);
});

test('mantém cada motivo separado e calcula percentual sobre o não indexado', () => {
  const summary = summarizeIndexing(parseIndexingCsv(PT_CSV).rows);
  const discovered = summary.reasons.find((reason) => reason.key === 'discovered_not_indexed');
  const crawled = summary.reasons.find((reason) => reason.key === 'crawled_not_indexed');
  const duplicate = summary.reasons.find((reason) => reason.key === 'duplicate_google_canonical');
  const alternate = summary.reasons.find((reason) => reason.key === 'alternate_canonical');
  const notFound = summary.reasons.find((reason) => reason.key === 'not_found_404');
  const noindex = summary.reasons.find((reason) => reason.key === 'noindex');
  assert.equal(discovered.count, 2);
  assert.equal(crawled.count, 1);
  assert.equal(duplicate.count, 1);
  assert.equal(alternate.count, 1);
  assert.equal(notFound.count, 1);
  assert.equal(noindex.count, 1);
  assert.ok(Math.abs(discovered.percent - (2 / 7) * 100) < 1e-9);
  assert.ok(summary.reasons.every((reason) => reason.key !== 'excluded_other'));
});

test('lê exportação EN com motivo entre aspas contendo vírgula', () => {
  const csv = [
    'URL,Status,Reason,Last crawled',
    'https://filtraai.com/indice/us/texas/harris-county,Crawled - currently not indexed,,' ,
    'https://filtraai.com/indice/us/texas,Crawled - currently not indexed,"Duplicate, Google chose different canonical than user",2026-11-09',
  ].join('\n');
  const parsed = parseIndexingCsv(csv);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[1].reasonKey, 'duplicate_google_canonical');
  assert.equal(parsed.rows[1].lastCrawled, '2026-11-09');
});

test('desconhecidos não são agrupados: cada texto distinto vira um motivo próprio', () => {
  const csv = [
    'URL,Status,Reason',
    'https://filtraai.com/indice/sp,Not indexed,Motivo novo A',
    'https://filtraai.com/indice/rj,Not indexed,Motivo novo B',
  ].join('\n');
  const summary = summarizeIndexing(parseIndexingCsv(csv).rows);
  assert.equal(summary.reasons.length, 2);
  assert.ok(summary.reasons.every((reason) => reason.key.startsWith('outro:')));
});

test('cruza com o sitemap e sugere prioridade por motivo e presença', () => {
  const sitemapUrls = new Set([
    'https://filtraai.com/indice/sp/sao-paulo/restaurantes',
    'https://filtraai.com/indice/us/california',
    'https://filtraai.com/indice/sp/nao-existe',
    'https://filtraai.com/indice/fora-do-gsc',
  ]);
  const summary = summarizeIndexing(parseIndexingCsv(PT_CSV).rows, { sitemapUrls });
  assert.equal(summary.sitemap.total, 4);
  assert.equal(summary.sitemap.seenInGsc, 3);
  assert.equal(summary.sitemap.missingFromGsc, 1);
  assert.equal(summary.sitemap.notIndexedInSitemap, 3);
  assert.equal(summary.sitemap.notIndexedOutsideSitemap, 4);
  const discovered = summary.reasons.find((reason) => reason.key === 'discovered_not_indexed');
  assert.equal(discovered.priority.P1, 1);
  assert.equal(discovered.priority.P2, 1);
  const notFound = summary.reasons.find((reason) => reason.key === 'not_found_404');
  assert.equal(notFound.priority.P0, 1);
});

test('exemplos respeitam o limite e markdown não agrupa motivos', () => {
  const summary = summarizeIndexing(parseIndexingCsv(PT_CSV).rows, { examples: 1 });
  const discovered = summary.reasons.find((reason) => reason.key === 'discovered_not_indexed');
  assert.equal(discovered.examples.length, 1);
  const markdown = formatIndexingMarkdown(summary, { file: 'indexing.csv', period: '2026-11-01..2026-11-11' });
  assert.match(markdown, /Descoberta, atualmente não indexada/);
  assert.match(markdown, /Rastreada, atualmente não indexada/);
  assert.match(markdown, /Duplicada: Google escolheu canonical diferente/);
  assert.match(markdown, /não provam recuperação de indexação/);
  assert.doesNotMatch(markdown, /outro motivo agrupado/);
});

test('encontra o cabeçalho mesmo com linhas de metadados antes dele', () => {
  const csv = [
    'Relatório de indexação',
    'Propriedade: filtraai.com',
    '',
    'URL,Status,Reason',
    'https://filtraai.com/indice/sp,Not indexed,Discovered - currently not indexed',
  ].join('\n');
  const parsed = parseIndexingCsv(csv);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].reasonKey, 'discovered_not_indexed');
});

test('classifica os motivos mais comuns sem confundir categorias', () => {
  assert.equal(classifyReason('Discovered - currently not indexed').key, 'discovered_not_indexed');
  assert.equal(classifyReason('Crawled - currently not indexed').key, 'crawled_not_indexed');
  assert.equal(classifyReason('Duplicate, Google chose different canonical than user').key, 'duplicate_google_canonical');
  assert.equal(classifyReason('Alternate page with proper canonical tag').key, 'alternate_canonical');
  assert.equal(classifyReason('Soft 404').key, 'soft_404');
  assert.equal(classifyReason('Not found (404)').key, 'not_found_404');
  assert.equal(classifyReason('Server error (5xx)').key, 'server_error_5xx');
  assert.equal(classifyReason('Blocked by robots.txt').key, 'blocked_robots');
  assert.equal(classifyReason('Excluded by ‘noindex’ tag').key, 'noindex');
});
