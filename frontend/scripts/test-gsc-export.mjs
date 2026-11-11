import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyPage, formatMarkdown, parseGscCsv, prioritize } from './gsc-export.mjs';

test('lê exportação de Páginas em pt-BR com ponto e vírgula e decimal com vírgula', () => {
  const csv = [
    'Páginas;Cliques;Impressões;CTR;Posição',
    '"https://filtraai.com/indice/sp/sao-paulo/restaurantes";10;1.200;0,83%;12,4',
    '"https://filtraai.com/indice/go/goiania/restaurantes";0;320;0,00%;8,1',
  ].join('\r\n');
  const parsed = parseGscCsv(csv);
  assert.equal(parsed.kind, 'pages');
  assert.equal(parsed.skipped, 0);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].impressions, 1200);
  assert.equal(parsed.rows[0].clicks, 10);
  assert.ok(Math.abs(parsed.rows[0].ctr - 0.0083) < 1e-9);
  assert.equal(parsed.rows[0].position, 12.4);
});

test('lê exportação de Consultas em inglês com BOM, CRLF e consulta entre aspas com vírgula', () => {
  const csv = '\uFEFFQuery,Clicks,Impressions,CTR,Position\r\n"restaurantes, são paulo",5,"2,345",0.21%,9.8\r\n';
  const parsed = parseGscCsv(csv);
  assert.equal(parsed.kind, 'queries');
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].key, 'restaurantes, são paulo');
  assert.equal(parsed.rows[0].impressions, 2345);
  assert.ok(Math.abs(parsed.rows[0].ctr - 0.0021) < 1e-9);
  assert.equal(parsed.rows[0].position, 9.8);
});

test('ignora linhas sem chave ou sem métricas válidas', () => {
  const csv = [
    'Páginas,Cliques,Impressões,CTR,Posição',
    'https://filtraai.com/indice/sp,1,10,10%,5',
    'https://filtraai.com/sem-metricas,,,,',
  ].join('\n');
  const parsed = parseGscCsv(csv);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.skipped, 1);
});

test('separa posições 8–30 das posições 1–7 com CTR baixo', () => {
  const rows = [
    { key: 'https://filtraai.com/indice/sp/sao-paulo/restaurantes', impressions: 500, clicks: 1, ctr: 0.002, position: 12 },
    { key: 'https://filtraai.com/indice/go/goiania/restaurantes', impressions: 400, clicks: 2, ctr: 0.005, position: 5 },
    { key: 'https://filtraai.com/indice/rankings/ativos/restaurantes', impressions: 50, clicks: 5, ctr: 0.1, position: 3 },
    { key: 'https://filtraai.com/indice/mg/belo-horizonte', impressions: 4, clicks: 0, ctr: 0, position: 20 },
  ];
  const result = prioritize(rows, { minImpressions: 10, kind: 'pages' });
  assert.deepEqual(result.striking.map((row) => row.key), ['https://filtraai.com/indice/sp/sao-paulo/restaurantes']);
  assert.deepEqual(result.lowCtrTop.map((row) => row.key), [
    'https://filtraai.com/indice/go/goiania/restaurantes',
  ]);
  assert.equal(result.byType.find((row) => row.type === 'indice_segmento').pages, 2);
});

test('classifica páginas do Índice, do site e dos EUA', () => {
  assert.equal(classifyPage('https://filtraai.com/indice/sp/sao-paulo/restaurantes'), 'indice_segmento');
  assert.equal(classifyPage('https://filtraai.com/indice/sp/sao-paulo'), 'indice_municipio');
  assert.equal(classifyPage('https://filtraai.com/indice/sp'), 'indice_uf');
  assert.equal(classifyPage('https://filtraai.com/indice/rankings/ativos/restaurantes/sp'), 'indice_ranking_uf');
  assert.equal(classifyPage('https://filtraai.com/indice/rankings/ativos/restaurantes'), 'indice_ranking_nacional');
  assert.equal(classifyPage('https://filtraai.com/indice/us/california'), 'us_estado');
  assert.equal(classifyPage('https://filtraai.com/indice/us/california/los-angeles-county'), 'us_condado');
  assert.equal(classifyPage('https://filtraai.com/indice/us/california/los-angeles-county/restaurants-and-bars'), 'us_segmento');
  assert.equal(classifyPage('https://filtraai.com/blog/gestao-reputacao-online-guia'), 'site_blog');
  assert.equal(classifyPage('https://filtraai.com/en/hotels'), 'site_localizado');
});

test('markdown mostra os dois grupos e não inventa score', () => {
  const parsed = parseGscCsv([
    'Páginas,Cliques,Impressões,CTR,Posição',
    'https://filtraai.com/indice/sp/sao-paulo/restaurantes,1,500,0.20%,12',
    'https://filtraai.com/indice/go/goiania/restaurantes,2,400,0.50%,5',
  ].join('\n'));
  const markdown = formatMarkdown(prioritize(parsed.rows, { minImpressions: 10, kind: parsed.kind }), {
    period: '2026-10-01..2026-10-28',
    file: 'Pages.csv',
  });
  assert.match(markdown, /Posições 8–30/);
  assert.match(markdown, /Posições 1–7/);
  assert.match(markdown, /2026-10-01\.\.2026-10-28/);
  assert.match(markdown, /não prova causalidade/);
  assert.doesNotMatch(markdown, /score|pontuação/i);
});
