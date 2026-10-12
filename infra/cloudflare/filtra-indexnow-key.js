const paths = ["/","/ia","/filtra-ai","/feedback-de-clientes","/analise-de-avaliacoes-com-ia","/gestao-de-reputacao-online","/avaliacoes-google","/reputacao-google","/como-melhorar-avaliacoes-google","/monitoramento-reputacao-online","/gestao-de-feedback","/auditoria-gratuita","/hoteis","/turismo","/agencias","/clinicas","/franquias","/associacoes","/restaurantes","/como-funciona","/parceiros","/pedir-estrela-vs-filtrar","/blog/como-conseguir-avaliacoes-google","/blog/gestao-reputacao-online-guia","/blog/feedback-cliente-para-reputacao","/blog/seo-local-avaliacoes-local-pack","/blog/agencia-vender-gestao-reputacao","/blog","/blog/como-responder-avaliacoes-negativas","/blog/velocity-reviews-google-maps-2026","/blog/review-1-estrela-primeiras-24-horas","/blog/qr-code-balcao-reviews","/blog/clinica-checklist-avaliacoes-google","/blog/whatsapp-pedir-estrela-vs-filtrar-qr","/blog/google-business-profile-avaliacoes","/blog/reputacao-online-clinicas","/blog/reputacao-online-hoteis","/blog/reputacao-franquias-multilocal","/blog/avaliacoes-google-restaurantes","/termos","/privacidade","/en","/es","/zh","/en/ai","/es/ia","/zh/ai","/en/filtra-ai","/es/filtra-ai","/zh/filtra-ai","/en/customer-feedback","/es/feedback-clientes","/zh/customer-feedback","/en/ai-review-analysis","/es/analisis-resenas-ia","/zh/ai-review-analysis","/en/online-reputation-management","/es/gestion-reputacion-online","/zh/online-reputation-management","/en/google-reviews","/es/resenas-google","/zh/google-reviews","/en/google-reputation","/es/reputacion-google","/zh/google-reputation","/en/improve-google-reviews","/es/mejorar-resenas-google","/zh/improve-google-reviews","/en/online-reputation-monitoring","/es/monitoreo-reputacion-online","/zh/online-reputation-monitoring","/en/customer-feedback-management","/es/gestion-feedback-clientes","/zh/customer-feedback-management","/en/free-review-audit","/es/auditoria-gratuita","/zh/free-review-audit","/en/hotels","/es/hoteles","/zh/hotels","/en/tourism","/es/turismo","/zh/tourism","/en/agencies","/es/agencias","/zh/agencies","/en/clinics","/es/clinicas","/zh/clinics","/en/franchises","/es/franquicias","/zh/franchises","/en/associations","/es/asociaciones","/zh/associations","/en/restaurants","/es/restaurantes","/zh/restaurants","/en/how-it-works","/es/como-funciona","/zh/how-it-works","/en/partners","/es/socios","/zh/partners","/en/ask-for-stars-vs-filtering","/es/pedir-estrellas-vs-filtrar","/zh/request-stars-vs-filter","/en/blog/get-google-reviews","/es/blog/conseguir-resenas-google","/zh/blog/google-reviews-guide","/en/blog/online-reputation-management-guide","/es/blog/guia-gestion-reputacion-online","/zh/blog/online-reputation-management-guide","/en/blog/customer-feedback-reputation","/es/blog/feedback-clientes-reputacion","/zh/blog/customer-feedback-reputation","/en/blog/local-seo-google-reviews","/es/blog/seo-local-resenas-google","/zh/blog/local-seo-google-reviews","/en/blog/agency-reputation-management","/es/blog/agencia-gestion-reputacion","/zh/blog/agency-reputation-management","/en/blog/ai-review-analysis-guide","/es/blog/analisis-resenas-ia","/zh/blog/ai-review-analysis-guide","/en/blog","/es/blog","/zh/blog"];
const urlList = paths.map(path => 'https://filtraai.com' + path);
addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    event.respondWith(new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } }));
    return;
  }
  let body;
  let contentType = 'text/plain; charset=utf-8';
  if (url.hostname === 'filtraai.com' && url.pathname === '/a3d7f1c94b2e6a805d1f7c3b9e4a6d82.txt') {
    body = 'a3d7f1c94b2e6a805d1f7c3b9e4a6d82';
    if (request.method === 'GET') {
      event.waitUntil(fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: 'filtraai.com',
          key: 'a3d7f1c94b2e6a805d1f7c3b9e4a6d82',
          keyLocation: 'https://filtraai.com/a3d7f1c94b2e6a805d1f7c3b9e4a6d82.txt',
          urlList
        })
      }).catch(() => null));
    }
  } else if (url.hostname === 'filtraai.com' && url.pathname === '/robots.txt') {
    body = 'User-agent: *\nAllow: /\nDisallow: /painel/\nDisallow: /admin/\nDisallow: /api/\nDisallow: /avaliacao/\n\nSitemap: https://filtraai.com/sitemap.xml\n';
  } else if (url.hostname === 'filtraai.com' && url.pathname === '/sitemap.xml') {
    contentType = 'application/xml; charset=utf-8';
    body = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      paths.map(path => '<url><loc>https://filtraai.com' + path + '</loc></url>').join('') +
      '</urlset>';
  } else {
    event.respondWith(new Response('Not Found', { status: 404 }));
    return;
  }
  event.respondWith(new Response(request.method === 'HEAD' ? null : body, {
    status: 200,
    headers: { 'content-type': contentType, 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' }
  }));
});