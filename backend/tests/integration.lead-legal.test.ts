/**
 * Testes HTTP focados para o aceite legal.
 * Usa Express real e um adaptador de auditoria em memória; não abre nem altera banco.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let server: any;
let baseUrl = '';
const auditEvents: any[] = [];

before(async () => {
  const { default: express } = await import('express');
  const { mountLegalAcceptRoutes } = await import('../routes/legalAcceptRoutes.js');

  const app = express();
  app.use(express.json({ limit: '20kb' }));
  mountLegalAcceptRoutes(app, {
    getDb: () => ({} as any),
    writeAuditFromReq: async (_db, _req, event) => {
      auditEvents.push(event);
    },
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function post(body: unknown) {
  const response = await fetch(`${baseUrl}/api/legal/aceite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    data: await response.json().catch(() => ({} as any)),
  };
}

describe('POST /api/legal/aceite', () => {
  it('rejeita aceite ausente ou falso sem gravar auditoria', async () => {
    auditEvents.length = 0;

    const absent = await post({ email: 'cliente@example.com' });
    assert.equal(absent.status, 400);
    assert.match(absent.data.error, /Aceite obrigatório/i);

    const declined = await post({ aceito: false });
    assert.equal(declined.status, 400);
    assert.equal(auditEvents.length, 0);
  });

  it('registra aceite de trial com email normalizado e versões padrão', async () => {
    auditEvents.length = 0;

    const { status, data } = await post({
      aceito: true,
      contexto: 'trial',
      email: 'CLIENTE@EXAMPLE.COM',
      empresa_id: 'empresa-test-1',
      plano: 'Corporativo',
      preco_exibido: 'R$ 199,90',
      ciclo: 'mensal',
      metodo: 'checkbox',
    });

    assert.equal(status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.versao_termos, '2026-09-15');
    assert.equal(data.versao_privacidade, '2026-09-15');
    assert.ok(Number.isFinite(Date.parse(data.registrado_em)));
    assert.equal(auditEvents.length, 1);

    const event = auditEvents[0];
    assert.equal(event.action, 'legal.aceite_trial');
    assert.equal(event.actor_user_id, 'cliente@example.com');
    assert.equal(event.empresa_id, 'empresa-test-1');
    assert.equal(event.target, 'Corporativo');
    assert.equal(event.result, 'ok');
    assert.deepEqual(event.detail, {
      email: 'cliente@example.com',
      plano: 'Corporativo',
      preco_exibido: 'R$ 199,90',
      ciclo: 'mensal',
      contexto: 'trial',
      versao_termos: '2026-09-15',
      versao_privacidade: '2026-09-15',
      metodo: 'checkbox',
    });
  });

  it('registra aceite de checkout e respeita versões fornecidas', async () => {
    auditEvents.length = 0;

    const { status, data } = await post({
      aceito: true,
      contexto: 'checkout',
      email: 'billing@example.com',
      versao_termos: 'termos-v3',
      versao_privacidade: 'privacidade-v2',
    });

    assert.equal(status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.versao_termos, 'termos-v3');
    assert.equal(data.versao_privacidade, 'privacidade-v2');
    assert.equal(auditEvents.length, 1);
    assert.equal(auditEvents[0].action, 'legal.aceite_checkout');
    assert.equal(auditEvents[0].target, 'checkout');
    assert.equal(auditEvents[0].detail.contexto, 'checkout');
    assert.equal(auditEvents[0].detail.versao_termos, 'termos-v3');
    assert.equal(auditEvents[0].detail.versao_privacidade, 'privacidade-v2');
  });
});
