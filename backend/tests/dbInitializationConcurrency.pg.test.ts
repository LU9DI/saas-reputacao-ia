/**
 * Teste real de inicialização concorrente em PostgreSQL descartável.
 *
 * Cenário: banco vazio + 3 processos Node independentes chamando `initDB()`
 * ao mesmo tempo. Valida que o advisory lock global serializa as migrações,
 * que nenhum processo falha, que nenhum DDL concorrente vaza para stderr e
 * que uma segunda inicialização é idempotente.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Client } from 'pg';
import { closeDB, getDb, initDB } from '../lib/db.js';
import { initPgDatabase } from '../lib/db.pg.js';
import {
  PG_MIGRATION_LOCK_KEY,
  indexExists,
  runCentralMigrations,
  tableColumns,
  tableExists,
} from '../lib/migrations.js';
import {
  assertNoDdlErrors,
  createTestDatabase,
  dropTestDatabase,
  parseWorkerJson,
  runNodeScript,
  serverVersion,
} from './helpers/pg-test-utils.js';

const INIT_WORKER = new URL('./helpers/init-db-worker.pg.ts', import.meta.url);

const REQUIRED_INDEXES = [
  'idx_reviews_empresa',
  'idx_empresas_cnpj',
  'idx_empresas_slug',
  'idx_usuarios_email',
  'idx_password_resets_usuario',
  'ux_dot_action_queue_decision_option',
  'ux_dot_action_queue_one_active_decision',
  'idx_dot_action_audit_empresa',
  'idx_dot_action_audit_action',
];

async function assertRequiredSchema(db: any, label: string) {
  for (const table of ['empresas', 'usuarios', 'reviews', 'ai_usage', 'usage', 'password_resets', 'dot_action_queue', 'dot_action_audit']) {
    assert.equal(await tableExists(db, table), true, `${label}: tabela ${table} deve existir`);
  }

  const reviewColumns = await tableColumns(db, 'reviews');
  assert.equal(reviewColumns.includes('createdat'), true, `${label}: reviews.createdAt ausente (${reviewColumns.join(',')})`);
  assert.equal(reviewColumns.includes('is_test'), true, `${label}: reviews.is_test ausente`);

  const userColumns = await tableColumns(db, 'usuarios');
  for (const column of ['email', 'mfa_secret', 'mfa_enabled', 'mfa_backup_hashes', 'mfa_pending_secret']) {
    assert.equal(userColumns.includes(column), true, `${label}: usuarios.${column} ausente (${userColumns.join(',')})`);
  }

  const auditColumns = await tableColumns(db, 'dot_action_audit');
  assert.equal(auditColumns.includes('metadata'), true, `${label}: dot_action_audit.metadata ausente`);

  const indexTables: Record<string, string> = {
    idx_reviews_empresa: 'reviews',
    idx_empresas_cnpj: 'empresas',
    idx_empresas_slug: 'empresas',
    idx_usuarios_email: 'usuarios',
    idx_password_resets_usuario: 'password_resets',
    ux_dot_action_queue_decision_option: 'dot_action_queue',
    ux_dot_action_queue_one_active_decision: 'dot_action_queue',
    idx_dot_action_audit_empresa: 'dot_action_audit',
    idx_dot_action_audit_action: 'dot_action_audit',
  };
  for (const index of REQUIRED_INDEXES) {
    assert.equal(await indexExists(db, indexTables[index], index), true, `${label}: índice ${index} ausente`);
  }
}

async function snapshot(db: any) {
  return {
    reviews: await tableColumns(db, 'reviews'),
    usuarios: await tableColumns(db, 'usuarios'),
    audit: await tableColumns(db, 'dot_action_audit'),
    indexes: REQUIRED_INDEXES.map(() => true),
  };
}

test('três processos inicializam um banco PostgreSQL vazio simultaneamente sem erro de DDL', async () => {
  const version = await serverVersion();
  console.log(`PostgreSQL real em uso: ${version}`);
  assert.ok(Number(version.split('.')[0]) >= 16, `PostgreSQL >= 16 esperado, recebido ${version}`);

  const { name, url } = await createTestDatabase('pg_init_concurrent');
  const previousUrl = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = url;

    // Banco começa vazio: nenhuma tabela pré-existente.
    const probe = await initPgDatabase(url);
    assert.equal(await tableExists(probe, 'reviews'), false, 'o banco de teste deve começar vazio');

    // Três processos independentes, cada um com seu próprio pool, partindo juntos.
    const results = await Promise.all([
      runNodeScript(INIT_WORKER, [], { DATABASE_URL: url }),
      runNodeScript(INIT_WORKER, [], { DATABASE_URL: url }),
      runNodeScript(INIT_WORKER, [], { DATABASE_URL: url }),
    ]);

    for (const [index, result] of results.entries()) {
      console.log(`worker ${index + 1}: exit=${result.code} stdout=${result.stdout} stderr=${result.stderr.trim()}`);
      assert.equal(result.code, 0, `worker ${index + 1} falhou com código ${result.code}\nstderr:\n${result.stderr}`);
      assertNoDdlErrors(result.stderr, `worker ${index + 1}`);
    }

    const payloads = results.map((result, index) => parseWorkerJson<any>(result, `worker ${index + 1}`));
    const pids = new Set(payloads.map((payload) => payload.pid));
    assert.equal(pids.size, 3, 'cada worker deve rodar em um processo Node próprio');
    for (const payload of payloads) {
      assert.equal(payload.engine, 'postgres');
      assert.ok(payload.serverVersion?.startsWith('16.'), `worker deve falar com PostgreSQL 16, recebeu ${payload.serverVersion}`);
      assert.ok(payload.indexes.idx_dot_action_audit_action, 'worker deve enxergar os índices de auditoria');
    }

    // Conferência independente (pool do processo de teste).
    await assertRequiredSchema(probe, 'após inicialização concorrente');
    const firstSnapshot = await snapshot(probe);

    // Segunda inicialização no mesmo banco: comprova idempotência.
    await runCentralMigrations(probe);
    await assertRequiredSchema(probe, 'segunda inicialização');
    const secondSnapshot = await snapshot(probe);
    assert.deepEqual(secondSnapshot, firstSnapshot, 'segunda inicialização não pode alterar o schema');
    console.log('idempotência comprovada: schema idêntico após segunda inicialização');

    // `initDB()` global também deve ser idempotente.
    await initDB();
    await assertRequiredSchema(getDb(), 'initDB() repetido');
    await probe.close();
    await closeDB();
  } finally {
    process.env.DATABASE_URL = previousUrl;
    await dropTestDatabase(name);
  }
});

test('falha deliberada de migração é propagada e o advisory lock é liberado', async () => {
  const { name, url } = await createTestDatabase('pg_init_failure');
  try {
    // Impede a criação de `reviews`: um objeto com o mesmo nome já existe.
    const blocker = new Client({ connectionString: url });
    await blocker.connect();
    await blocker.query('CREATE VIEW reviews AS SELECT 1 AS id');
    await blocker.end();

    const db = await initPgDatabase(url);
    try {
      await assert.rejects(
        () => runCentralMigrations(db),
        (error: any) => {
          console.log('erro propagado como esperado:', error?.message);
          return /reviews|exist|relation/i.test(String(error?.message || error));
        },
        'migração quebrada deve rejeitar a inicialização',
      );
    } finally {
      await db.close();
    }

    // O lock não pode ficar preso após a falha.
    const checker = new Client({ connectionString: url });
    await checker.connect();
    const lock = await checker.query('SELECT pg_try_advisory_lock($1) AS locked', [PG_MIGRATION_LOCK_KEY.toString()]);
    assert.equal(lock.rows[0].locked, true, 'advisory lock deve ter sido liberado no finally');
    await checker.query('SELECT pg_advisory_unlock($1)', [PG_MIGRATION_LOCK_KEY.toString()]);
    await checker.end();
  } finally {
    await dropTestDatabase(name);
  }
});
