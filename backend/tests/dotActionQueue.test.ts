import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { initDB, getDb } from '../lib/db.js';
import {
  prepareDotActionFromDecision,
  approveDotAction,
  executeDotAction,
} from '../services/dotActionQueue.js';

process.env.NODE_ENV = 'test';
process.env.SQLITE_DB_PATH = '/tmp/filtra-dot-action-queue-test.sqlite';

let ready = false;

async function setup() {
  if (ready) return;
  await initDB();
  const db = getDb();
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
  await db.run('DELETE FROM dot_action_queue');
  await db.run('DELETE FROM dot_decisions');
  ready = true;
}

async function seedDecision(empresaId: string) {
  const db = getDb();
  const options = [
    { id: 'opcao_1', title: 'Resolver diretamente', action: 'priorizar_e_resolver', risk: 'medium' },
    { id: 'opcao_2', title: 'Escalar para responsável', action: 'escalar_responsavel', risk: 'low' },
  ];
  const r = await db.run(
    `INSERT INTO dot_decisions
      (empresa_id,event_id,type,priority,severity,reason,evidence_json,recommendation,options_json,requires_approval,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [empresaId, Date.now(), 'crise_reputacional', 'high', 'critical', 'teste', '[]', 'teste', JSON.stringify(options), 1, 'pending', new Date().toISOString()]
  );
  return Number(r.lastID);
}

test('Dot action queue: prepare is tenant-scoped and blocks a second active option', async () => {
  await setup();
  const empresa = crypto.randomUUID();
  const otherEmpresa = crypto.randomUUID();
  const decisionId = await seedDecision(empresa);

  const first = await prepareDotActionFromDecision(empresa, decisionId, 'opcao_1');
  assert.ok(first);
  assert.equal(first?.status, 'prepared');

  const second = await prepareDotActionFromDecision(empresa, decisionId, 'opcao_2');
  assert.ok(second);
  assert.equal(second?.optionId, 'opcao_1');

  const crossTenant = await prepareDotActionFromDecision(otherEmpresa, decisionId, 'opcao_1');
  assert.equal(crossTenant, null);
});

test('Dot action queue: approval is one-way and execution is replay-safe', async () => {
  await setup();
  const empresa = crypto.randomUUID();
  const decisionId = await seedDecision(empresa);
  const prepared = await prepareDotActionFromDecision(empresa, decisionId, 'opcao_1');
  assert.ok(prepared?.id);

  const approved = await approveDotAction(empresa, Number(prepared.id));
  assert.equal(approved?.status, 'approved');

  const replayApproval = await approveDotAction(empresa, Number(prepared.id));
  assert.equal(replayApproval, null);

  const executed = await executeDotAction(empresa, Number(prepared.id));
  assert.equal(executed.ok, true);
  assert.equal(executed.status, 'executed');
  assert.equal(executed.simulated, true);

  const replayExecution = await executeDotAction(empresa, Number(prepared.id));
  assert.equal(replayExecution.ok, false);
});

test('Dot action queue: an action cannot execute before approval', async () => {
  await setup();
  const empresa = crypto.randomUUID();
  const decisionId = await seedDecision(empresa);
  const prepared = await prepareDotActionFromDecision(empresa, decisionId, 'opcao_1');
  assert.ok(prepared?.id);

  const result = await executeDotAction(empresa, Number(prepared.id));
  assert.equal(result.ok, false);
});
