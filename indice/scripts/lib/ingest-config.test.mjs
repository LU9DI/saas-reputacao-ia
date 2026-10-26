import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  bloqueioTokenWebdav,
  CAMINHO_WEBDAV,
  configuracaoAuthCurl,
  mascararUrl,
  precisaAuthWebdav,
  redigirSegredo,
} from './ingest-config.mjs';

const BASE = `https://arquivos.receitafederal.gov.br${CAMINHO_WEBDAV}`;
const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'ingest.mjs');
const TOKEN_TESTE = 'segredo-de-teste-nao-vazar';

function semToken() {
  const env = { ...process.env };
  delete env.INDICE_RFB_SHARE_TOKEN;
  return env;
}

test('bloqueia WebDAV remoto sem token, antes de qualquer download', () => {
  const motivo = bloqueioTokenWebdav({ baseUrl: BASE, token: '' });
  assert.match(motivo, /INDICE_RFB_SHARE_TOKEN não configurado/);
  assert.match(motivo, /Nenhum download foi iniciado/);
});

test('trata token vazio ou só com espaços como ausente', () => {
  assert.ok(bloqueioTokenWebdav({ baseUrl: BASE, token: '   ' }));
});

test('permite WebDAV remoto quando o token existe', () => {
  assert.equal(bloqueioTokenWebdav({ baseUrl: BASE, token: TOKEN_TESTE }), null);
});

test('não exige token para arquivos locais', () => {
  assert.equal(bloqueioTokenWebdav({ baseUrl: BASE, token: '', local: true }), null);
});

test('não exige token para uma base URL pública sem WebDAV', () => {
  assert.equal(bloqueioTokenWebdav({ baseUrl: 'https://example.invalid/CNPJ', token: '' }), null);
});

test('reconhece somente URLs do WebDAV como autenticadas', () => {
  assert.equal(precisaAuthWebdav(`${BASE}/2026-10/Cnaes.zip`), true);
  assert.equal(precisaAuthWebdav('https://example.invalid/CNPJ/Cnaes.zip'), false);
  assert.equal(precisaAuthWebdav('não é uma url'), false);
});

test('monta configuração do curl em stdin, sem o token em argv', () => {
  const config = configuracaoAuthCurl(TOKEN_TESTE);
  assert.equal(config, `user = "${TOKEN_TESTE}:"\n`);
  assert.doesNotMatch(config, /^-u\s/);
  assert.equal(configuracaoAuthCurl(''), '');
  assert.equal(configuracaoAuthCurl('   '), '');
});

test('escapa aspas e barras invertidas na configuração do curl', () => {
  assert.equal(configuracaoAuthCurl('a"b\\c'), 'user = "a\\"b\\\\c:"\n');
});

test('mascara token no caminho, na query e credenciais embutidas na URL', () => {
  const url = `https://usuario:senha@example.invalid/index.php/s/${TOKEN_TESTE}/download?path=%2F2026-10&token=${TOKEN_TESTE}&x=1`;
  const mascarada = mascararUrl(url, TOKEN_TESTE);
  assert.doesNotMatch(mascarada, new RegExp(TOKEN_TESTE));
  assert.doesNotMatch(mascarada, /usuario|senha@/);
  assert.match(mascarada, /token=\*\*\*/);
  assert.match(mascarada, /x=1/);
});

test('mascara parâmetros sensíveis conhecidos sem tocar no resto da URL', () => {
  const mascarada = mascararUrl('https://example.invalid/a?access_token=abc&sig=def&page=2');
  assert.match(mascarada, /access_token=\*\*\*/);
  assert.match(mascarada, /sig=\*\*\*/);
  assert.match(mascarada, /page=2/);
  assert.equal(mascararUrl('https://example.invalid/a?page=2'), 'https://example.invalid/a?page=2');
});

test('redige o segredo em textos de log e erro, inclusive percent-encoded', () => {
  const texto = `token=${TOKEN_TESTE} url=${encodeURIComponent(TOKEN_TESTE)} vazio=`;
  const redigido = redigirSegredo(texto, TOKEN_TESTE);
  assert.doesNotMatch(redigido, new RegExp(TOKEN_TESTE));
  assert.doesNotMatch(redigido, new RegExp(encodeURIComponent(TOKEN_TESTE)));
  assert.match(redigido, /token=\*\*\*/);
  assert.equal(redigirSegredo('sem segredo', ''), 'sem segredo');
  assert.equal(redigirSegredo('a e b', TOKEN_TESTE, TOKEN_TESTE), 'a e b');
});

test('ingest.mjs aborta sem token antes de acessar a rede', () => {
  const r = spawnSync(
    process.execPath,
    [SCRIPT, '--competencia=2026-10', '--base-url=http://127.0.0.1:9/public.php/webdav'],
    { encoding: 'utf8', env: semToken(), timeout: 15000 },
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /INDICE_RFB_SHARE_TOKEN não configurado/);
  assert.match(r.stderr, /Nenhum download foi iniciado/);
});

test('modo --local não exige token nem tenta download remoto', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ingest-local-'));
  try {
    await writeFile(path.join(dir, 'ibge.json'), '[]');
    const r = spawnSync(
      process.execPath,
      [SCRIPT, `--local=${dir}`, '--competencia=2026-10', `--ibge-arquivo=${path.join(dir, 'ibge.json')}`, '--sintetico'],
      { encoding: 'utf8', env: semToken(), timeout: 15000 },
    );
    assert.equal(r.status, 1);
    assert.match(r.stderr, /arquivo ausente em --local/);
    assert.doesNotMatch(r.stderr, /INDICE_RFB_SHARE_TOKEN não configurado/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('token configurado não aparece na saída de erro do modo --local', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ingest-local-'));
  try {
    await writeFile(path.join(dir, 'ibge.json'), '[]');
    const r = spawnSync(
      process.execPath,
      [SCRIPT, `--local=${dir}`, '--competencia=2026-10', `--ibge-arquivo=${path.join(dir, 'ibge.json')}`, '--sintetico'],
      { encoding: 'utf8', env: { ...process.env, INDICE_RFB_SHARE_TOKEN: TOKEN_TESTE }, timeout: 15000 },
    );
    assert.equal(r.status, 1);
    assert.doesNotMatch(`${r.stdout}${r.stderr}`, new RegExp(TOKEN_TESTE));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
