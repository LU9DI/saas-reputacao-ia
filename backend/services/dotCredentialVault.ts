import crypto from 'crypto';
import { getDb } from '../lib/db.js';
import type { DotIntegrationProvider } from './dotIntegrationRegistry.js';

const KEY_ENV = 'DOT_INTEGRATION_ENCRYPTION_KEY';

function encryptionKey(): Buffer {
  const raw = process.env[KEY_ENV]?.trim();
  if (!raw) throw new Error('DOT_INTEGRATION_ENCRYPTION_KEY não configurada.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('DOT_INTEGRATION_ENCRYPTION_KEY deve ser uma chave base64 de 32 bytes.');
  return key;
}

export type DotCredentialKind = 'access_token' | 'refresh_token' | 'client_secret' | 'api_key';

export async function ensureDotCredentialVaultSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_integration_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    kind TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    expires_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    revoked_at TEXT
  )`);
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_credentials_scope ON dot_integration_credentials(empresa_id, provider, kind)');
}

function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

function decrypt(row: { ciphertext: string; iv: string; auth_tag: string }) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(row.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(row.auth_tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(row.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

export async function putDotCredential(input: {
  empresaId: string;
  provider: DotIntegrationProvider;
  kind: DotCredentialKind;
  value: string;
  expiresAt?: string | null;
}) {
  if (!input.value?.trim()) throw new Error('Credencial vazia.');
  await ensureDotCredentialVaultSchema();
  const db = getDb();
  const encrypted = encrypt(input.value);
  const now = new Date().toISOString();
  const existing = await db.get(
    'SELECT id FROM dot_integration_credentials WHERE empresa_id=? AND provider=? AND kind=? LIMIT 1',
    [input.empresaId, input.provider, input.kind],
  );
  if (existing) {
    await db.run(
      'UPDATE dot_integration_credentials SET ciphertext=?, iv=?, auth_tag=?, expires_at=?, revoked_at=NULL, updated_at=? WHERE id=? AND empresa_id=?',
      [encrypted.ciphertext, encrypted.iv, encrypted.authTag, input.expiresAt || null, now, existing.id, input.empresaId],
    );
  } else {
    await db.run(
      'INSERT INTO dot_integration_credentials (empresa_id,provider,kind,ciphertext,iv,auth_tag,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [input.empresaId, input.provider, input.kind, encrypted.ciphertext, encrypted.iv, encrypted.authTag, input.expiresAt || null, now, now],
    );
  }
}

export async function getDotCredential(empresaId: string, provider: DotIntegrationProvider, kind: DotCredentialKind, options?: { allowExpired?: boolean }) {
  await ensureDotCredentialVaultSchema();
  const row = await getDb().get(
    'SELECT ciphertext, iv, auth_tag, expires_at, revoked_at FROM dot_integration_credentials WHERE empresa_id=? AND provider=? AND kind=? LIMIT 1',
    [empresaId, provider, kind],
  );
  if (!row || row.revoked_at) return null;
  if (!options?.allowExpired && row.expires_at && new Date(String(row.expires_at)).getTime() <= Date.now()) return null;
  return { value: decrypt(row), expiresAt: row.expires_at || null };
}

export async function revokeDotCredentials(empresaId: string, provider: DotIntegrationProvider) {
  await ensureDotCredentialVaultSchema();
  await getDb().run(
    'UPDATE dot_integration_credentials SET revoked_at=?, updated_at=? WHERE empresa_id=? AND provider=? AND revoked_at IS NULL',
    [new Date().toISOString(), new Date().toISOString(), empresaId, provider],
  );
}
