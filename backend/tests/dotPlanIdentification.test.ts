import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  normalizePlan,
  planLabel,
  isDotPlan,
  resolveDotPlan,
  isPlanoOficial,
} from '../lib/plans.js';
import { getFeedbackLimit, getTokenLimit } from '../lib/quota.js';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

// ---------------------------------------------------------------------------
// Normalização e rótulos
// ---------------------------------------------------------------------------

test('plano rei é identificado como REI', () => {
  assert.equal(normalizePlan('rei'), 'rei');
  assert.equal(planLabel('rei'), 'REI');
  assert.equal(planLabel('REI'), 'REI');
  assert.equal(isDotPlan('rei'), true);
});

test('corporativo, corp e corporate são o mesmo plano Corporativo', () => {
  for (const value of ['corporativo', 'corp', 'corporate', 'CORP', 'Corporate']) {
    assert.equal(normalizePlan(value), 'corporativo', `normalizePlan(${value})`);
    assert.equal(planLabel(value), 'Corporativo', `planLabel(${value})`);
    assert.equal(isDotPlan(value), true, `isDotPlan(${value})`);
  }
});

test('ciclos anuais são normalizados sem inventar plano', () => {
  assert.equal(normalizePlan('rei-anual'), 'rei');
  assert.equal(normalizePlan('corporativo-anual'), 'corporativo');
  assert.equal(normalizePlan('corporate-anual'), 'corporativo');
  assert.equal(normalizePlan('corp-anual'), 'corporativo');
  assert.equal(planLabel('corporativo-anual'), 'Corporativo');
});

test('plano ausente, vazio ou desconhecido não vira Rei', () => {
  for (const value of [null, undefined, '', '   ', 'gold', 'enterprise']) {
    assert.equal(normalizePlan(value), null, `normalizePlan(${value})`);
    assert.equal(isDotPlan(value), false, `isDotPlan(${value})`);
  }
  assert.equal(isPlanoOficial('gold'), false);
});

// ---------------------------------------------------------------------------
// Gating de acesso ao Dot
// ---------------------------------------------------------------------------

test('resolveDotPlan libera Rei e Corporativo com rótulo correto', () => {
  const rei = resolveDotPlan('rei');
  assert.deepEqual(
    { allowed: rei.allowed, plan: rei.plan, label: rei.label, code: rei.code },
    { allowed: true, plan: 'rei', label: 'REI', code: 'DOT_PLAN_OK' },
  );

  for (const value of ['corporativo', 'corp', 'corporate']) {
    const decision = resolveDotPlan(value);
    assert.equal(decision.allowed, true, `resolveDotPlan(${value})`);
    assert.equal(decision.plan, 'corporativo');
    assert.equal(decision.label, 'Corporativo');
    assert.equal(decision.code, 'DOT_PLAN_OK');
  }
});

test('empresa sem plano é negada e não recebe plano fictício', () => {
  for (const value of [null, undefined, '', '   ']) {
    const decision = resolveDotPlan(value);
    assert.equal(decision.allowed, false);
    assert.equal(decision.plan, null);
    assert.equal(decision.label, null);
    assert.equal(decision.code, 'DOT_PLAN_MISSING');
  }
});

test('plano inválido é negado sem fallback', () => {
  const decision = resolveDotPlan('gold');
  assert.equal(decision.allowed, false);
  assert.equal(decision.plan, null);
  assert.equal(decision.label, null);
  assert.equal(decision.code, 'DOT_PLAN_INVALID');
});

test('plano oficial fora do Dot é identificado, mas negado', () => {
  const decision = resolveDotPlan('ultra');
  assert.equal(decision.allowed, false);
  assert.equal(decision.plan, 'ultra');
  assert.equal(decision.label, 'Ultra');
  assert.equal(decision.code, 'DOT_PLAN_NOT_ALLOWED');
});

test('cotas usam o plano real e nunca herdam o orçamento de Rei', () => {
  assert.equal(getTokenLimit('corp'), getTokenLimit('corporativo'));
  assert.equal(getTokenLimit('corporate'), getTokenLimit('corporativo'));
  assert.equal(getTokenLimit('corporate-anual'), getTokenLimit('corporativo'));
  assert.notEqual(getTokenLimit('corporativo'), getTokenLimit('rei'));
  assert.equal(getFeedbackLimit('corp'), getFeedbackLimit('corporativo'));
  assert.notEqual(getFeedbackLimit('corporate'), getFeedbackLimit('rei'));
});

// ---------------------------------------------------------------------------
// Regressões de rota: nenhum fallback silencioso para Rei
// ---------------------------------------------------------------------------

test('rotas do Dot não possuem fallback de plano para rei/Rei', () => {
  const routes = read('routes/dotRoutes.ts');
  assert.doesNotMatch(routes, /access\.plan\s*\|\|/);
  assert.doesNotMatch(routes, /planLabel\s*\|\|/);
  assert.doesNotMatch(routes, /String\(\s*plan\s*\|\|\s*['"]rei['"]\s*\)/);
  assert.doesNotMatch(routes, /['"]Rei['"]\s*\|\|/);
  assert.match(routes, /resolveDotPlan\(empresa\.plan\)/);
});

test('status do Dot expõe plano real ou null, com empresa e flag de identificação', () => {
  const routes = read('routes/dotRoutes.ts');
  assert.match(routes, /empresa_id:\s*access\.empresaId\s*\?\?\s*null/);
  assert.match(routes, /plan:\s*access\.plan\s*\?\?\s*null/);
  assert.match(routes, /plan_label:\s*access\.planLabel\s*\?\?\s*null/);
  assert.match(routes, /plan_identified:\s*Boolean\(access\.plan\)/);
});

test('rotas de permissões/ferramentas do agente usam a decisão central de plano', () => {
  const accessRoutes = read('routes/dotAccessRoutes.ts');
  assert.match(accessRoutes, /resolveDotPlan\(empresa\.plan\)/);
  assert.match(accessRoutes, /if \(!decision\.allowed\)/);
});

test('scheduler do Dot inclui o alias corporate e variantes anuais', () => {
  const scheduler = read('services/dotScheduler.ts');
  assert.match(scheduler, /'corporate'/);
  assert.match(scheduler, /'corporativo'/);
  assert.match(scheduler, /'corporativo-anual'/);
  assert.match(scheduler, /'corporate-anual'/);
});

// ---------------------------------------------------------------------------
// Frontend: estado neutro, sem plano inventado
// ---------------------------------------------------------------------------

test('frontend não inventa plano e mostra estado neutro', () => {
  const page = read('../frontend/src/app/dot/page.tsx');
  assert.doesNotMatch(page, /['"]REI['"]/);
  assert.doesNotMatch(page, /['"]Rei['"]/);
  assert.match(page, /Plano não identificado/);
});
