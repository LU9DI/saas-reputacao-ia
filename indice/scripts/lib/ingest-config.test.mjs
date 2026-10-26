import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bloqueioTokenWebdav, CAMINHO_WEBDAV } from './ingest-config.mjs';

const BASE = `https://arquivos.receitafederal.gov.br${CAMINHO_WEBDAV}`;

test('bloqueia WebDAV remoto sem token, antes de qualquer download', () => {
  const motivo = bloqueioTokenWebdav({ baseUrl: BASE, token: '' });
  assert.match(motivo, /INDICE_RFB_SHARE_TOKEN não configurado/);
  assert.match(motivo, /Nenhum download foi iniciado/);
});

test('trata token vazio ou só com espaços como ausente', () => {
  assert.ok(bloqueioTokenWebdav({ baseUrl: BASE, token: '   ' }));
});

test('permite WebDAV remoto quando o token existe', () => {
  assert.equal(bloqueioTokenWebdav({ baseUrl: BASE, token: 'token-de-teste' }), null);
});

test('não exige token para arquivos locais', () => {
  assert.equal(bloqueioTokenWebdav({ baseUrl: BASE, token: '', local: true }), null);
});

test('não exige token para uma base URL pública sem WebDAV', () => {
  assert.equal(bloqueioTokenWebdav({ baseUrl: 'https://example.invalid/CNPJ', token: '' }), null);
});

test('ingest.mjs aborta sem token antes de acessar a rede', () => {
  const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'ingest.mjs');
  const env = { ...process.env };
  delete env.INDICE_RFB_SHARE_TOKEN;
  const r = spawnSync(process.execPath, [script, '--competencia=2026-10'], { encoding: 'utf8', env, timeout: 15000 });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /INDICE_RFB_SHARE_TOKEN não configurado/);
  assert.match(r.stderr, /Nenhum download foi iniciado/);
});
