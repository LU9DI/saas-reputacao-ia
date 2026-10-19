/**
 * Testes de integração HTTP — avaliações (reviews) + health.
 * Usa banco temporário isolado (não toca no database.sqlite de dev).
 * Não depende de DNS nem de serviços externos.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDb = path.join(os.tmpdir(), `filtra-reviews-${Date.now()}.sqlite`);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long!!';
process.env.SQLITE_DB_PATH = tmpDb;
process.env.APP_URL = 'http://localhost:3000';
process.env.ADMIN_EMAIL = 'admin-test@example.com';
process.env.ADMIN_PASSWORD = 'AdminTest@123';
delete process.env.N8N_WEBHOOK_URL;

let app: any;
let server: any;
let baseUrl = '';

before(async () => {
  const { default: express } = await import('express');
  const cors = (await import('cors')).default;
  const cookieParser = (await import('cookie-parser')).default;
  const { initDB } = await import('../lib/db.js');
  const { mountReviewRoutes } = await import('../routes/reviewRoutes.js');
  const { notFoundHandler, errorHandler } = await import('../middleware/errorHandler.js');

  await initDB();

  const e = express();
  e.use(cookieParser());
  e.use(express.json({ limit: '20kb' }));
  e.use(cors({ origin: true, credentials: true }));
  e.get('/api/health', (_req, res) => res.json({ ok: true }));
  mountReviewRoutes(e);
  e.use(notFoundHandler);
  e.use(errorHandler);

  app = e;
  await new Promise<void>((resolve) => {
    server = e.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise<void>((r) => server.close(() => r()));
  try {
    fs.unlinkSync(tmpDb);
  } catch {
    /* ok */
  }
});

async function post(pathName: string, body: unknown) {
  const res = await fetch(`${baseUrl}${pathName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

describe('GET /api/health', () => {
  it('responde ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
  });
});

describe('POST /api/reviews', () => {
  it('rejeita rating inválido', async () => {
    const { status, data } = await post('/api/reviews', {
      rating: 9,
      comment: 'x',
    });
    assert.equal(status, 400);
    assert.ok(data.error);
  });

  it('exige comentário para nota ≤ 3', async () => {
    const { status, data } = await post('/api/reviews', {
      rating: 2,
      name: 'Cliente',
    });
    assert.equal(status, 400);
    assert.ok(data.error);
  });

  it('aceita review 5 estrelas sem comentário', async () => {
    const { status, data } = await post('/api/reviews', {
      rating: 5,
      name: 'Cliente Feliz',
    });
    assert.equal(status, 201);
    assert.equal(data.success, true);
  });

  it('persiste unidade_id informado pelo link exclusivo da unidade', async () => {
    const { status, data } = await post('/api/reviews', {
      rating: 5,
      name: 'Cliente Unidade',
      unidade_id: 'u-link-1',
    });
    assert.equal(status, 201);
    assert.equal(data.success, true);
    const { getDb } = await import('../lib/db.js');
    const row = await getDb().get('SELECT unidade_id FROM reviews WHERE id = ?', [data.id]);
    assert.equal(row?.unidade_id, 'u-link-1');
  });
});
