/**
 * Concorrência real em PostgreSQL: processos Node independentes, pools
 * independentes. Não basta o exit code zero — stderr de cada worker é
 * inspecionado em busca de erro de DDL/corrida.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { after, before, test } from 'node:test';
import { closeDB, getDb, initDB } from '../lib/db.js';
import type { Database } from 'sqlite';
import {
  createTestDatabase,
  dropTestDatabase,
  parseWorkerJson,
  runNodeScript,
} from './helpers/pg-test-utils.js';

const PREPARE_WORKER = new URL('./helpers/prepare-dot-action.pg.ts', import.meta.url);
const APPROVE_WORKER = new URL('./helpers/approve-dot-action.pg.ts', import.meta.url);

let dbName = '';
let dbUrl = '';
let db: Database;

before(async () => {
  const created = await createTestDatabase('pg_dot_action');
  dbName = created.name;
  dbUrl = created.url;
  process.env.DATABASE_URL = dbUrl;
  process.env.NODE_ENV = 'test';
  await initDB();
  db = getDb();
  // Tabela de decisões é criada pelo serviço DOT em runtime; aqui o teste a
  // declara explicitamente para semear cenários.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS dot_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT NOT NULL,
      event_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      priority TEXT NOT NULL,
      severity TEXT NOT NULL,
      reason TEXT NOT NULL,
      evidence_json TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      options_json TEXT NOT NULL,
      requires_approval INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    )
  `);
});

after(async () => {
  await closeDB();
  if (dbName) await dropTestDatabase(dbName);
});

async function seedDecision(empresaId: string, optionId: string, options: unknown[]) {
  const seeded = await db.run(
    `INSERT INTO dot_decisions
      (empresa_id,event_id,type,priority,severity,reason,evidence_json,recommendation,options_json,requires_approval,status,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`,
    [empresaId, Date.now() % 2_000_000_000, 'crise_reputacional', 'high', 'critical', 'pg concurrency', '[]', 'teste', JSON.stringify(options), 1, 'pending', new Date().toISOString()],
  );
  const decisionId = Number(seeded.lastID);
  assert.ok(decisionId > 0, `decisão de teste deve ser criada (opção ${optionId})`);
  return decisionId;
}

test('duas instâncias PostgreSQL preparam a mesma ação sem auditoria duplicada', async () => {
  const empresaId = `pg-concurrency-${crypto.randomUUID()}`;
  const optionId = 'opcao_pg';
  const decisionId = await seedDecision(empresaId, optionId, [
    { id: optionId, title: 'Teste', action: 'priorizar_e_resolver', risk: 'medium' },
  ]);
  try {
    const args = [empresaId, String(decisionId), optionId];
    const results = await Promise.all([
      runNodeScript(PREPARE_WORKER, args, { DATABASE_URL: dbUrl }),
      runNodeScript(PREPARE_WORKER, args, { DATABASE_URL: dbUrl }),
    ]);
    const payloads = results.map((result, index) => parseWorkerJson<{ id: number; status: string }>(result, `prepare-worker-${index + 1}`));

    assert.equal(payloads[0].id, payloads[1].id, 'ambas as instâncias devem receber o mesmo ID idempotente');

    const actions = await db.all('SELECT id,status FROM dot_action_queue WHERE empresa_id = ? AND decision_id = ?', [empresaId, decisionId]);
    assert.equal(actions.length, 1, 'deve existir exatamente uma ação');
    assert.equal(String(actions[0].status), 'prepared');

    const audits = await db.all(
      "SELECT id FROM dot_action_audit WHERE empresa_id = ? AND decision_id = ? AND event = 'prepared'",
      [empresaId, decisionId],
    );
    assert.equal(audits.length, 1, 'deve existir exatamente um evento prepared');
  } finally {
    await db.run('DELETE FROM dot_action_audit WHERE empresa_id = ?', [empresaId]);
    await db.run('DELETE FROM dot_action_queue WHERE empresa_id = ?', [empresaId]);
    await db.run('DELETE FROM dot_decisions WHERE empresa_id = ?', [empresaId]);
  }
});

test('duas instâncias PostgreSQL não aprovam duas vezes a mesma ação', async () => {
  const empresaId = `pg-approve-concurrency-${crypto.randomUUID()}`;
  const optionId = 'opcao_aprovacao';
  const decisionId = await seedDecision(empresaId, optionId, [
    { id: optionId, title: 'Teste', action: 'priorizar_e_resolver', risk: 'medium' },
  ]);
  try {
    const { prepareDotActionFromDecision } = await import('../services/dotActionQueue.js');
    const prepared = await prepareDotActionFromDecision(empresaId, decisionId, optionId, 'pg-test-owner');
    assert.ok(prepared?.id);

    const args = [empresaId, String(prepared.id), 'pg-approver'];
    const results = await Promise.all([
      runNodeScript(APPROVE_WORKER, args, { DATABASE_URL: dbUrl }),
      runNodeScript(APPROVE_WORKER, args, { DATABASE_URL: dbUrl }),
    ]);
    const payloads = results.map((result, index) => parseWorkerJson<{ status?: string } | null>(result, `approve-worker-${index + 1}`));

    assert.equal(payloads.filter((payload) => payload?.status === 'approved').length, 1,
      'exatamente uma instância deve concluir a aprovação');
    assert.equal(payloads.filter((payload) => payload === null).length, 1,
      'a segunda instância deve observar que a ação já foi consumida (sem segunda transição)');

    const action = await db.get(
      'SELECT status FROM dot_action_queue WHERE empresa_id = ? AND id = ?',
      [empresaId, prepared.id],
    );
    assert.equal(String(action?.status), 'approved');

    const decision = await db.get(
      'SELECT status FROM dot_decisions WHERE empresa_id = ? AND id = ?',
      [empresaId, decisionId],
    );
    assert.equal(String(decision?.status), 'approved');

    const approvedAudits = await db.all(
      "SELECT id FROM dot_action_audit WHERE empresa_id = ? AND decision_id = ? AND event = 'approved'",
      [empresaId, decisionId],
    );
    assert.equal(approvedAudits.length, 1, 'deve existir exatamente um evento approved');
  } finally {
    await db.run('DELETE FROM dot_action_audit WHERE empresa_id = ?', [empresaId]);
    await db.run('DELETE FROM dot_action_queue WHERE empresa_id = ?', [empresaId]);
    await db.run('DELETE FROM dot_decisions WHERE empresa_id = ?', [empresaId]);
  }
});
