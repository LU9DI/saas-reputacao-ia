import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { validarDestino } from './output-dir.mjs';

const repo = path.resolve(import.meta.dirname, '..', '..');
const temp = () => mkdtempSync(path.join(os.tmpdir(), 'filtraai-guard-'));
const limpar = (p) => rmSync(p, { recursive: true, force: true });
const dadosUS = (dir) => {
  mkdirSync(path.join(dir, 'stats'), { recursive: true });
  writeFileSync(path.join(dir, 'meta.json'), '{}');
  writeFileSync(path.join(dir, 'counties.json'), '[]');
  writeFileSync(path.join(dir, 'stats', 'AL.json'), '{}');
};
const dadosUK = (dir) => {
  mkdirSync(path.join(dir, 'stats'), { recursive: true });
  writeFileSync(path.join(dir, 'meta.json'), '{}');
  writeFileSync(path.join(dir, 'authorities.json'), '[]');
  writeFileSync(path.join(dir, 'stats', 'england.json'), '{}');
};

test('aceita destino novo data-* dentro do temporário', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us-teste');
    assert.equal(validarDestino(alvo, repo, 'dados', 'us'), alvo);
  } finally { limpar(base); }
});

test('aceita estrutura válida de saída US', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    dadosUS(alvo);
    assert.equal(validarDestino(alvo, repo, 'dados', 'us'), alvo);
  } finally { limpar(base); }
});

test('aceita estrutura válida de saída UK', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-uk');
    dadosUK(alvo);
    assert.equal(validarDestino(alvo, repo, 'dados', 'uk'), alvo);
  } finally { limpar(base); }
});

test('recusa arquivo desconhecido em stats/ (stats/keep.txt)', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    dadosUS(alvo);
    writeFileSync(path.join(alvo, 'stats', 'keep.txt'), 'não apagar');
    assert.throws(() => validarDestino(alvo, repo, 'dados', 'us'), /arquivo desconhecido em stats/);
    assert.equal(readFileSync(path.join(alvo, 'stats', 'keep.txt'), 'utf8'), 'não apagar');
  } finally { limpar(base); }
});

test('recusa diretório inesperado dentro de stats/ (stats/subdir/important.txt)', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    dadosUS(alvo);
    mkdirSync(path.join(alvo, 'stats', 'subdir'));
    writeFileSync(path.join(alvo, 'stats', 'subdir', 'important.txt'), 'não apagar');
    assert.throws(() => validarDestino(alvo, repo, 'dados', 'us'), /entrada não regular em stats/);
  } finally { limpar(base); }
});

test('recusa link simbólico em stats/ (stats/link.json)', (t) => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    dadosUS(alvo);
    const externo = path.join(base, 'externo.json');
    writeFileSync(externo, '{}');
    try { symlinkSync(externo, path.join(alvo, 'stats', 'link.json'), 'file'); } catch { t.skip('sem permissão para symlink'); return; }
    assert.throws(() => validarDestino(alvo, repo, 'dados', 'us'), /link simbólico em stats/);
    assert.equal(readFileSync(externo, 'utf8'), '{}');
  } finally { limpar(base); }
});

test('recusa stats/ que é link simbólico', (t) => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    const real = path.join(base, 'stats-real');
    mkdirSync(alvo);
    mkdirSync(real);
    writeFileSync(path.join(real, 'AL.json'), '{}');
    writeFileSync(path.join(alvo, 'meta.json'), '{}');
    writeFileSync(path.join(alvo, 'counties.json'), '[]');
    try { symlinkSync(real, path.join(alvo, 'stats'), 'dir'); } catch { t.skip('sem permissão para symlink'); return; }
    assert.throws(() => validarDestino(alvo, repo, 'dados', 'us'), /stats.*link simbólico|link simbólico.*stats/);
  } finally { limpar(base); }
});

test('recusa arquivo desconhecido na raiz', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    dadosUS(alvo);
    writeFileSync(path.join(alvo, 'README.md'), 'alheio');
    assert.throws(() => validarDestino(alvo, repo, 'dados', 'us'), /arquivo não gerado/);
  } finally { limpar(base); }
});

test('recusa arquivo de primeiro nível que não é regular', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    mkdirSync(path.join(alvo, 'stats'), { recursive: true });
    writeFileSync(path.join(alvo, 'stats', 'AL.json'), '{}');
    mkdirSync(path.join(alvo, 'meta.json'));
    writeFileSync(path.join(alvo, 'counties.json'), '[]');
    assert.throws(() => validarDestino(alvo, repo, 'dados', 'us'), /meta.json.*não é arquivo regular/);
  } finally { limpar(base); }
});

test('recusa cruzamento de formato US/UK e padrão de stats errado', () => {
  const base = temp();
  try {
    const us = path.join(base, 'data-us');
    dadosUS(us);
    assert.throws(() => validarDestino(us, repo, 'dados', 'uk'), /arquivo não gerado/);
    const uk = path.join(base, 'data-uk');
    dadosUK(uk);
    assert.throws(() => validarDestino(uk, repo, 'dados', 'us'), /arquivo não gerado/);
    const usMinusculo = path.join(base, 'data-us-minusculo');
    dadosUS(usMinusculo);
    rmSync(path.join(usMinusculo, 'stats', 'AL.json'));
    writeFileSync(path.join(usMinusculo, 'stats', 'al.json'), '{}');
    assert.throws(() => validarDestino(usMinusculo, repo, 'dados', 'us'), /arquivo desconhecido em stats/);
  } finally { limpar(base); }
});

test('recusa destino existente vazio e exige conjunto de dados', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    mkdirSync(alvo);
    assert.throws(() => validarDestino(alvo, repo, 'dados', 'us'), /vazio/);
    assert.throws(() => validarDestino(path.join(base, 'data-novo'), repo, 'dados'), /conjunto de dados desconhecido/);
  } finally { limpar(base); }
});

test('recusa raiz, destino fora do escopo e nome não permitido', () => {
  assert.throws(() => validarDestino(path.parse(repo).root, repo, 'dados', 'us'), /raiz|não permitido|fora/);
  assert.throws(() => validarDestino(path.join(path.parse(repo).root, 'data-us'), repo, 'dados', 'us'), /fora do repositório/);
  assert.throws(() => validarDestino(path.join(repo, 'src'), repo, 'dados', 'us'), /nome de --out/);
});

test('recusa link simbólico como destino', (t) => {
  const base = temp();
  try {
    const real = path.join(base, 'data-real');
    const link = path.join(base, 'data-link');
    mkdirSync(real);
    try { symlinkSync(real, link, 'dir'); } catch { t.skip('sem permissão para symlink'); return; }
    assert.throws(() => validarDestino(link, repo, 'dados', 'us'), /link simbólico|diretório comum/);
  } finally { limpar(base); }
});

test('aceita .gsc-export existente só com produtos de exportação', () => {
  const base = temp();
  try {
    const alvo = path.join(base, '.gsc-export');
    mkdirSync(alvo);
    writeFileSync(path.join(alvo, 'RESUMO.txt'), 'ok');
    writeFileSync(path.join(alvo, 'urls-us-001.txt'), 'https://example.test/');
    assert.equal(validarDestino(alvo, repo, 'gsc'), alvo);
  } finally { limpar(base); }
});

test('recusa exportação com arquivo alheio e com diretório no lugar de arquivo', () => {
  const base = temp();
  try {
    const alvo = path.join(base, '.gsc-export');
    mkdirSync(alvo);
    writeFileSync(path.join(alvo, 'package.json'), '{}');
    assert.throws(() => validarDestino(alvo, repo, 'gsc'), /arquivo não gerado/);
    rmSync(path.join(alvo, 'package.json'));
    mkdirSync(path.join(alvo, 'RESUMO.txt'));
    assert.throws(() => validarDestino(alvo, repo, 'gsc'), /não é arquivo regular/);
  } finally { limpar(base); }
});

test('falha antes de remover: script GSC recusa keep.txt e preserva o conteúdo', () => {
  const base = temp();
  try {
    const alvo = path.join(base, '.gsc-export');
    mkdirSync(alvo);
    writeFileSync(path.join(alvo, 'keep.txt'), 'preservar');
    const r = spawnSync(process.execPath, [path.join(repo, 'scripts', 'export-urls-gsc.mjs'), `--out=${alvo}`], { encoding: 'utf8' });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /arquivo não gerado/);
    assert.equal(readFileSync(path.join(alvo, 'keep.txt'), 'utf8'), 'preservar');
  } finally { limpar(base); }
});

test('falha antes de remover: script US recusa keep.txt e preserva o conteúdo', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    dadosUS(alvo);
    writeFileSync(path.join(alvo, 'stats', 'keep.txt'), 'preservar');
    const r = spawnSync(process.execPath, [path.join(repo, 'scripts', 'ingest-us.mjs'), `--out=${alvo}`], { encoding: 'utf8' });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /arquivo desconhecido em stats/);
    assert.equal(readFileSync(path.join(alvo, 'stats', 'keep.txt'), 'utf8'), 'preservar');
  } finally { limpar(base); }
});


test('falha antes de remover: script UK recusa keep.txt e preserva o conteúdo', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-uk');
    dadosUK(alvo);
    writeFileSync(path.join(alvo, 'stats', 'keep.txt'), 'preservar');
    const r = spawnSync(process.execPath, [path.join(repo, 'scripts', 'ingest-uk.mjs'), `--out=${alvo}`], { encoding: 'utf8' });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /arquivo desconhecido em stats/);
    assert.equal(readFileSync(path.join(alvo, 'stats', 'keep.txt'), 'utf8'), 'preservar');
  } finally { limpar(base); }
});

