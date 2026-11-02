/**
 * Validação PostgreSQL real do Filtra DOT.
 *
 * Este harness NÃO usa mocks nem SQLite: cada cenário roda contra um cluster
 * PostgreSQL descartável cuja URL vem de `DOT_PG_TEST_DATABASE_URL`
 * (esperado: postgresql://postgres@127.0.0.1:55432/filtra_dot_test).
 *
 * Regras do harness:
 * - sem `DOT_PG_TEST_DATABASE_URL` a suíte é ignorada (CI sem banco);
 *   na execução operacional a variável é obrigatória e a suíte precisa rodar
 *   com 0 testes ignorados.
 * - concorrência é provada com conexões/processos independentes, sem depender
 *   do mutex em memória de `dotActionQueue.ts`.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.resolve(__dirname, '..');
const DOT_PG_TEST_DATABASE_URL = (process.env.DOT_PG_TEST_DATABASE_URL || '').trim();

if (DOT_PG_TEST_DATABASE_URL && !/^postgres(ql)?:\/\//i.test(DOT_PG_TEST_DATABASE_URL)) {
  throw new Error('DOT_PG_TEST_DATABASE_URL deve ser uma URL PostgreSQL.');
}
if (DOT_PG_TEST_DATABASE_URL) {
  process.env.DATABASE_URL = DOT_PG_TEST_DATABASE_URL;
  process.env.NODE_ENV = 'test';
}

const suite = DOT_PG_TEST_DATABASE_URL ? describe : describe.skip;

const TENANT_A = 'pg-it-tenant-a';
const TENANT_B = 'pg-it-tenant-b';
const OPTION_ID = 'opt-escalar';

const TSX_CLI = path.join(BACKEND_DIR, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const WORKER_PATH = path.join(__dirname, 'support', 'dotConcurrencyWorker.ts');

let libDb: typeof import('../lib/db.js');
let dotSchema: typeof import('../services/dotSchema.js');
let dotQueue: typeof import('../services/dotActionQueue.js');
let dotAccess: typeof import('../services/dotAccessControl.js');
let db: any;
let empresaSeq = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedEmpresa(id: string) {
  const now = new Date().toISOString();
  empresaSeq += 1;
  const cnpj = String(70_000_000_000_000 + empresaSeq).slice(0, 14);
  await db.run(
    `INSERT INTO empresas (id, cnpj, nome_empresa, slug, status, plan, criado_em, expira_em)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT (id) DO NOTHING`,
    [id, cnpj, `Empresa ${id}`, id, 'ativo', 'rei', now, now],
  );
}

async function seedDecision(empresaId: string, status = 'pending') {
  const now = new Date().toISOString();
  const event = await db.run(
    `INSERT INTO dot_events (empresa_id, type, severity, title, details, created_at)
     VALUES (?,?,?,?,?,?) RETURNING id`,
    [empresaId, 'teste_validacao', 'media', 'Evento de validação', 'Evento sintético do harness', now],
  );
  const decision = await db.run(
    `INSERT INTO dot_decisions
       (empresa_id, event_id, type, priority, severity, reason, evidence_json, recommendation,
        options_json, requires_approval, status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`,
    [
      empresaId, Number(event.lastID), 'reputacao', 'alta', 'media', 'Motivo sintético',
      '[]', 'Recomendação sintética',
      JSON.stringify([{ id: OPTION_ID, action: 'escalar_responsavel', label: 'Escalar' }]),
      1, status, now,
    ],
  );
  return { decisionId: Number(decision.lastID), optionId: OPTION_ID };
}

async function seedAction(empresaId: string, decisionId: number, optionId: string, status = 'prepared') {
  const now = new Date().toISOString();
  const inserted = await db.run(
    `INSERT INTO dot_action_queue (empresa_id, decision_id, option_id, action, status, created_at)
     VALUES (?,?,?,?,?,?) RETURNING id`,
    [empresaId, decisionId, optionId, 'escalar_responsavel', status, now],
  );
  return Number(inserted.lastID);
}

async function actionRow(empresaId: string, actionId: number) {
  return db.get(
    'SELECT id, status, approved_at, executed_at, error FROM dot_action_queue WHERE empresa_id = ? AND id = ?',
    [empresaId, actionId],
  );
}

async function auditEvents(empresaId: string, actionId: number) {
  return db.all(
    'SELECT event, actor_type, actor_id FROM dot_action_audit WHERE empresa_id = ? AND action_id = ? ORDER BY id',
    [empresaId, actionId],
  );
}

async function auditCount(empresaId: string, actionId: number, event?: string) {
  const rows = await db.all(
    `SELECT count(*)::int AS total FROM dot_action_audit
      WHERE empresa_id = ? AND action_id = ?${event ? ' AND event = ?' : ''}`,
    event ? [empresaId, actionId, event] : [empresaId, actionId],
  );
  return Number(rows[0]?.total || 0);
}

async function dotTableNames(): Promise<string[]> {
  const rows = await db.all(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'dot\\_%' ORDER BY table_name`,
  );
  return rows.map((row: any) => String(row.table_name));
}

const DOT_TABLES = [
  'dot_access_audit',
  'dot_action_audit',
  'dot_action_queue',
  'dot_agent_permissions',
  'dot_decisions',
  'dot_events',
  'dot_followups',
  'dot_internal_cases',
  'dot_tool_audit',
];

async function dotTableCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const table of DOT_TABLES) {
    const rows = await db.all(`SELECT count(*)::int AS total FROM ${table}`);
    counts[table] = Number(rows[0]?.total || 0);
  }
  return counts;
}


type WorkerRun = { code: number | null; stdout: string; stderr: string };

function spawnWorker(mode: 'approve' | 'execute', empresaId: string, actionId: number, startAt: number): Promise<WorkerRun> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [TSX_CLI, WORKER_PATH, mode, empresaId, String(actionId), String(startAt)],
      {
        cwd: BACKEND_DIR,
        env: { ...process.env, DATABASE_URL: DOT_PG_TEST_DATABASE_URL, NODE_ENV: 'test' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function parseWorkerPayload(run: WorkerRun): { mode: string; result: any } {
  const line = run.stdout.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{')).pop();
  assert.ok(line, `worker não emitiu JSON. stderr: ${run.stderr}`);
  return JSON.parse(String(line));
}

/**
 * Dispara dois processos Node independentes (pools e estado em memória
 * próprios) para disputar a mesma ação. Os `initDB()` são escalonados para não
 * concorrer em DDL; a disputa real acontece na barreira `startAt`.
 */
async function runConcurrentWorkers(mode: 'approve' | 'execute', empresaId: string, actionId: number) {
  const startAt = Date.now() + 3200;
  const first = spawnWorker(mode, empresaId, actionId, startAt);
  await sleep(1500);
  const second = spawnWorker(mode, empresaId, actionId, startAt);
  const runs = await Promise.all([first, second]);
  for (const run of runs) {
    assert.equal(run.code, 0, `worker divergiu (exit ${run.code}). stderr: ${run.stderr}`);
  }
  return runs.map(parseWorkerPayload);
}

suite('Filtra DOT — validação PostgreSQL descartável', () => {
  before(async () => {
    assert.ok(DOT_PG_TEST_DATABASE_URL, 'DOT_PG_TEST_DATABASE_URL é obrigatória nesta validação.');
    libDb = await import('../lib/db.js');
    dotSchema = await import('../services/dotSchema.js');
    dotQueue = await import('../services/dotActionQueue.js');
    dotAccess = await import('../services/dotAccessControl.js');
    db = await libDb.initDB();
    await dotSchema.ensureDotSchema();
    await db.exec(`TRUNCATE ${DOT_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
    await db.run("DELETE FROM empresas WHERE id LIKE 'pg-it-%'");
    await seedEmpresa(TENANT_A);
    await seedEmpresa(TENANT_B);
  });

  after(async () => {
    const closable = db as unknown as { close?: () => Promise<void> };
    if (closable && typeof closable.close === 'function') await closable.close();
  });

  it('1. banco em uso é a instância descartável 127.0.0.1:55432/filtra_dot_test', async () => {
    assert.equal(libDb.dbEngine(), 'postgres');
    const identity = await db.get(
      `SELECT current_database() AS database,
              inet_server_port() AS port,
              inet_server_addr()::text AS host,
              current_setting('data_directory') AS data_directory`,
    );
    console.log('[dot-pg] identidade do banco:', JSON.stringify(identity));
    assert.equal(String(identity.database), 'filtra_dot_test');
    assert.equal(Number(identity.port), 55432);
    assert.match(String(identity.host), /^127\.0\.0\.1/);
  });

  it('2. isolamento entre tenants: tenant A não aprova ação do tenant B', async () => {
    const seeded = await seedDecision(TENANT_B, 'prepared');
    const actionId = await seedAction(TENANT_B, seeded.decisionId, seeded.optionId);

    const crossApprove = await dotQueue.approveDotAction(TENANT_A, actionId, 'user-a');
    assert.equal(crossApprove, null, 'tenant A não pode aprovar ação do tenant B');

    const row = await actionRow(TENANT_B, actionId);
    assert.equal(String(row.status), 'prepared');
    assert.equal(row.approved_at, null);

    const decision = await db.get('SELECT status FROM dot_decisions WHERE id = ?', [seeded.decisionId]);
    assert.equal(String(decision.status), 'prepared');
    assert.equal(await auditCount(TENANT_A, actionId), 0);

    const ownApprove = await dotQueue.approveDotAction(TENANT_B, actionId, 'user-b');
    assert.ok(ownApprove && ownApprove.id === actionId, 'o tenant dono precisa conseguir aprovar');
    assert.equal(await auditCount(TENANT_B, actionId, 'approved'), 1);
  });

  it('3. isolamento entre tenants: tenant A não executa ação do tenant B', async () => {
    const seeded = await seedDecision(TENANT_B, 'prepared');
    const actionId = await seedAction(TENANT_B, seeded.decisionId, seeded.optionId);
    const approved = await dotQueue.approveDotAction(TENANT_B, actionId, 'user-b');
    assert.ok(approved);

    const crossExecution = await dotQueue.executeDotAction(TENANT_A, actionId, 'user-a');
    assert.equal(crossExecution.ok, false);
    assert.match(String(crossExecution.reason), /não encontrada ou não aprovada/i);

    const row = await actionRow(TENANT_B, actionId);
    assert.equal(String(row.status), 'approved');
    assert.equal(row.executed_at, null);
    assert.equal(await auditCount(TENANT_A, actionId, 'execution_started'), 0);
    assert.equal(await auditCount(TENANT_A, actionId, 'executed'), 0);

    const cases = await db.all(
      'SELECT id FROM dot_internal_cases WHERE empresa_id = ? AND action_id = ?',
      [TENANT_A, actionId],
    );
    assert.equal(cases.length, 0, 'tenant A não pode produzir efeitos internos para ação do tenant B');
  });

  it('4. isolamento entre tenants: listagem e permissões não vazam entre tenants', async () => {
    await dotAccess.ensureDotInternalPermissionBaseline(TENANT_B);

    assert.equal(await dotAccess.dotAccessAllowed(TENANT_B, 'operations', 'execute', null), true);
    assert.equal(await dotAccess.dotAccessAllowed(TENANT_A, 'operations', 'execute', null), false);
    assert.equal(
      await dotAccess.dotAccessAllowed(TENANT_A, 'operations', 'execute', 'user-b'),
      false,
      'identificador de usuário de outro tenant não pode conceder acesso',
    );

    const actionsA = await dotQueue.listDotActions(TENANT_A);
    assert.deepEqual(actionsA, [], 'tenant A não pode listar ações do tenant B');
    const actionsB = await dotQueue.listDotActions(TENANT_B);
    assert.ok(actionsB.length > 0, 'tenant B precisa ver as próprias ações');

    const permissionsA = await dotAccess.listDotPermissions(TENANT_A);
    assert.deepEqual(permissionsA, []);
    const permissionsB = await dotAccess.listDotPermissions(TENANT_B);
    assert.ok(permissionsB.length > 0);
  });

  it('5. ação cancelada não pode ser aprovada nem executada', async () => {
    const seeded = await seedDecision(TENANT_B, 'prepared');
    const actionId = await seedAction(TENANT_B, seeded.decisionId, seeded.optionId, 'cancelled');
    const auditBefore = await auditCount(TENANT_B, actionId);

    assert.equal(await dotQueue.approveDotAction(TENANT_B, actionId, 'user-b'), null);

    const execution = await dotQueue.executeDotAction(TENANT_B, actionId, 'user-b');
    assert.equal(execution.ok, false);
    assert.match(String(execution.reason), /não encontrada ou não aprovada/i);

    const row = await actionRow(TENANT_B, actionId);
    assert.equal(String(row.status), 'cancelled');
    assert.equal(row.executed_at, null);
    assert.equal(await auditCount(TENANT_B, actionId), auditBefore, 'ação cancelada não gera transições');

    const decision = await db.get('SELECT status FROM dot_decisions WHERE id = ?', [seeded.decisionId]);
    assert.equal(String(decision.status), 'prepared');
  });

  it('6. concorrência no banco: apenas uma transação reivindica a mesma ação', async () => {
    const seeded = await seedDecision(TENANT_B, 'prepared');
    const actionId = await seedAction(TENANT_B, seeded.decisionId, seeded.optionId, 'approved');

    const first = new pg.Client({ connectionString: DOT_PG_TEST_DATABASE_URL });
    const second = new pg.Client({ connectionString: DOT_PG_TEST_DATABASE_URL });
    await first.connect();
    await second.connect();

    const claimSql = "UPDATE dot_action_queue SET status = 'executing' WHERE id = $1 AND empresa_id = $2 AND status = 'approved'";
    try {
      await first.query('BEGIN');
      const claimFirst = await first.query(claimSql, [actionId, TENANT_B]);
      assert.equal(claimFirst.rowCount, 1, 'a primeira conexão precisa reivindicar a ação');

      await second.query('BEGIN');
      let settled = false;
      let secondError: unknown = null;
      const pending = (async () => second.query(claimSql, [actionId, TENANT_B]))()
        .then((result) => { settled = true; return result; })
        .catch((error) => { settled = true; secondError = error; return null; });

      await sleep(200);
      assert.equal(settled, false, 'a segunda conexão precisa ficar bloqueada pelo lock de linha do PostgreSQL');

      await first.query('COMMIT');
      const claimSecond = await pending;
      if (secondError) throw secondError;
      assert.ok(claimSecond, 'a segunda conexão precisa concluir após o commit da primeira');
      assert.equal(claimSecond.rowCount, 0, 'apenas uma conexão pode reivindicar a ação');
      await second.query('COMMIT');
    } finally {
      await first.end();
      await second.end();
    }

    const rows = await db.all('SELECT status FROM dot_action_queue WHERE empresa_id = ? AND id = ?', [TENANT_B, actionId]);
    assert.deepEqual(rows.map((row: any) => String(row.status)), ['executing']);

    const transitions = await db.all(
      'SELECT count(*)::int AS total FROM dot_action_queue WHERE empresa_id = ? AND decision_id = ? AND status IN (?,?,?,?)',
      [TENANT_B, seeded.decisionId, 'approved', 'executing', 'executed', 'failed'],
    );
    assert.equal(Number(transitions[0].total), 1, 'a ação deve existir em exatamente um estado final');
  });


  it('7. concorrência entre processos: apenas um processo aprova a mesma ação', async () => {
    const seeded = await seedDecision(TENANT_B, 'prepared');
    const actionId = await seedAction(TENANT_B, seeded.decisionId, seeded.optionId);

    const payloads = await runConcurrentWorkers('approve', TENANT_B, actionId);
    const winners = payloads.filter((payload) => payload.result && Number(payload.result.id) === actionId);
    assert.equal(winners.length, 1, `exatamente um processo deve aprovar. Resultados: ${JSON.stringify(payloads)}`);

    const row = await actionRow(TENANT_B, actionId);
    assert.equal(String(row.status), 'approved');
    assert.ok(row.approved_at, 'approved_at deve ser persistido');
    assert.equal(await auditCount(TENANT_B, actionId, 'approved'), 1);

    const decision = await db.get('SELECT status FROM dot_decisions WHERE id = ?', [seeded.decisionId]);
    assert.equal(String(decision.status), 'approved');
    const activeActions = await db.all(
      'SELECT id FROM dot_action_queue WHERE empresa_id = ? AND decision_id = ?',
      [TENANT_B, seeded.decisionId],
    );
    assert.equal(activeActions.length, 1);
  });

  it('8. concorrência entre processos: apenas um processo executa a mesma ação', async () => {
    const seeded = await seedDecision(TENANT_B, 'prepared');
    const actionId = await seedAction(TENANT_B, seeded.decisionId, seeded.optionId);
    const approved = await dotQueue.approveDotAction(TENANT_B, actionId, 'user-b');
    assert.ok(approved);

    const payloads = await runConcurrentWorkers('execute', TENANT_B, actionId);
    const successes = payloads.filter((payload) => payload.result?.ok === true);
    const rejections = payloads.filter((payload) => payload.result?.ok !== true);
    assert.equal(successes.length, 1, `exatamente um processo deve executar. Resultados: ${JSON.stringify(payloads)}`);
    assert.equal(rejections.length, 1);
    assert.match(String(rejections[0].result?.reason), /já está sendo processada|não encontrada ou não aprovada/i);

    assert.equal(await auditCount(TENANT_B, actionId, 'execution_started'), 1);
    assert.equal(await auditCount(TENANT_B, actionId, 'executed'), 1);
    const row = await actionRow(TENANT_B, actionId);
    assert.equal(String(row.status), 'executed');

    const cases = await db.all(
      'SELECT id FROM dot_internal_cases WHERE empresa_id = ? AND action_id = ?',
      [TENANT_B, actionId],
    );
    assert.equal(cases.length, 1, 'apenas um caso interno pode ser criado para a ação');
  });

  it('9. rollback: falha no meio da transação não deixa transição parcial', async () => {
    const seeded = await seedDecision(TENANT_B, 'prepared');
    const actionId = await seedAction(TENANT_B, seeded.decisionId, seeded.optionId);

    await assert.rejects(
      () => libDb.withDbTransaction(async (tx) => {
        await tx.run(
          "UPDATE dot_action_queue SET status = 'approved', approved_at = ? WHERE id = ? AND empresa_id = ?",
          [new Date().toISOString(), actionId, TENANT_B],
        );
        const inside = await tx.get('SELECT status FROM dot_action_queue WHERE id = ?', [actionId]);
        assert.equal(String(inside.status), 'approved', 'a transição precisa ser visível dentro da transação');
        throw new Error('falha simulada no meio da transação');
      }),
      /falha simulada/,
    );

    const row = await actionRow(TENANT_B, actionId);
    assert.equal(String(row.status), 'prepared');
    assert.equal(row.approved_at, null);
    assert.equal(await auditCount(TENANT_B, actionId), 0);
  });


  it('10. auditoria: fluxo prepare → approve → execute registra uma transição por etapa', async () => {
    const seeded = await seedDecision(TENANT_B, 'pending');
    const accessBefore = await db.get(
      "SELECT count(*)::int AS total FROM dot_access_audit WHERE empresa_id = ? AND action = 'execute' AND allowed = 1",
      [TENANT_B],
    );

    const prepared = await dotQueue.prepareDotActionFromDecision(TENANT_B, seeded.decisionId, seeded.optionId, 'user-b');
    assert.ok(prepared?.id, 'a preparação precisa devolver a ação criada');
    const approved = await dotQueue.approveDotAction(TENANT_B, prepared.id, 'user-b');
    assert.ok(approved);
    const executed = await dotQueue.executeDotAction(TENANT_B, prepared.id, 'user-b');
    assert.equal(executed.ok, true, `execução deveria funcionar: ${executed.reason}`);
    assert.equal(String(executed.status), 'executed');

    const events = await auditEvents(TENANT_B, prepared.id);
    assert.deepEqual(
      events.map((event: any) => String(event.event)),
      ['prepared', 'approved', 'execution_started', 'executed'],
      'cada etapa precisa gerar exatamente um registro de auditoria, na ordem',
    );
    for (const event of events) {
      assert.equal(String(event.actor_type), 'user');
      assert.equal(String(event.actor_id), 'user-b');
    }

    const grouped = await db.all(
      'SELECT event, count(*)::int AS total FROM dot_action_audit WHERE empresa_id = ? AND action_id = ? GROUP BY event ORDER BY event',
      [TENANT_B, prepared.id],
    );
    for (const row of grouped) assert.equal(Number(row.total), 1, `evento ${row.event} duplicado`);

    const accessAfter = await db.get(
      "SELECT count(*)::int AS total FROM dot_access_audit WHERE empresa_id = ? AND action = 'execute' AND allowed = 1",
      [TENANT_B],
    );
    assert.equal(
      Number(accessAfter.total) - Number(accessBefore.total),
      1,
      'a execução precisa registrar exatamente uma autorização de acesso',
    );

    const followUps = await db.all(
      'SELECT id, status FROM dot_followups WHERE empresa_id = ? AND action_id = ?',
      [TENANT_B, prepared.id],
    );
    assert.equal(followUps.length, 1);
  });

  it('11. preparação duplicada não cria duas ações ativas para a mesma decisão', async () => {
    const seeded = await seedDecision(TENANT_B, 'pending');
    const [first, second] = await Promise.all([
      dotQueue.prepareDotActionFromDecision(TENANT_B, seeded.decisionId, seeded.optionId, 'user-b'),
      dotQueue.prepareDotActionFromDecision(TENANT_B, seeded.decisionId, seeded.optionId, 'user-b'),
    ]);
    assert.ok(first?.id);
    assert.ok(second?.id);
    assert.equal(first!.id, second!.id, 'a preparação concorrente precisa convergir para a mesma ação');

    const rows = await db.all(
      'SELECT id, status FROM dot_action_queue WHERE empresa_id = ? AND decision_id = ?',
      [TENANT_B, seeded.decisionId],
    );
    assert.equal(rows.length, 1, 'o índice único parcial impede duas ações ativas na mesma decisão');
    assert.equal(String(rows[0].status), 'prepared');
  });

  it('12. migrações repetidas são seguras e idempotentes', async () => {
    const tablesBefore = await dotTableNames();
    assert.ok(tablesBefore.includes('dot_action_queue'));
    assert.ok(tablesBefore.includes('dot_access_audit'));

    const countsBefore = await dotTableCounts();
    await dotSchema.ensureDotSchema();
    await dotSchema.ensureDotSchema();
    await dotSchema.ensureDotSchema();

    assert.deepEqual(await dotTableNames(), tablesBefore, 'ensureDotSchema não pode criar/remover tabelas');
    assert.deepEqual(await dotTableCounts(), countsBefore, 'ensureDotSchema não pode alterar dados');
  });
});

