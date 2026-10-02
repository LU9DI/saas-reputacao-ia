import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '', '/feedback-de-clientes', '/analise-de-avaliacoes-com-ia', '/gestao-de-reputacao-online', '/avaliacoes-google',
    '/como-funciona', '/auditoria-gratuita', '/hoteis', '/parceiros', '/associacoes', '/turismo',
    '/franquias', '/restaurantes', '/clinicas', '/agencias', '/pedir-estrela-vs-filtrar', '/blog',
    '/blog/gestao-reputacao-online-guia', '/blog/como-responder-avaliacoes-negativas',
    '/blog/como-conseguir-avaliacoes-google', '/blog/velocity-reviews-google-maps-2026',
    '/blog/review-1-estrela-primeiras-24-horas', '/blog/qr-code-balcao-reviews',
    '/blog/seo-local-avaliacoes-local-pack', '/blog/clinica-checklist-avaliacoes-google',
    '/blog/agencia-vender-gestao-reputacao', '/blog/whatsapp-pedir-estrela-vs-filtrar-qr',
    '/ia', '/termos', '/privacidade',
  ];

  return paths.map((path) => ({
    url: `${base}${path}`,
    ...(path === '/ia' ? { lastModified: '2026-10-02' } : {}),
    changeFrequency: path === '' || path.startsWith('/blog') ? 'weekly' : 'monthly',
    priority:
      path === '' ? 1 :
      ['/feedback-de-clientes', '/analise-de-avaliacoes-com-ia', '/gestao-de-reputacao-online', '/auditoria-gratuita', '/ia'].includes(path) ? 0.95 :
      path.startsWith('/blog') ? 0.8 : 0.7,
  }));
}
