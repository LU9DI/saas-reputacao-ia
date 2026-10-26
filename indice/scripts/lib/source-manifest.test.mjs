import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { descreverArquivoFonte } from './source-manifest.mjs';

test('registra tamanho e SHA-256 reproduzíveis', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'filtra-source-'));
  try {
    const caminho = path.join(dir, 'Estabelecimentos0.zip');
    const conteudo = Buffer.from('conteudo de teste\n');
    await writeFile(caminho, conteudo);
    const item = await descreverArquivoFonte({ caminho, tipo: 'estabelecimentos', url: 'https://example.invalid/Estabelecimentos0.zip' });
    assert.equal(item.arquivo, 'Estabelecimentos0.zip');
    assert.equal(item.tipo, 'estabelecimentos');
    assert.equal(item.bytes, conteudo.length);
    assert.equal(item.sha256, createHash('sha256').update(conteudo).digest('hex'));
    assert.equal(item.url, 'https://example.invalid/Estabelecimentos0.zip');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('não inventa URL para arquivos locais', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'filtra-source-'));
  try {
    const caminho = path.join(dir, 'Municipios.zip');
    await writeFile(caminho, 'municipios');
    const item = await descreverArquivoFonte({ caminho, tipo: 'municipios' });
    assert.equal(item.arquivo, 'Municipios.zip');
    assert.equal(item.url, null);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
