import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://filtraai.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    '',
    '/como-funciona',
    '/auditoria-gratuita',
    '/hoteis',
    '/parceiros',
    '/associacoes',
    '/turismo',
    '/franquias',
    '/restaurantes',
    '/clinicas',
    '/agencias',
    '/pedir-estrela-vs-filtrar',
    '/blog',
    '/blog/como-conseguir-avaliacoes-google',
    '/blog/velocity-reviews-google-maps-2026',
    '/blog/review-1-estrela-primeiras-24-horas',
    '/blog/qr-code-balcao-reviews',
    '/blog/seo-local-avaliacoes-local-pack',
    '/blog/clinica-checklist-avaliacoes-google',
    '/blog/agencia-vender-gestao-reputacao',
    '/blog/whatsapp-pedir-estrela-vs-filtrar-qr',
    '/planos',
    '/termos',
    '/privacidade',
    '/login',
  ];

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' || path.startsWith('/blog') ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/blog') ? 0.8 : 0.7,
  }));
}
