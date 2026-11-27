import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validarDestino } from './output-dir.mjs';

const repo = path.resolve(import.meta.dirname, '..', '..');
const temp = () => mkdtempSync(path.join(os.tmpdir(), 'filtraai-guard-'));
const limpar = (p) => rmSync(p, { recursive: true, force: true });

test('aceita destino novo data-* dentro do temporário', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us-teste');
    assert.equal(validarDestino(alvo, repo, 'dados'), alvo);
  } finally { limpar(base); }
});

test('aceita diretório de dados existente só com produtos conhecidos', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-uk');
    mkdirSync(path.join(alvo, 'stats'), { recursive: true });
    writeFileSync(path.join(alvo, 'meta.json'), '{}');
    writeFileSync(path.join(alvo, 'authorities.json'), '[]');
    assert.equal(validarDestino(alvo, repo, 'dados'), alvo);
  } finally { limpar(base); }
});

test('recusa destino com arquivo não gerado', () => {
  const base = temp();
  try {
    const alvo = path.join(base, 'data-us');
    mkdirSync(alvo);
    writeFileSync(path.join(alvo, 'importante.txt'), 'não apagar');
    assert.throws(() => validarDestino(alvo, repo, 'dados'), /arquivo não gerado/);
  } finally { limpar(base); }
});

test('recusa raiz, destino fora do escopo e nome não permitido', () => {
  assert.throws(() => validarDestino(path.parse(repo).root, repo, 'dados'), /raiz|não permitido|fora/);
  assert.throws(() => validarDestino(path.join(path.parse(repo).root, 'data-us'), repo, 'dados'), /fora do repositório/);
  assert.throws(() => validarDestino(path.join(repo, 'src'), repo, 'dados'), /nome de --out/);
});

test('recusa link simbólico como destino', (t) => {
  const base = temp();
  try {
    const real = path.join(base, 'data-real');
    const link = path.join(base, 'data-link');
    mkdirSync(real);
    try { symlinkSync(real, link, 'dir'); } catch { t.skip('sem permissão para symlink'); return; }
    assert.throws(() => validarDestino(link, repo, 'dados'), /link simbólico|diretório comum/);
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

test('recusa exportação com arquivo alheio', () => {
  const base = temp();
  try {
    const alvo = path.join(base, '.gsc-export');
    mkdirSync(alvo);
    writeFileSync(path.join(alvo, 'package.json'), '{}');
    assert.throws(() => validarDestino(alvo, repo, 'gsc'), /arquivo não gerado/);
  } finally { limpar(base); }
});
