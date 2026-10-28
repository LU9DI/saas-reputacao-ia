import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularLastmod, dataDeEntrada } from './lastmod.mjs';

const base = () => ({ SP: { campinas: { restaurantes: { a: 10, ab: 2, ano: { 2024: 1, 2025: 2 } }, hoteis: { a: 4 } }, santos: { hoteis: { a: 3 } } } });

test('primeira execução: todas as páginas recebem a data de hoje', () => {
  const m = calcularLastmod(base(), {}, '2026-10-01');
  assert.equal(dataDeEntrada(m['/sp']), '2026-10-01');
  assert.equal(dataDeEntrada(m['/sp/campinas/restaurantes']), '2026-10-01');
  assert.equal(Object.keys(m).length, 6);
});

test('conteúdo igual mantém a data anterior, mesmo com chaves em outra ordem', () => {
  const ant = calcularLastmod(base(), {}, '2026-10-01');
  const outra = base();
  outra.SP.campinas.restaurantes = { ano: { 2025: 2, 2024: 1 }, ab: 2, a: 10 };
  const m = calcularLastmod(outra, ant, '2026-11-01');
  for (const k of Object.keys(ant)) assert.equal(dataDeEntrada(m[k]), '2026-10-01', k);
});

test('só a página alterada e seus ancestrais mudam de data', () => {
  const ant = calcularLastmod(base(), {}, '2026-10-01');
  const novo = base();
  novo.SP.santos.hoteis.a = 5;
  const m = calcularLastmod(novo, ant, '2026-11-01');
  assert.equal(dataDeEntrada(m['/sp/santos/hoteis']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/sp/santos']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/sp']), '2026-11-01');
  assert.equal(dataDeEntrada(m['/sp/campinas']), '2026-10-01');
  assert.equal(dataDeEntrada(m['/sp/campinas/hoteis']), '2026-10-01');
});
