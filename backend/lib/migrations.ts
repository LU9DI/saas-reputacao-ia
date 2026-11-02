/**
 * Inicialização central de schema (PostgreSQL e SQLite).
 *
 * Toda a DDL do núcleo vive aqui, em `runCentralMigrations`, e roda apenas
 * durante `initDB()`. Caminhos de requisição usam `requireSchema`/`assert*`
 * para *verificar* o schema e falhar explicitamente quando algo está ausente —
 * nunca para corrigi-lo silenciosamente.
 *
 * Idempotência: cada alteração consulta antes o catálogo (PostgreSQL) ou
 * `PRAGMA table_info`/`PRAGMA index_list` (SQLite). Nada presume que bancos
 * antigos compartilham o mesmo schema.
 */
import type { Database } from 'sqlite';
import type { PgDatabase } from './db.pg.js';

/**
 * Advisory lock global de migração PostgreSQL.
 *
 * Chave estável e documentada: FNV-1a 64 bits de
 * `filtra-ia:postgres:migrations:v1`, truncada para 63 bits (int8 positivo)
 * para caber em `pg_advisory_lock(bigint)`.
 *
 * Nunca altere este valor sem uma migração coordenada: processos antigos e
 * novos precisam disputar exatamente o mesmo lock.
 */
export const PG_MIGRATION_LOCK_KEY = 8005998760133593297n;

function isPgDatabase(db: Database): db is Database & PgDatabase {
  return typeof (db as unknown as Partial<PgDatabase>).withMigrationLock === 'function';
}

/** Nomes reais das colunas (caixa preservada). Vazio quando a tabela não existe. */
export async function tableColumnNames(db: Database, table: string): Promise<string[]> {
  const rows = await db.all(`PRAGMA table_info(${table})`);
  return (rows || []).map((row: any) => String(row.name));
}

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Colunas de uma tabela, minúsculas. Vazio quando a tabela não existe. */
export async function tableColumns(db: Database, table: string): Promise<string[]> {
  const rows = await db.all(`PRAGMA table_info(${table})`);
  return (rows || []).map((row: any) => String(row.name).toLowerCase());
}

export async function tableExists(db: Database, table: string): Promise<boolean> {
  return (await tableColumns(db, table)).length > 0;
}

export async function columnExists(db: Database, table: string, column: string): Promise<boolean> {
  return (await tableColumns(db, table)).includes(column.toLowerCase());
}

export async function indexExists(db: Database, table: string, index: string): Promise<boolean> {
  if (isPgDatabase(db)) {
    const row = await db.get(
      `SELECT 1 AS ok FROM pg_indexes WHERE schemaname = 'public' AND lower(indexname) = ? LIMIT 1`,
      [index.toLowerCase()],
    );
    return Boolean(row);
  }
  const rows = await db.all(`PRAGMA index_list(${table})`);
  return (rows || []).some((row: any) => String(row.name).toLowerCase() === index.toLowerCase());
}

export type SchemaRequirements = {
  tables?: string[];
  columns?: Record<string, string[]>;
  indexes?: Array<{ table: string; name: string }>;
};

/**
 * Verifica estruturas obrigatórias sem executar DDL.
 * Registra o problema e lança erro explícito quando algo está ausente.
 */
export async function requireSchema(db: Database, requirements: SchemaRequirements): Promise<void> {
  const missing: string[] = [];

  for (const table of requirements.tables || []) {
    if (!(await tableExists(db, table))) missing.push(`tabela ${table}`);
  }

  for (const [table, columns] of Object.entries(requirements.columns || {})) {
    if (!(await tableExists(db, table))) {
      missing.push(`tabela ${table}`);
      continue;
    }
    const existing = await tableColumns(db, table);
    for (const column of columns) {
      if (!existing.includes(column.toLowerCase())) missing.push(`coluna ${table}.${column}`);
    }
  }

  for (const index of requirements.indexes || []) {
    if (!(await indexExists(db, index.table, index.name))) {
      missing.push(`índice ${index.name} (${index.table})`);
    }
  }

  if (missing.length > 0) {
    const detail = missing.join(', ');
    console.error(`[schema] Estruturas obrigatórias ausentes: ${detail}`);
    throw new Error(
      `Schema desatualizado: ${detail}. Execute initDB()/runCentralMigrations() antes de usar este recurso.`,
    );
  }
}

/**
 * Colunas de `reviews` que a aplicação usa. A DDL de todas elas vive nesta
 * migração central; os serviços apenas verificam a existência com
 * `requireReviewSchema`/`requireSchema`.
 */
export const REVIEW_COLUMNS = [
  'createdAt',
  'is_test',
  'ip_hash',
  'fraud_flags',
  'origin',
  'client_whatsapp',
  'sentiment',
  'sentiment_score',
  'sentiment_source',
  'locale',
  'unidade_id',
  'treated_at',
  'treated_note',
] as const;

export type ReviewColumn = (typeof REVIEW_COLUMNS)[number];

/** Verificação (sem DDL) das colunas de reviews usadas por um serviço. */
export async function requireReviewSchema(
  db: Database,
  columns: readonly string[] = REVIEW_COLUMNS,
): Promise<void> {
  await requireSchema(db, { columns: { reviews: [...columns] } });
}

/** Definições reais de índices (nome, tabela, DDL), sem placeholders. */
export type IndexDefinition = {
  name: string;
  table: string;
  definition: string;
  unique: boolean;
};

function normalizeIndexDefinition(definition: string): string {
  return String(definition || '').replace(/\s+/g, ' ').trim();
}

/**
 * Snapshot real dos índices. PostgreSQL: `pg_indexes` (indexname, tablename,
 * indexdef). SQLite: `PRAGMA index_list` + `sqlite_master` (e `PRAGMA
 * index_info` para índices automáticos sem DDL).
 */
export async function listIndexDefinitions(
  db: Database,
  tables?: readonly string[],
): Promise<IndexDefinition[]> {
  const allowed = tables ? new Set(tables) : null;
  if (isPgDatabase(db)) {
    const rows = await db.all(
      `SELECT indexname AS name, tablename AS table, indexdef AS definition
         FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname`,
    );
    return (rows as any[])
      .map((row) => ({
        name: String(row.name),
        table: String(row.table),
        definition: normalizeIndexDefinition(String(row.definition)),
        unique: /^CREATE UNIQUE INDEX/i.test(String(row.definition)),
      }))
      .filter((row) => !allowed || allowed.has(row.table));
  }

  const tableRows: any[] = await db.all(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  );
  const result: IndexDefinition[] = [];
  for (const tableRow of tableRows) {
    const table = String(tableRow.name);
    if (allowed && !allowed.has(table)) continue;
    const indexes: any[] = await db.all(`PRAGMA index_list(${table})`);
    for (const index of indexes || []) {
      const name = String(index.name);
      const master: any = await db.get(
        `SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?`,
        [name],
      );
      let definition = master?.sql ? String(master.sql) : '';
      if (!definition) {
        const info: any[] = await db.all(`PRAGMA index_info(${name})`);
        const columns = (info || []).map((column) => String(column.name)).join(', ');
        definition = `CREATE ${Number(index.unique) ? 'UNIQUE ' : ''}INDEX ${name} ON ${table} (${columns})`;
      }
      result.push({
        name,
        table,
        definition: normalizeIndexDefinition(definition),
        unique: Boolean(Number(index.unique)),
      });
    }
  }
  return result.sort((a, b) => a.table.localeCompare(b.table) || a.name.localeCompare(b.name));
}

async function createTableIfMissing(db: Database, table: string, ddl: string): Promise<void> {
  if (await tableExists(db, table)) return;
  await db.exec(ddl);
}

async function addColumnIfMissing(
  db: Database,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  if (await columnExists(db, table, column)) return;
  await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function createIndexIfMissing(
  db: Database,
  table: string,
  name: string,
  ddl: string,
): Promise<void> {
  if (await indexExists(db, table, name)) return;
  await db.exec(ddl);
}

async function migrateCoreTables(db: Database): Promise<void> {
  await createTableIfMissing(
    db,
    'empresas',
    `CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      cnpj TEXT UNIQUE NOT NULL,
      nome_empresa TEXT NOT NULL,
      slug TEXT UNIQUE,
      status TEXT DEFAULT 'trial',
      plan TEXT DEFAULT 'trial',
      criado_em TIMESTAMPTZ NOT NULL,
      expira_em TIMESTAMPTZ NOT NULL,
      google_review_url TEXT,
      voice_style TEXT,
      empresa_pai_id TEXT,
      whatsapp_suporte TEXT
    )`,
  );

  await createTableIfMissing(
    db,
    'usuarios',
    `CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      cnpj TEXT NOT NULL,
      nome_funcionario TEXT NOT NULL,
      empresa_id TEXT NOT NULL,
      senha_hash TEXT NOT NULL
    )`,
  );

  await createTableIfMissing(
    db,
    'reviews',
    `CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT,
      name TEXT,
      rating INTEGER,
      comment TEXT,
      ai_reply TEXT,
      ai_tags TEXT,
      createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await createTableIfMissing(
    db,
    'ai_usage',
    `CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT,
      tipo TEXT NOT NULL,
      tokens INTEGER NOT NULL DEFAULT 0,
      criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await createTableIfMissing(
    db,
    'usage',
    `CREATE TABLE IF NOT EXISTS usage (
      plan TEXT NOT NULL,
      month TEXT NOT NULL,
      tags INTEGER DEFAULT 0,
      respostas INTEGER DEFAULT 0,
      PRIMARY KEY (plan, month)
    )`,
  );

  await createIndexIfMissing(
    db,
    'reviews',
    'idx_reviews_empresa',
    'CREATE INDEX IF NOT EXISTS idx_reviews_empresa ON reviews(empresa_id)',
  );
  await createIndexIfMissing(
    db,
    'empresas',
    'idx_empresas_cnpj',
    'CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj)',
  );
  await createIndexIfMissing(
    db,
    'empresas',
    'idx_empresas_slug',
    'CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug)',
  );
}

/**
 * Migra a data de criação das avaliações preservando a série histórica.
 *
 * Variantes encontradas em bancos reais:
 * - `createdAt` — DDL original (`initDB`) no SQLite, que preserva a caixa;
 * - `createdat` — a mesma DDL no PostgreSQL, onde identificador sem aspas é
 *   dobrado para minúsculas;
 * - `created_at` — schemas antigos/hand-made em snake_case.
 *
 * O canônico é o nome que as consultas da aplicação (`createdAt` sem aspas)
 * realmente resolvem em cada dialeto: `createdat` no PostgreSQL e `createdAt`
 * no SQLite. A coluna só é criada sem DEFAULT e preenchida por backfill, para
 * que `NOW()` jamais substitua uma data histórica válida; o default (PostgreSQL)
 * é aplicado depois, valendo apenas para linhas futuras.
 */
async function migrateReviewsCreatedAt(db: Database): Promise<void> {
  const pg = isPgDatabase(db);
  const actual = await tableColumnNames(db, 'reviews');
  if (actual.length === 0) return;

  const lower = new Set(actual.map((name) => name.toLowerCase()));
  const canonical = pg ? 'createdat' : 'createdAt';

  // Em SQLite identificadores são case-insensitive: `createdat` já atende as
  // consultas `createdAt` e não se pode criar outra coluna com o mesmo nome
  // (SQLite rejeitaria como duplicada).
  const hasCanonical = pg ? actual.includes(canonical) : lower.has('createdat');

  if (!hasCanonical) {
    await db.exec(
      `ALTER TABLE reviews ADD COLUMN ${canonical} ${pg ? 'TIMESTAMPTZ' : 'DATETIME'}`,
    );
    actual.push(canonical);
  }

  const canonicalName = pg
    ? canonical
    : actual.find((name) => name.toLowerCase() === 'createdat') || canonical;

  // Fontes históricas distintas do canônico. A ordem preserva a semântica
  // original da aplicação (`createdAt`, depois `created_at`).
  const sources = actual.filter((name) => {
    if (name === canonicalName) return false;
    const normalized = name.toLowerCase();
    return normalized === 'createdat' || normalized === 'created_at';
  });
  sources.sort((a, b) => {
    const rank = (name: string) => (name === 'createdAt' ? 0 : name.toLowerCase() === 'created_at' ? 1 : 2);
    return rank(a) - rank(b);
  });

  for (const source of sources) {
    // Só preenche lacunas: datas já existentes na coluna canônica nunca são
    // sobrescritas por backfill.
    await db.exec(
      `UPDATE reviews SET ${quoteIdentifier(canonicalName)} = ${quoteIdentifier(source)} ` +
        `WHERE ${quoteIdentifier(canonicalName)} IS NULL AND ${quoteIdentifier(source)} IS NOT NULL`,
    );
  }

  if (pg) {
    // Aplicado depois do backfill, então não afeta nenhuma linha existente.
    await db.exec(
      `ALTER TABLE reviews ALTER COLUMN ${quoteIdentifier(canonicalName)} SET DEFAULT CURRENT_TIMESTAMP`,
    );
  }
}

async function migrateReviewsColumns(db: Database): Promise<void> {
  await migrateReviewsCreatedAt(db);
  // Tipos compatíveis com SQLite e PostgreSQL; o adapter traduz REAL para
  // DOUBLE PRECISION no PostgreSQL. Nenhuma coluna existente é recriada.
  const definitions: Record<string, string> = {
    is_test: 'INTEGER DEFAULT 0',
    ip_hash: 'TEXT',
    fraud_flags: 'TEXT',
    origin: 'TEXT',
    client_whatsapp: 'TEXT',
    sentiment: 'TEXT',
    sentiment_score: 'REAL',
    sentiment_source: 'TEXT',
    locale: 'TEXT',
    unidade_id: 'TEXT',
    treated_at: 'TIMESTAMPTZ',
    treated_note: 'TEXT',
  };
  for (const [column, definition] of Object.entries(definitions)) {
    await addColumnIfMissing(db, 'reviews', column, definition);
  }
}

async function migrateAuthSchema(db: Database): Promise<void> {
  await addColumnIfMissing(db, 'usuarios', 'email', 'TEXT');

  await createTableIfMissing(
    db,
    'password_resets',
    `CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expira_em TIMESTAMPTZ NOT NULL,
      usado INTEGER DEFAULT 0,
      criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await createIndexIfMissing(
    db,
    'usuarios',
    'idx_usuarios_email',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
  );
  await createIndexIfMissing(
    db,
    'password_resets',
    'idx_password_resets_usuario',
    'CREATE INDEX IF NOT EXISTS idx_password_resets_usuario ON password_resets(usuario_id, usado)',
  );
}

async function migrateMfaSchema(db: Database): Promise<void> {
  await addColumnIfMissing(db, 'usuarios', 'mfa_secret', 'TEXT');
  await addColumnIfMissing(db, 'usuarios', 'mfa_enabled', 'INTEGER DEFAULT 0');
  await addColumnIfMissing(db, 'usuarios', 'mfa_backup_hashes', 'TEXT');
  await addColumnIfMissing(db, 'usuarios', 'mfa_pending_secret', 'TEXT');
}

async function migrateDotActionSchema(db: Database): Promise<void> {
  await createTableIfMissing(
    db,
    'dot_action_queue',
    `CREATE TABLE IF NOT EXISTS dot_action_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT NOT NULL,
      decision_id INTEGER NOT NULL,
      option_id TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'prepared',
      approved_at TEXT,
      executed_at TEXT,
      error TEXT,
      created_at TEXT NOT NULL
    )`,
  );
  await createIndexIfMissing(
    db,
    'dot_action_queue',
    'ux_dot_action_queue_decision_option',
    'CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_action_queue_decision_option ON dot_action_queue(empresa_id, decision_id, option_id)',
  );
  await createIndexIfMissing(
    db,
    'dot_action_queue',
    'ux_dot_action_queue_one_active_decision',
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_action_queue_one_active_decision ON dot_action_queue(empresa_id, decision_id) WHERE status IN ('prepared','approved','executing')",
  );

  await createTableIfMissing(
    db,
    'dot_action_audit',
    `CREATE TABLE IF NOT EXISTS dot_action_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT NOT NULL,
      action_id INTEGER NOT NULL,
      decision_id INTEGER,
      event TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      actor_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    )`,
  );
  // Bancos criados antes do campo metadata: CREATE TABLE IF NOT EXISTS não
  // altera tabelas existentes, por isso a verificação explícita.
  await addColumnIfMissing(db, 'dot_action_audit', 'metadata', 'TEXT');
  await createIndexIfMissing(
    db,
    'dot_action_audit',
    'idx_dot_action_audit_empresa',
    'CREATE INDEX IF NOT EXISTS idx_dot_action_audit_empresa ON dot_action_audit(empresa_id, created_at)',
  );
  await createIndexIfMissing(
    db,
    'dot_action_audit',
    'idx_dot_action_audit_action',
    'CREATE INDEX IF NOT EXISTS idx_dot_action_audit_action ON dot_action_audit(empresa_id, action_id, created_at)',
  );
}

/**
 * Sequência central de inicialização. Idempotente.
 * Em PostgreSQL roda inteira sob o advisory lock global, em uma conexão
 * dedicada, garantindo que processos concorrentes não executem DDL ao mesmo
 * tempo.
 */
export async function runCentralMigrations(db: Database): Promise<void> {
  const execute = async (db: Database) => {
    await migrateCoreTables(db);
    await migrateReviewsColumns(db);
    await migrateAuthSchema(db);
    await migrateMfaSchema(db);
    await migrateDotActionSchema(db);
  };

  if (isPgDatabase(db)) {
    await db.withMigrationLock(PG_MIGRATION_LOCK_KEY, (scoped) => execute(scoped));
    return;
  }

  await execute(db);
}
