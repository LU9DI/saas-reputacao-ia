// Worker do Cloudflare: encaminha filtraai.com/indice* para o serviço do Render (app do Índice).
// O caminho NÃO é reescrito: o app usa basePath /indice, então /indice/x chega como /indice/x.
// Rota a criar no painel: filtraai.com/indice*  (e filtraai.com/indice/*)  ->  este Worker.
const ORIGEM = 'https://filtra-indice.onrender.com';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== '/indice' && !url.pathname.startsWith('/indice/')) {
      return fetch(request); // qualquer outra rota segue para o site principal
    }
    const destino = new URL(url.pathname + url.search, ORIGEM);
    const resp = await fetch(new Request(destino, request), {
      cf: { cacheEverything: true, cacheTtl: 3600 }, // páginas mudam 1x por mês; reduz acordar o serviço free
    });
    const r = new Response(resp.body, resp);
    r.headers.set('X-Indice-Origem', 'render');
    return r;
  },
};
