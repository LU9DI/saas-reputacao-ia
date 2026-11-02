/**
 * Banco: Postgres em produção (obrigatório).
 * SQLite só em dev (import dinâmico — não quebra Docker sem sqlite3).
 */
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import type { Database } from 'sqlite';
import { fileURLToPath } from 'url';
import { initPgDatabase, isPostgresUrl, asSqliteDb, type PgDatabase } from './db.pg.js';
import { runCentralMigrations } from './migrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';

let _db: Database | null = null;
let _engine: 'sqlite' | 'postgres' = 'sqlite';

export function getDb(): Database {
  if (!_db) throw new Error('Banco ainda não inicializado. Chame initDB() primeiro.');
  return _db;
}

export function dbEngine(): 'sqlite' | 'postgres' {
  return _engine;
}

export async function withDbTransaction<T>(work: (tx: Database) => Promise<T>): Promise<T> {
  const db = getDb();
  const transaction = (db as unknown as Partial<PgDatabase>).transaction;
  if (typeof transaction === 'function') return transaction((tx) => work(tx as unknown as Database));
  await db.run('BEGIN');
  try {
    const result = await work(db);
    await db.run('COMMIT');
    return result;
  } catch (error) {
    try { await db.run('ROLLBACK'); } catch { /* preserve original error */ }
    throw error;
  }
}

export async function pingDb(): Promise<{ ok: boolean; engine: string; error?: string }> {
  try {
    const db = getDb();
    await db.get('SELECT 1 AS ok');
    return { ok: true, engine: _engine };
  } catch (e: any) {
    return { ok: false, engine: _engine, error: String(e?.message || e) };
  }
}

async function initSqlite(): Promise<Database> {
  let sqlite3: any;
  let open: any;
  try {
    sqlite3 = (await import('sqlite3')).default;
    open = (await import('sqlite')).open;
  } catch {
    throw new Error(
      'SQLite não instalado. Use DATABASE_URL=postgresql://... ou npm i -D sqlite sqlite3'
    );
  }

  const dbPath =
    process.env.SQLITE_DB_PATH ||
    path.resolve(__dirname, '..', '..', 'data', 'database.sqlite');

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  _engine = 'sqlite';
  console.log(`💾 SQLite: ${dbPath}`);
  return db as Database;
}

async function initPostgres(): Promise<Database> {
  const url = process.env.DATABASE_URL!.trim();
  const pg = await initPgDatabase(url);
  _engine = 'postgres';
  console.log('🐘 Postgres conectado (DATABASE_URL)');
  return asSqliteDb(pg);
}

export async function initDB(): Promise<Database> {
  const url = process.env.DATABASE_URL?.trim();

  if (isPostgresUrl(url)) {
    _db = await initPostgres();
  } else if (isProd && process.env.SQLITE_ALLOW_PROD !== '1') {
    throw new Error(
      'Produção exige DATABASE_URL Postgres. Defina no Render ou SQLITE_ALLOW_PROD=1.'
    );
  } else {
    if (isProd) {
      console.warn('⚠️  SQLITE_ALLOW_PROD=1 — disco efêmero pode apagar dados.');
    }
    _db = await initSqlite();
  }

  // Inicialização central: toda a DDL do núcleo roda aqui, uma única vez,
  // sob advisory lock global no PostgreSQL. Requisições nunca migram schema.
  await runCentralMigrations(_db!);
  console.log('Schema inicializado (migrações centrais idempotentes)');

  const adminMail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || '';
  if (adminMail && adminPass.length >= 12) {
    const adminExiste = await _db.get('SELECT id FROM usuarios WHERE email = ?', [adminMail]);
    if (!adminExiste) {
      const hash = await bcrypt.hash(adminPass, 12);
      try {
        await _db.run(
          'INSERT INTO usuarios (id, cnpj, nome_funcionario, empresa_id, senha_hash, email) VALUES (?, ?, ?, ?, ?, ?)',
          [crypto.randomUUID(), '00000000000000', 'Admin', 'admin', hash, adminMail]
        );
        console.log(`🔑 Admin criado: ${adminMail}`);
      } catch (e: any) {
        console.warn('Admin seed:', e?.message || e);
      }
    }
  }

  return _db;
}

/**
 * Encerra o pool/conexão da instância ativa deste módulo.
 * Necessário para testes que criam e descartam bancos independentes.
 */
export async function closeDB(): Promise<void> {
  const db = _db;
  _db = null;
  if (!db) return;
  const close = (db as unknown as { close?: () => Promise<void> }).close;
  if (typeof close === 'function') await close();
}

export async function findEmpresa(ref: string) {
  const db = getDb();
  if (!ref) return null;
  const porId = await db.get('SELECT * FROM empresas WHERE id = ?', [ref]);
  if (porId) return porId;
  return db.get('SELECT * FROM empresas WHERE slug = ?', [ref]);
}

export function slugify(texto: string): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'empresa'
  );
}

export async function slugUnico(base: string): Promise<string> {
  const db = getDb();
  let slug = base;
  let n = 0;
  while (true) {
    const existe = await db.get('SELECT id FROM empresas WHERE slug = ?', [slug]);
    if (!existe) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}
