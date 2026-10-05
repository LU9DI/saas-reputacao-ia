import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

type Lang = 'pt-BR' | 'en' | 'es' | 'zh';

const SEO_FAMILIES: Record<string, Record<Lang, string>> = {
  '/': { 'pt-BR':'/', en:'/en', es:'/es', zh:'/zh' },
  '/ia': { 'pt-BR':'/ia', en:'/en/ai', es:'/es/ia', zh:'/zh/ai' },
  '/filtra-ai': { 'pt-BR':'/filtra-ai', en:'/en/filtra-ai', es:'/es/filtra-ai', zh:'/zh/filtra-ai' },
  '/feedback-de-clientes': { 'pt-BR':'/feedback-de-clientes', en:'/en/customer-feedback', es:'/es/feedback-clientes', zh:'/zh/customer-feedback' },
  '/analise-de-avaliacoes-com-ia': { 'pt-BR':'/analise-de-avaliacoes-com-ia', en:'/en/ai-review-analysis', es:'/es/analisis-resenas-ia', zh:'/zh/ai-review-analysis' },
  '/gestao-de-reputacao-online': { 'pt-BR':'/gestao-de-reputacao-online', en:'/en/online-reputation-management', es:'/es/gestion-reputacion-online', zh:'/zh/online-reputation-management' },
  '/avaliacoes-google': { 'pt-BR':'/avaliacoes-google', en:'/en/google-reviews', es:'/es/resenas-google', zh:'/zh/google-reviews' },
  '/reputacao-google': { 'pt-BR':'/reputacao-google', en:'/en/google-reputation', es:'/es/reputacion-google', zh:'/zh/google-reputation' },
  '/como-melhorar-avaliacoes-google': { 'pt-BR':'/como-melhorar-avaliacoes-google', en:'/en/improve-google-reviews', es:'/es/mejorar-resenas-google', zh:'/zh/improve-google-reviews' },
  '/monitoramento-reputacao-online': { 'pt-BR':'/monitoramento-reputacao-online', en:'/en/online-reputation-monitoring', es:'/es/monitoreo-reputacion-online', zh:'/zh/online-reputation-monitoring' },
  '/gestao-de-feedback': { 'pt-BR':'/gestao-de-feedback', en:'/en/customer-feedback-management', es:'/es/gestion-feedback-clientes', zh:'/zh/customer-feedback-management' },
  '/auditoria-gratuita': { 'pt-BR':'/auditoria-gratuita', en:'/en/free-review-audit', es:'/es/auditoria-gratuita', zh:'/zh/free-review-audit' },
  '/hoteis': { 'pt-BR':'/hoteis', en:'/en/hotels', es:'/es/hoteles', zh:'/zh/hotels' },
  '/turismo': { 'pt-BR':'/turismo', en:'/en/tourism', es:'/es/turismo', zh:'/zh/tourism' },
  '/agencias': { 'pt-BR':'/agencias', en:'/en/agencies', es:'/es/agencias', zh:'/zh/agencies' },
  '/clinicas': { 'pt-BR':'/clinicas', en:'/en/clinics', es:'/es/clinicas', zh:'/zh/clinics' },
  '/franquias': { 'pt-BR':'/franquias', en:'/en/franchises', es:'/es/franquicias', zh:'/zh/franchises' },
  '/associacoes': { 'pt-BR':'/associacoes', en:'/en/associations', es:'/es/asociaciones', zh:'/zh/associations' },
  '/restaurantes': { 'pt-BR':'/restaurantes', en:'/en/restaurants', es:'/es/restaurantes', zh:'/zh/restaurants' },
  '/como-funciona': { 'pt-BR':'/como-funciona', en:'/en/how-it-works', es:'/es/como-funciona', zh:'/zh/how-it-works' },
  '/parceiros': { 'pt-BR':'/parceiros', en:'/en/partners', es:'/es/socios', zh:'/zh/partners' },
  '/pedir-estrela-vs-filtrar': { 'pt-BR':'/pedir-estrela-vs-filtrar', en:'/en/ask-for-stars-vs-filtering', es:'/es/pedir-estrellas-vs-filtrar', zh:'/zh/request-stars-vs-filter' },
};

const canonicalPaths = [
  '',
  ...Object.keys(SEO_FAMILIES).filter((p) => p !== '/'),
  '/blog',
  '/blog/gestao-reputacao-online-guia',
  '/blog/como-responder-avaliacoes-negativas',
  '/blog/como-conseguir-avaliacoes-google',
  '/blog/velocity-reviews-google-maps-2026',
  '/blog/review-1-estrela-primeiras-24-horas',
  '/blog/qr-code-balcao-reviews',
  '/blog/seo-local-avaliacoes-local-pack',
  '/blog/clinica-checklist-avaliacoes-google',
  '/blog/agencia-vender-gestao-reputacao',
  '/blog/whatsapp-pedir-estrela-vs-filtrar-qr',
  '/blog/google-business-profile-avaliacoes',
  '/blog/reputacao-online-clinicas',
  '/blog/reputacao-online-hoteis',
  '/blog/reputacao-franquias-multilocal',
  '/blog/avaliacoes-google-restaurantes',
  '/blog/feedback-cliente-para-reputacao',
  '/termos',
  '/privacidade',
];

const localizedPaths = Object.values(SEO_FAMILIES).flatMap((family) =>
  Object.values(family).map((path) => path).filter((path) => path !== family['pt-BR']),
);

const highPriority = new Set([
  '/',
  '/filtra-ai',
  '/reputacao-google',
  '/como-melhorar-avaliacoes-google',
  '/monitoramento-reputacao-online',
  '/gestao-de-feedback',
  '/feedback-de-clientes',
  '/analise-de-avaliacoes-com-ia',
  '/gestao-de-reputacao-online',
  '/avaliacoes-google',
  '/auditoria-gratuita',
  '/agencias',
  '/clinicas',
  '/restaurantes',
  '/franquias',
  '/hoteis',
  '/turismo',
  '/associacoes',
  '/parceiros',
  '/pedir-estrela-vs-filtrar',
  '/como-funciona',
  '/ia',
]);

function localizedAlternates(path: string) {
  for (const family of Object.values(SEO_FAMILIES)) {
    if (Object.values(family).includes(path)) {
      return {
        languages: Object.fromEntries(
          Object.entries(family).map(([lang, target]) => [lang, base + target]),
        ),
      };
    }
  }
  return undefined;
}

function entry(path: string): MetadataRoute.Sitemap[number] {
  const canonical = path === '' ? '/' : path;
  const isBlog = canonical === '/blog' || canonical.startsWith('/blog/');
  const isHome = canonical === '/';
  const priority = isHome ? 1 : highPriority.has(canonical) ? 0.95 : isBlog ? 0.8 : 0.7;
  return {
    url: base + canonical,
    changeFrequency: isHome || isBlog ? 'weekly' : 'monthly',
    priority,
    alternates: localizedAlternates(canonical),
  };
}

const allPaths = [...canonicalPaths, ...localizedPaths].filter((path, index, arr) => arr.indexOf(path) === index);

export default function sitemap(): MetadataRoute.Sitemap {
  return allPaths.map(entry);
}
