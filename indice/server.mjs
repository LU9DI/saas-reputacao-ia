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
  // Normalize uppercase Brazilian UF segments to the canonical lowercase route.
  // Example: /indice/GO/goiania?x=1 -> /indice/go/goiania?x=1.
  // Restrict this to the first path segment after the app basePath.
  const requestUrl = req.url || '/';
  const queryIndex = requestUrl.indexOf('?');
  const pathname = queryIndex === -1 ? requestUrl : requestUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : requestUrl.slice(queryIndex);
  const pathSegments = pathname.split('/');
  const uf = pathSegments[2] || '';
  if (pathSegments[1] === 'indice' && /^[A-Z]{2}$/.test(uf) && req.method === 'GET') {
    pathSegments[2] = uf.toLowerCase();
    res.statusCode = 308;
    res.setHeader('Location', pathSegments.join('/') + query);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end();
    return;
  }

  handle(req, res);
}).listen(port, hostname, () => {
  console.log(`filtra-indice pronto em http://${hostname}:${port}`);
});
