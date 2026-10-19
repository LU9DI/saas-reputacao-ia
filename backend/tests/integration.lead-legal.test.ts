/**
 * Testes de integração HTTP — captação de lead com consentimento + aceite legal.
 * Usa banco temporário isolado (não toca no database.sqlite de dev).
 * Não depende de DNS nem de serviços externos (n8n/e-mail ficam desconfigurados).
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDb = path.join(os.tmpdir(), `filtra-lead-legal-${Date.now()}.sqlite`);

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
  const { mountLeadRoutes } = await import('../routes/leadRoutes.js');
  const { mountLegalAcceptRoutes } = await import('../routes/legalAcceptRoutes.js');
  const { notFoundHandler, errorHandler } = await import('../middleware/errorHandler.js');

  await initDB();

  const e = express();
  e.use(cookieParser());
  e.use(express.json({ limit: '20kb' }));
  e.use(cors({ origin: true, credentials: true }));
  mountLeadRoutes(e);
  mountLegalAcceptRoutes(e);
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

describe('POST /api/legal/aceite', () => {
  it('exige aceite explícito', async () => {
    const { status, data } = await post('/api/legal/aceite', {
      email: 'sem-aceite@teste.com',
    });
    assert.equal(status, 400);
    assert.ok(data.error);
  });

  it('registra aceite de trial com versões vigentes', async () => {
    const { status, data } = await post('/api/legal/aceite', {
      aceito: true,
      contexto: 'trial',
      email: 'Aceite@Teste.com',
      plano: 'trial',
      preco_exibido: 'R$ 0,00',
      ciclo: 'mensal',
      metodo: 'click',
    });
    assert.equal(status, 200);
    assert.equal(data.ok, true);
    assert.equal(typeof data.registrado_em, 'string');
    assert.equal(data.versao_termos, '2026-09-15');
    assert.equal(data.versao_privacidade, '2026-09-15');
  });

  it('grava o aceite no audit log', async () => {
    const { getDb } = await import('../lib/db.js');
    const row: any = await getDb().get(
      `SELECT * FROM audit_logs WHERE action = 'legal.aceite_trial' ORDER BY id DESC LIMIT 1`
    );
    assert.ok(row);
    assert.equal(String(row.actor_user_id), 'aceite@teste.com');
    assert.equal(String(row.result), 'ok');
  });
});

describe('POST /api/lead', () => {
  it('rejeita captação sem consentimento explícito', async () => {
    const { status, data } = await post('/api/lead', {
      nome_empresa: 'Empresa Sem Consentimento',
      email: `sem-consent-${Date.now()}@teste.com`,
      senha: 'Senha@12x',
    });
    assert.equal(status, 400);
    assert.ok(data.error);
  });

  it('rejeita e-mail inválido mesmo com consentimento', async () => {
    const { status, data } = await post('/api/lead', {
      nome_empresa: 'Empresa Email Ruim',
      email: 'nao-e-email',
      senha: 'Senha@12x',
      consent: true,
    });
    assert.equal(status, 400);
    assert.ok(data.error);
  });

  it('captura lead com consentimento e ativa o trial', async () => {
    const email = `lead-${Date.now()}@teste.com`;
    const { status, data } = await post('/api/lead', {
      nome_empresa: 'Empresa Lead Teste',
      email,
      senha: 'Senha@12x',
      consent: true,
      source: 'teste-integracao',
    });
    assert.equal(status, 201);
    assert.equal(data.lead_captured, true);
    assert.ok(data.lead_id);
    assert.equal(data.success, true);
    assert.ok(data.empresa_id);
    assert.ok(data.slug);
    assert.ok(String(data.link_acesso).includes('/avaliacao/'));

    const { getDb } = await import('../lib/db.js');
    const lead: any = await getDb().get('SELECT * FROM leads WHERE lower(email) = lower(?)', [email]);
    assert.ok(lead);
    assert.equal(Number(lead.consent), 1);
    assert.ok(lead.consent_at);
  });
});
