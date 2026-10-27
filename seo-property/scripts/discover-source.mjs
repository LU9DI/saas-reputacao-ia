import { CATALOG_URL, extractOfficialMonthlyResources } from './source-catalog.mjs';

const response = await fetch(CATALOG_URL, {
  headers: { accept: 'application/json' },
  redirect: 'error',
  signal: AbortSignal.timeout(30_000)
});
if (!response.ok) throw new Error('Official catalog returned HTTP ' + response.status);
const contentType = response.headers.get('content-type') || '';
if (!/application\/json/i.test(contentType)) throw new Error('Official catalog did not return JSON');
const payload = await response.json();
const resources = extractOfficialMonthlyResources(payload);
if (resources.length === 0) throw new Error('Catalog response contained no verified official monthly CSV resources');
console.log(JSON.stringify({
  source: 'Ministério da Justiça e Segurança Pública / Senacon — Dados Consumidor.gov.br',
  catalogUrl: CATALOG_URL,
  retrievedAt: new Date().toISOString(),
  resourceCount: resources.length,
  resources
}, null, 2));
