// Testes do mecanismo de retry: provam que só falha transitória de rede é
// repetida, que erro HTTP nunca é repetido e que o esgotamento continua
// falhando a execução.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { codigoTransitorio, fetchComRetry } from './fetch-com-retry.mjs';

// Sobe um servidor local que derruba o socket nas `resets` primeiras
// requisições e depois responde `status`. Devolve a URL e o contador.
async function servidorDeTeste({ resets = 0, status = 200 } = {}) {
  const estado = { requisicoes: 0 };
  const servidor = createServer((req, res) => {
    estado.requisicoes += 1;
    if (estado.requisicoes <= resets) {
      req.socket.destroy();
      return;
    }
    res.writeHead(status, { 'content-type': 'text/plain' });
    res.end('ok');
  });

  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const { port } = servidor.address();
  return {
    url: `http://127.0.0.1:${port}/`,
    estado,
    async fechar() {
      await new Promise((resolve) => servidor.close(resolve));
    },
  };
}

test('repete uma vez quando o socket é derrubado e devolve a resposta seguinte', async () => {
  const servidor = await servidorDeTeste({ resets: 1 });
  const logs = [];
  try {
    const resposta = await fetchComRetry(
      servidor.url,
      { method: 'HEAD' },
      { esperaMs: 10, log: (linha) => logs.push(linha) },
    );
    assert.equal(resposta.status, 200);
    assert.equal(servidor.estado.requisicoes, 2);
    assert.equal(logs.length, 1);
    assert.match(logs[0], /tentativa 1\/2/);
    assert.ok(logs[0].includes(servidor.url), 'o log nomeia a URL afetada');
  } finally {
    await servidor.fechar();
  }
});

test('esgotar as tentativas continua falhando e preserva o erro original', async () => {
  const servidor = await servidorDeTeste({ resets: 5 });
  const logs = [];
  try {
    await assert.rejects(
      fetchComRetry(servidor.url, {}, { esperaMs: 10, tentativas: 2, log: (linha) => logs.push(linha) }),
      (erro) => {
        assert.equal(erro.tentativas, 2);
        assert.ok(erro.codigo, 'deveria expor o código transitório');
        assert.equal(erro.message, 'fetch failed');
        return true;
      },
    );
    assert.equal(servidor.estado.requisicoes, 2, 'não pode passar do limite de tentativas');
    assert.equal(logs.length, 1, 'registra a tentativa repetida');
  } finally {
    await servidor.fechar();
  }
});

test('não repete resposta HTTP 5xx (erro funcional é resposta, não exceção)', async () => {
  const servidor = await servidorDeTeste({ status: 503 });
  const logs = [];
  try {
    const resposta = await fetchComRetry(servidor.url, {}, { esperaMs: 10, log: (linha) => logs.push(linha) });
    assert.equal(resposta.status, 503);
    await resposta.text();
    assert.equal(servidor.estado.requisicoes, 1);
    assert.equal(logs.length, 0);
  } finally {
    await servidor.fechar();
  }
});

test('não repete resposta HTTP 404', async () => {
  const servidor = await servidorDeTeste({ status: 404 });
  try {
    const resposta = await fetchComRetry(servidor.url, {}, { esperaMs: 10 });
    assert.equal(resposta.status, 404);
    await resposta.text();
    assert.equal(servidor.estado.requisicoes, 1);
  } finally {
    await servidor.fechar();
  }
});

test('erro funcional de argumento falha na primeira tentativa, sem requisição', async () => {
  const logs = [];
  await assert.rejects(
    fetchComRetry('http://', {}, { esperaMs: 10, log: (linha) => logs.push(linha) }),
    (erro) => {
      assert.equal(erro.tentativas, undefined, 'erro funcional não é anotado como transitório');
      return true;
    },
  );
  assert.equal(logs.length, 0);
});

test('limite de tentativas precisa ser inteiro positivo', async () => {
  await assert.rejects(fetchComRetry('http://127.0.0.1:1/', {}, { tentativas: 0 }), /tentativas deve ser inteiro/);
});

test('codigoTransitorio identifica códigos de socket na cadeia de cause', () => {
  const comCausa = new TypeError('fetch failed', { cause: Object.assign(new Error('reset'), { code: 'ECONNRESET' }) });
  assert.equal(codigoTransitorio(comCausa), 'ECONNRESET');
  assert.equal(codigoTransitorio(new TypeError('fetch failed')), 'FETCH_FAILED_SEM_CODIGO');
  assert.equal(codigoTransitorio(Object.assign(new Error('bad'), { code: 'ERR_INVALID_URL' })), null);
  assert.equal(codigoTransitorio(new Error('ENOENT: arquivo')), null);
  assert.equal(codigoTransitorio(undefined), null);
});
