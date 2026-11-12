import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * E2E de `/dot/conversa` com APIs controladas.
 *
 * Nenhuma requisição sai deste processo para a API real: todas as bases do
 * failover são interceptadas (`page.route`) e a base canônica de produção é
 * bloqueada explicitamente — se o navegador tentar alcançá-la, o teste falha.
 *
 * As bases usadas correspondem ao build de teste:
 *   NEXT_PUBLIC_API_URL        = http://127.0.0.1:5000
 *   NEXT_PUBLIC_API_URL_BACKUP = http://127.0.0.1:5001
 */

const PRIMARY = 'http://127.0.0.1:5000';
const BACKUP = 'http://127.0.0.1:5001';
const PRODUCTION_HOST = 'api.filtraai.com';

const CHAT = '/api/dot/chat';
const STATUS = '/api/dot/status';

// `PwaRegister` registra `/sw.js`; depois que o service worker assume o
// controle da página ele intermedeia os fetches e `page.route` deixa de
// interceptá-los (a partir do segundo carregamento). Bloquear o SW apenas
// neste arquivo mantém os mocks determinísticos sem alterar o comportamento
// dos testes de GA4, que dependem do SW estar ativo.
test.use({ serviceWorkers: 'block' });

type Captured = {
  base: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
};

type ChatReply = { status: number; body: Record<string, unknown> };

function baseUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
}

function encode(part: unknown): string {
  return Buffer.from(JSON.stringify(part)).toString('base64url');
}

const TOKEN_A = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
  id: 'user-a',
  empresa_id: 'empresa-a',
})}.e2e-signature`;
const TOKEN_B = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
  id: 'user-b',
  empresa_id: 'empresa-b',
})}.e2e-signature`;

function corsHeaders(route: Route): Record<string, string> {
  const origin = route.request().headers()['origin'] || 'http://127.0.0.1:3000';
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers':
      'authorization,content-type,x-dot-csrf,x-idempotency-key',
    'access-control-expose-headers': 'x-request-id,idempotency-replayed,retry-after',
  };
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    headers: { ...corsHeaders(route), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Registra um mock que responde preflight e delega GET/POST ao handler. */
async function mockApi(
  page: Page,
  path: string,
  handler: (route: Route, request: Captured) => Promise<void> | void,
) {
  await page.route(new RegExp(`:(5000|5001)${path.replace(/\//g, '\\/')}(?:\\?.*)?$`), async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders(route) });
      return;
    }
    const request = route.request();
    const rawBody = request.postData();
    const captured: Captured = {
      base: baseUrl(request.url()),
      method: request.method(),
      headers: request.headers(),
      body: rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null,
    };
    await handler(route, captured);
  });
}

function chatOk(message: string): ChatReply {
  return {
    status: 200,
    body: {
      ok: true,
      message,
      provider: 'groq',
      tokens_used: 42,
      latency_ms: 123,
    },
  };
}

function statusOk(): { status: number; body: Record<string, unknown> } {
  return {
    status: 200,
    body: { access: true, enabled: true, plan: 'rei', plan_label: 'Rei', plan_identified: true },
  };
}

/** Instala as guardas comuns: nenhuma chamada real à produção e sem GA. */
async function installGlobalGuards(page: Page) {
  const productionAttempts: string[] = [];
  await page.route(new RegExp(`https://${PRODUCTION_HOST.replace(/\./g, '\\.')}/.*`), async (route) => {
    productionAttempts.push(route.request().url());
    await route.abort('blockedbyclient');
  });
  await page.route('**/googletagmanager.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }),
  );
  await page.route('**/google-analytics.com/**', (route) => route.fulfill({ status: 204, body: '' }));
  return productionAttempts;
}

async function seedSession(page: Page, token: string | null, extra: Record<string, string> = {}) {
  await page.goto('/robots.txt');
  await page.evaluate(
    ({ token, extra }) => {
      localStorage.clear();
      localStorage.setItem('filtra_consent_v1', 'denied');
      if (token) localStorage.setItem('filtra_token', token);
      for (const [key, value] of Object.entries(extra)) localStorage.setItem(key, value);
    },
    { token, extra },
  );
  await page.goto('/dot/conversa');
}

async function switchToken(page: Page, token: string) {
  // Troca somente a identidade: o armazenamento do tenant anterior permanece
  // intacto para provar que ele não vaza para o novo usuário.
  await page.goto('/robots.txt');
  await page.evaluate((value) => localStorage.setItem('filtra_token', value), token);
  await page.goto('/dot/conversa');
}

async function openConversation(page: Page, token: string = TOKEN_A) {
  await seedSession(page, token);
  await expect(page.getByRole('heading', { level: 1, name: /Conversa com o Filtra Dot/i })).toBeVisible();
}

async function storageSnapshot(page: Page) {
  return page.evaluate(() => {
    const out: Record<string, string | null> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key) out[key] = localStorage.getItem(key);
    }
    return out;
  });
}

async function sendMessage(page: Page, text: string) {
  const box = page.getByLabel('Mensagem para o Filtra Dot');
  await box.fill(text);
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
}

test.describe('Filtra Dot — /dot/conversa', () => {
  test('1. acesso autenticado exibe a conversa e o plano', async ({ page }) => {
    const productionAttempts = await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    await mockApi(page, CHAT, async (route) => fulfillJson(route, 200, chatOk('Olá').body));

    await openConversation(page);

    await expect(page.getByRole('heading', { level: 1, name: /Conversa com o Filtra Dot/i })).toBeVisible();
    await expect(page.getByText('Plano Rei')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Administração' })).toHaveAttribute('href', '/dot');
    await expect(page.getByLabel('Mensagem para o Filtra Dot')).toBeEditable();
    expect(productionAttempts).toEqual([]);
  });

  test('2. usuário sem autenticação não chega a chamar a API', async ({ page }) => {
    const productionAttempts = await installGlobalGuards(page);
    const calls: string[] = [];
    await page.route(/\/api\/dot\/(status|chat)/, async (route) => {
      calls.push(route.request().url());
      await route.abort('blockedbyclient');
    });

    await seedSession(page, null);

    await expect(page.getByRole('heading', { level: 1, name: /Sessão expirada/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar novamente' })).toHaveAttribute('href', '/login');
    await expect(page.getByLabel('Mensagem para o Filtra Dot')).toHaveCount(0);
    expect(calls).toEqual([]);
    expect(productionAttempts).toEqual([]);
  });

  test('3. histórico, sessão e outbox ficam isolados por empresa/usuário', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    let failChat = false;
    const bodies: Array<Record<string, unknown> | null> = [];
    await mockApi(page, CHAT, async (route, request) => {
      bodies.push(request.body);
      if (failChat) {
        await fulfillJson(route, 500, { error: 'temporário' });
        return;
      }
      await fulfillJson(route, 200, chatOk(`resposta para ${String(request.body?.message)}`).body);
    });

    await openConversation(page, TOKEN_A);
    await sendMessage(page, 'mensagem da empresa A');
    await expect(page.getByText('resposta para mensagem da empresa A')).toBeVisible();

    const snapshotA = await storageSnapshot(page);
    const sessionKeyA = Object.keys(snapshotA).find((k) => k.startsWith('filtra_dot_session_id:'));
    const historyKeyA = Object.keys(snapshotA).find((k) => k.startsWith('filtra_dot_conversa_history_v1:'));
    expect(sessionKeyA && historyKeyA).toBeTruthy();
    const scopeA = sessionKeyA!.split(':')[1];
    const outboxKeyA = `filtra_dot_conversa_outbox_v1:${scopeA}`;
    expect(JSON.parse(snapshotA[historyKeyA!] || '[]')).toHaveLength(2);

    // Outbox pendente da empresa A (o mock passa a falhar).
    failChat = true;
    await sendMessage(page, 'pendente da empresa A');
    await expect(page.getByLabel('Mensagem pendente')).toContainText('pendente da empresa A');

    // Empresa B no mesmo navegador: nada de A pode aparecer.
    await switchToken(page, TOKEN_B);
    await expect(page.getByRole('heading', { level: 1, name: /Conversa com o Filtra Dot/i })).toBeVisible();
    await expect(page.getByText('mensagem da empresa A')).toHaveCount(0);
    await expect(page.getByLabel('Mensagem pendente')).toHaveCount(0);
    await expect(page.getByLabel('Mensagem para o Filtra Dot')).toBeEditable();

    failChat = false;
    await sendMessage(page, 'mensagem da empresa B');
    await expect(page.getByText('resposta para mensagem da empresa B')).toBeVisible();

    const snapshotB = await storageSnapshot(page);
    // O armazenamento de A continua presente (nada é apagado ao trocar de
    // identidade); B precisa ter chaves próprias, distintas das de A.
    const historyKeysB = Object.keys(snapshotB).filter((k) => k.startsWith('filtra_dot_conversa_history_v1:'));
    const sessionKeysB = Object.keys(snapshotB).filter((k) => k.startsWith('filtra_dot_session_id:'));
    expect(historyKeysB).toHaveLength(2);
    expect(sessionKeysB).toHaveLength(2);
    const historyKeyB = historyKeysB.find((k) => k !== historyKeyA);
    const sessionKeyB = sessionKeysB.find((k) => k !== sessionKeyA);
    expect(historyKeyB).toBeTruthy();
    expect(sessionKeyB).toBeTruthy();
    expect(JSON.parse(snapshotB[historyKeyB!] || '[]')).toHaveLength(2);
    expect(JSON.parse(snapshotB[historyKeyA!] || '[]')).toHaveLength(2);

    // Voltando para A, o pendente original reaparece intacto.
    await switchToken(page, TOKEN_A);
    await expect(page.getByLabel('Mensagem pendente')).toContainText('pendente da empresa A');
    const restoredOutbox = JSON.parse((await storageSnapshot(page))[outboxKeyA!] || '{}');
    expect(restoredOutbox.payload.message).toBe('pendente da empresa A');
    expect(bodies.length).toBeGreaterThanOrEqual(3);
  });

  test('4. envio de mensagem usa cabeçalhos de segurança e limpa o campo', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    const requests: Captured[] = [];
    await mockApi(page, CHAT, async (route, request) => {
      requests.push(request);
      await fulfillJson(route, 200, chatOk('Resposta verificada do Dot').body);
    });

    await openConversation(page);
    await sendMessage(page, 'Como está a reputação da empresa?');

    await expect(page.getByText('Resposta verificada do Dot')).toBeVisible();
    await expect(page.getByText('Como está a reputação da empresa?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled();
    await expect(page.getByLabel('Mensagem para o Filtra Dot')).toHaveValue('');

    expect(requests).toHaveLength(1);
    expect(requests[0].base).toBe(PRIMARY);
    expect(requests[0].headers['x-idempotency-key']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(requests[0].headers['x-dot-csrf']).toBe('1');
    expect(requests[0].headers.authorization).toBe(`Bearer ${TOKEN_A}`);
    expect(requests[0].body).toMatchObject({
      message: 'Como está a reputação da empresa?',
      session_id: expect.any(String),
    });
    await expect(page.getByText('42 tokens')).toBeVisible();
  });

  test('5. histórico e sessão persistem após recarregar', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    const sessionIds: unknown[] = [];
    await mockApi(page, CHAT, async (route, request) => {
      sessionIds.push(request.body?.session_id);
      await fulfillJson(route, 200, chatOk(`eco: ${String(request.body?.message)}`).body);
    });

    await openConversation(page);
    await sendMessage(page, 'primeira mensagem');
    await expect(page.getByText('eco: primeira mensagem')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Conversa com o Filtra Dot/i })).toBeVisible();
    await expect(page.getByRole('log').getByText('primeira mensagem', { exact: true })).toBeVisible();
    await expect(page.getByText('eco: primeira mensagem')).toBeVisible();

    await sendMessage(page, 'segunda mensagem');
    await expect(page.getByText('eco: segunda mensagem')).toBeVisible();
    expect(sessionIds).toHaveLength(2);
    expect(sessionIds[0]).toBeTruthy();
    expect(sessionIds[1]).toBe(sessionIds[0]);
  });

  test('6. outbox sobrevive a falha e a recarregamento, e é retomada com o mesmo payload', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    const requests: Captured[] = [];
    let mode: 'fail' | 'ok' = 'fail';
    await mockApi(page, CHAT, async (route, request) => {
      requests.push(request);
      if (mode === 'fail') {
        await fulfillJson(route, 500, { error: 'indisponível agora' });
        return;
      }
      await fulfillJson(route, 200, chatOk('retomada concluída').body);
    });

    await openConversation(page);
    await sendMessage(page, 'mensagem que será retomada');
    await expect(page.getByLabel('Mensagem pendente')).toContainText('mensagem que será retomada');

    const snapshot = await storageSnapshot(page);
    const outboxKey = Object.keys(snapshot).find((k) => k.startsWith('filtra_dot_conversa_outbox_v1:'));
    expect(outboxKey).toBeTruthy();
    const stored = JSON.parse(snapshot[outboxKey!] || '{}');
    expect(stored.status).toBe('retryable');
    expect(stored.key).toBe(requests[0].headers['x-idempotency-key']);
    const payloadBefore = stored.payload;

    await page.reload();
    await expect(page.getByLabel('Mensagem pendente')).toContainText('mensagem que será retomada');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();

    mode = 'ok';
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByText('retomada concluída')).toBeVisible();
    await expect(page.getByLabel('Mensagem pendente')).toHaveCount(0);

    expect(requests).toHaveLength(2);
    expect(requests[1].headers['x-idempotency-key']).toBe(stored.key);
    expect(requests[1].body).toEqual(payloadBefore);
  });

  test('6b. outbox marcada como "sending" no reload vira retryable sem trocar a chave', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    const requests: Captured[] = [];
    await mockApi(page, CHAT, async (route, request) => {
      requests.push(request);
      await fulfillJson(route, 200, chatOk('reconhecida').body);
    });

    await openConversation(page);
    const keys = Object.keys(await storageSnapshot(page));
    const sessionKey = keys.find((k) => k.startsWith('filtra_dot_session_id:'));
    expect(sessionKey).toBeTruthy();
    const scope = sessionKey!.split(':')[1];
    const outboxKey = `filtra_dot_conversa_outbox_v1:${scope}`;
    const interruptedKey = '5b3f9c6e-1f2a-4d3b-8c7e-0a1b2c3d4e5f';
    await page.evaluate(
      ({ outboxKey, interruptedKey }) => {
        localStorage.setItem(
          outboxKey,
          JSON.stringify({
            key: interruptedKey,
            payload: { message: 'interrompida no envio', session_id: 'sessao-interrompida' },
            status: 'sending',
            createdAt: Date.now(),
          }),
        );
      },
      { outboxKey, interruptedKey },
    );

    await page.reload();
    await expect(page.getByText(/Havia uma mensagem pendente/i)).toBeVisible();
    await expect(page.getByLabel('Mensagem pendente')).toContainText('interrompida no envio');

    const snapshot = await storageSnapshot(page);
    expect(JSON.parse(snapshot[outboxKey] || '{}').status).toBe('retryable');

    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByText('reconhecida')).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0].headers['x-idempotency-key']).toBe(interruptedKey);
    expect(requests[0].body).toEqual({
      message: 'interrompida no envio',
      session_id: 'sessao-interrompida',
    });
  });

  test('7. retry reutiliza exatamente a mesma chave e o mesmo corpo', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    const requests: Captured[] = [];
    let attempt = 0;
    await mockApi(page, CHAT, async (route, request) => {
      requests.push(request);
      attempt += 1;
      if (attempt === 1) {
        await fulfillJson(route, 500, { error: 'falha interna temporária' });
        return;
      }
      await fulfillJson(route, 200, chatOk('segunda tentativa aceita').body);
    });

    await openConversation(page);
    await sendMessage(page, 'mensagem com retry manual');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByText('segunda tentativa aceita')).toBeVisible();

    expect(requests).toHaveLength(2);
    expect(requests[0].headers['x-idempotency-key']).toBe(requests[1].headers['x-idempotency-key']);
    expect(requests[0].body).toEqual(requests[1].body);
    expect(page.getByRole('log').getByText('mensagem com retry manual')).toHaveCount(1);
  });

  test('8. chat financeiro não faz failover entre bases após resposta ambígua', async ({ page }) => {
    await installGlobalGuards(page);
    const statusCalls: Captured[] = [];
    const chatCalls: Captured[] = [];
    let primaryChatReplies = 0;
    let backupChatReplies = 0;
    await mockApi(page, STATUS, async (route, request) => {
      statusCalls.push(request);
      await fulfillJson(route, 200, statusOk().body);
    });
    await mockApi(page, CHAT, async (route, request) => {
      chatCalls.push(request);
      if (request.base === PRIMARY) {
        primaryChatReplies += 1;
        await fulfillJson(route, 503, { error: 'service unavailable' });
        return;
      }
      backupChatReplies += 1;
      await fulfillJson(route, 200, chatOk('resposta indevida do backup').body);
    });

    await openConversation(page);
    await sendMessage(page, 'mensagem durante failover');

    // A primeira base pode ter processado a operação apesar do 503. Sem prova
    // de ledger compartilhado, o frontend deve preservar a pendência e nunca
    // repetir o POST financeiro em outra base.
    expect(primaryChatReplies).toBe(1);
    expect(backupChatReplies).toBe(0);
    expect(chatCalls).toHaveLength(1);
    expect(chatCalls[0].base).toBe(PRIMARY);
    expect(chatCalls[0].headers['x-idempotency-key']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(chatCalls[0].body).toMatchObject({ message: 'mensagem durante failover' });
    await expect(page.getByLabel('Mensagem pendente')).toContainText('mensagem durante failover');
    await expect(page.getByText('resposta indevida do backup')).toHaveCount(0);
    expect(statusCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('9. DOT_REQUEST_IN_PROGRESS mantém a chave para nova tentativa', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    const requests: Captured[] = [];
    let attempt = 0;
    await mockApi(page, CHAT, async (route, request) => {
      requests.push(request);
      attempt += 1;
      if (attempt === 1) {
        await fulfillJson(route, 409, {
          ok: false,
          code: 'DOT_REQUEST_IN_PROGRESS',
          error: 'Esta mensagem ainda está sendo processada.',
        });
        return;
      }
      await fulfillJson(route, 200, chatOk('processamento concluído').body);
    });

    await openConversation(page);
    await sendMessage(page, 'mensagem em processamento');
    await expect(page.getByText(/ainda está processando esta mensagem/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();

    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByText('processamento concluído')).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[0].headers['x-idempotency-key']).toBe(requests[1].headers['x-idempotency-key']);
  });

  test('10. DOT_REQUEST_AMBIGUOUS bloqueia reenvio e exige descarte explícito', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    const requests: Captured[] = [];
    await mockApi(page, CHAT, async (route, request) => {
      requests.push(request);
      await fulfillJson(route, 409, {
        ok: false,
        code: 'DOT_REQUEST_AMBIGUOUS',
        error: 'Resultado incerto.',
      });
    });

    await openConversation(page);
    await sendMessage(page, 'mensagem ambígua');
    await expect(page.getByText(/resultado desta mensagem é incerto/i)).toBeVisible();
    await expect(page.getByText(/não será reenviada automaticamente/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Descartar pendente' }).click();
    await expect(page.getByLabel('Mensagem pendente')).toHaveCount(0);
    await expect(page.getByLabel('Mensagem para o Filtra Dot')).toHaveValue('mensagem ambígua');
    expect(requests).toHaveLength(1);
  });

  test('11. DOT_IDEMPOTENCY_KEY_REUSED bloqueia a mensagem sem reenvio', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    const requests: Captured[] = [];
    await mockApi(page, CHAT, async (route, request) => {
      requests.push(request);
      await fulfillJson(route, 409, {
        ok: false,
        code: 'DOT_IDEMPOTENCY_KEY_REUSED',
        error: 'Chave reutilizada com outro conteúdo.',
      });
    });

    await openConversation(page);
    await sendMessage(page, 'conteúdo divergente');
    await expect(page.getByText(/já foi usada com outro conteúdo/i).first()).toBeVisible();
    await expect(page.getByText(/Bloqueada — não será reenviada/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Descartar pendente' }).click();
    await expect(page.getByLabel('Mensagem pendente')).toHaveCount(0);
    expect(requests).toHaveLength(1);
  });

  test('12. sessão expirada no status bloqueia a conversa', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) =>
      fulfillJson(route, 401, { error: 'Unauthorized' }),
    );

    await seedSession(page, TOKEN_A);
    await expect(page.getByRole('heading', { level: 1, name: /Sessão expirada/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar novamente' })).toHaveAttribute('href', '/login');
    await expect(page.getByLabel('Mensagem para o Filtra Dot')).toHaveCount(0);
  });

  test('12b. 401 no chat expira a sessão preservando a mensagem pendente', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    await mockApi(page, CHAT, async (route, request) => {
      expect(request.headers['x-idempotency-key']).toBeTruthy();
      await fulfillJson(route, 401, { error: 'Unauthorized' });
    });

    await openConversation(page);
    await sendMessage(page, 'mensagem antes de expirar');
    await expect(page.getByRole('heading', { level: 1, name: /Sessão expirada/i })).toBeVisible();

    const snapshot = await storageSnapshot(page);
    const outboxKey = Object.keys(snapshot).find((k) => k.startsWith('filtra_dot_conversa_outbox_v1:'));
    expect(outboxKey).toBeTruthy();
    const stored = JSON.parse(snapshot[outboxKey!] || '{}');
    expect(stored.status).toBe('retryable');
    expect(stored.code).toBe('SESSION_EXPIRED');
    expect(stored.payload.message).toBe('mensagem antes de expirar');
  });

  test('13. falha total de rede exibe erro e a retomada funciona', async ({ page }) => {
    const productionAttempts = await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    let online = false;
    const requests: Captured[] = [];
    await mockApi(page, CHAT, async (route, request) => {
      requests.push(request);
      if (!online) {
        await route.abort('failed');
        return;
      }
      await fulfillJson(route, 200, chatOk('conexão restabelecida').body);
    });

    await openConversation(page);
    await sendMessage(page, 'mensagem sem rede');
    await expect(page.getByText(/A conexão falhou antes de confirmar/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
    // A base canônica de produção foi apenas interceptada; nada saiu do navegador.
    expect(productionAttempts.every((url) => url.includes(PRODUCTION_HOST))).toBe(true);

    online = true;
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByText('conexão restabelecida')).toBeVisible();
    expect(requests.length).toBeGreaterThanOrEqual(2);
    const first = requests[0].headers['x-idempotency-key'];
    expect(requests.every((r) => r.headers['x-idempotency-key'] === first)).toBe(true);
  });

  test('14. localStorage inválido não quebra a tela e é descartado', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    await mockApi(page, CHAT, async (route) => fulfillJson(route, 200, chatOk('ok').body));

    await seedSession(page, TOKEN_A);
    await expect(page.getByRole('heading', { level: 1, name: /Conversa com o Filtra Dot/i })).toBeVisible();

    const keys = Object.keys(await storageSnapshot(page));
    const sessionKey = keys.find((k) => k.startsWith('filtra_dot_session_id:'));
    const scope = sessionKey!.split(':')[1];
    const historyKey = `filtra_dot_conversa_history_v1:${scope}`;
    const outboxKey = `filtra_dot_conversa_outbox_v1:${scope}`;
    await page.evaluate(
      ({ historyKey, outboxKey }) => {
        localStorage.setItem(historyKey, '{"quebrado":');
        localStorage.setItem(outboxKey, JSON.stringify({ key: 'x' }));
        localStorage.setItem('filtra_dot_session_id:outro-escopo', 'sessao-de-outro-tenant');
      },
      { historyKey, outboxKey },
    );

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Conversa com o Filtra Dot/i })).toBeVisible();
    await expect(page.getByLabel('Mensagem para o Filtra Dot')).toBeEditable();
    await expect(page.getByLabel('Mensagem pendente')).toHaveCount(0);

    const snapshot = await storageSnapshot(page);
    expect(snapshot[outboxKey]).toBeFalsy();

    await sendMessage(page, 'mensagem após dados corrompidos');
    await expect(page.getByText('ok', { exact: true })).toBeVisible();
  });

  test('14b. histórico com entradas inválidas é filtrado sem perder as válidas', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));

    await seedSession(page, TOKEN_A);
    await expect(page.getByRole('heading', { level: 1, name: /Conversa com o Filtra Dot/i })).toBeVisible();
    const keys = Object.keys(await storageSnapshot(page));
    const scope = keys.find((k) => k.startsWith('filtra_dot_session_id:'))!.split(':')[1];
    const historyKey = `filtra_dot_conversa_history_v1:${scope}`;
    await page.evaluate(
      ({ historyKey }) => {
        localStorage.setItem(
          historyKey,
          JSON.stringify([
            { id: 'ok-1', role: 'user', text: 'válida', at: Date.now() },
            { id: 42, role: 'hacker', text: 7 },
            null,
            'string',
          ]),
        );
      },
      { historyKey },
    );

    await page.reload();
    await expect(page.getByRole('log').getByText('válida')).toBeVisible();
    await expect(page.getByRole('log').getByText('hacker')).toHaveCount(0);
  });
});

test.describe('Filtra Dot — responsividade e acessibilidade básica', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('15. layout móvel, rótulos e teclado', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    const requests: Captured[] = [];
    await mockApi(page, CHAT, async (route, request) => {
      requests.push(request);
      await fulfillJson(route, 200, chatOk('resposta acessível').body);
    });

    await openConversation(page);

    const box = page.getByLabel('Mensagem para o Filtra Dot');
    await expect(box).toBeVisible();
    await expect(box).toHaveAttribute('aria-describedby', 'dot-composer-hint');
    await expect(page.getByRole('log')).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByRole('heading', { level: 1, name: /Conversa com o Filtra Dot/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Shift+Enter quebra linha sem enviar.
    await box.focus();
    await box.type('linha um');
    await page.keyboard.press('Shift+Enter');
    await box.type('linha dois');
    expect(requests).toHaveLength(0);
    await expect(box).toHaveValue(/linha um\nlinha dois/);

    // Enter envia.
    await page.keyboard.press('Enter');
    await expect(page.getByText('resposta acessível')).toBeVisible();
    expect(requests).toHaveLength(1);
  });

  test('15b. erro transitório é anunciado como alerta e controles seguem rotulados', async ({ page }) => {
    await installGlobalGuards(page);
    await mockApi(page, STATUS, async (route) => fulfillJson(route, 200, statusOk().body));
    await mockApi(page, CHAT, async (route) => fulfillJson(route, 500, { error: 'falha' }));

    await openConversation(page);
    await sendMessage(page, 'mensagem com erro');

    // O Next injeta um `role="alert"` próprio (route announcer) além do alerta
    // da aplicação; o filtro por texto evita a violação de modo estrito.
    const alert = page.getByRole('alert').filter({ hasText: /Não foi possível confirmar a resposta/i });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/Não foi possível confirmar a resposta/i);
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Descartar pendente' })).toBeEnabled();
  });
});
