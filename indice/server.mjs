import next from 'next';
import { createServer } from 'node:http';

// Entrada de produção usada pelo Render (`npm start`).
// HOSTNAME é definido pelo runtime do container e não deve ser usado como
// endereço de bind. O ingress do Render precisa alcançar o servidor em todas
// as interfaces. HOST fica disponível como override explícito.
// Respostas >= 400 são sempre não-cacheáveis para evitar 404 transitórios em CDN.

const FORBID_CACHE = 'private, no-cache, no-store, max-age=0, must-revalidate';

const port = Number(process.env.PORT || 3100);
const hostname = process.env.HOST || '0.0.0.0';

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

function forceErrorHeaders(res, statusCode, headersArg) {
  if (Number(statusCode) >= 400) {
    res.removeHeader('Cache-Control');
    res.setHeader('Cache-Control', FORBID_CACHE);
    if (headersArg && typeof headersArg === 'object') {
      delete headersArg['Cache-Control'];
      delete headersArg['cache-control'];
    }
  }
  return headersArg;
}

await app.prepare();

createServer((req, res) => {
  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = function writeHead(statusCode, statusMessage, headers) {
    let message = statusMessage;
    let headerArg = headers;
    if (typeof statusMessage === 'object' && statusMessage !== null) {
      headerArg = statusMessage;
      message = undefined;
    }
    headerArg = forceErrorHeaders(res, statusCode, headerArg);
    if (headerArg !== undefined) {
      return message !== undefined
        ? originalWriteHead(statusCode, message, headerArg)
        : originalWriteHead(statusCode, headerArg);
    }
    return originalWriteHead(statusCode, message);
  };
  handle(req, res);
}).listen(port, hostname, () => {
  console.log(`filtra-indice pronto em http://${hostname}:${port}`);
});
