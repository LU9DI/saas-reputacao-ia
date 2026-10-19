import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

// Só declare datas reais de alteração de conteúdo: lastmod inconsistente perde confiança.
// 2026-10-19: páginas alteradas no lote de CTR/conteúdo (títulos, seções, FAQ e nav do blog).
const LAST_MODIFIED: Record<string, string> = {
  '/': '2026-10-19',
  '/filtra-ai': '2026-10-19',
  '/gestao-de-reputacao-online': '2026-10-19',
  '/blog': '2026-10-19',
  '/blog/gestao-reputacao-online-guia': '2026-10-19',
  '/blog/seo-local-avaliacoes-local-pack': '2026-10-19',
  '/blog/como-responder-avaliacoes-negativas': '2026-10-19',
  '/blog/como-conseguir-avaliacoes-google': '2026-10-19',
  '/blog/agencia-vender-gestao-reputacao': '2026-10-19',
  '/blog/avaliacoes-google-restaurantes': '2026-10-19',
  '/blog/google-business-profile-avaliacoes': '2026-10-19',
  '/blog/clinica-checklist-avaliacoes-google': '2026-10-19',
  '/blog/feedback-cliente-para-reputacao': '2026-10-19',
  '/blog/whatsapp-pedir-estrela-vs-filtrar-qr': '2026-10-19',
  '/blog/qr-code-balcao-reviews': '2026-10-19',
  '/blog/reputacao-online-clinicas': '2026-10-19',
  '/blog/reputacao-franquias-multilocal': '2026-10-19',
  '/blog/review-1-estrela-primeiras-24-horas': '2026-10-19',
  '/blog/velocity-reviews-google-maps-2026': '2026-10-19',
  '/blog/reputacao-online-hoteis': '2026-10-19',
};

// Next 16 + `output: export` exigem rota explicitamente estática.
export const dynamic = 'force-static';

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
  '/blog/como-conseguir-avaliacoes-google': { 'pt-BR':'/blog/como-conseguir-avaliacoes-google', en:'/en/blog/get-google-reviews', es:'/es/blog/conseguir-resenas-google', zh:'/zh/blog/google-reviews-guide' },
  '/blog/gestao-reputacao-online-guia': { 'pt-BR':'/blog/gestao-reputacao-online-guia', en:'/en/blog/online-reputation-management-guide', es:'/es/blog/guia-gestion-reputacion-online', zh:'/zh/blog/online-reputation-management-guide' },
  '/blog/feedback-cliente-para-reputacao': { 'pt-BR':'/blog/feedback-cliente-para-reputacao', en:'/en/blog/customer-feedback-reputation', es:'/es/blog/feedback-clientes-reputacion', zh:'/zh/blog/customer-feedback-reputation' },
  '/blog/seo-local-avaliacoes-local-pack': { 'pt-BR':'/blog/seo-local-avaliacoes-local-pack', en:'/en/blog/local-seo-google-reviews', es:'/es/blog/seo-local-resenas-google', zh:'/zh/blog/local-seo-google-reviews' },
  '/blog/agencia-vender-gestao-reputacao': { 'pt-BR':'/blog/agencia-vender-gestao-reputacao', en:'/en/blog/agency-reputation-management', es:'/es/blog/agencia-gestion-reputacion', zh:'/zh/blog/agency-reputation-management' },
  '/blog': { 'pt-BR':'/blog', en:'/en/blog', es:'/es/blog', zh:'/zh/blog' },
};

const TRANSLATED_BLOG_FAMILIES = [
  { en: '/en/blog/ai-review-analysis-guide', es: '/es/blog/analisis-resenas-ia', zh: '/zh/blog/ai-review-analysis-guide' },
] as const;

const canonicalPaths = [
  '',
  ...Object.keys(SEO_FAMILIES).filter((p) => p !== '/'),
  '/blog/como-responder-avaliacoes-negativas',
  '/blog/velocity-reviews-google-maps-2026',
  '/blog/review-1-estrela-primeiras-24-horas',
  '/blog/qr-code-balcao-reviews',
  '/blog/clinica-checklist-avaliacoes-google',
  '/blog/whatsapp-pedir-estrela-vs-filtrar-qr',
  '/blog/google-business-profile-avaliacoes',
  '/blog/reputacao-online-clinicas',
  '/blog/reputacao-online-hoteis',
  '/blog/reputacao-franquias-multilocal',
  '/blog/avaliacoes-google-restaurantes',
  '/termos',
  '/privacidade',
  '/planos',
];

const localizedPaths = Object.values(SEO_FAMILIES).flatMap((family) =>
  Object.values(family).map((path) => path).filter((path) => path !== family['pt-BR']),
);

const authorityCore = new Set([
  '/',
  '/filtra-ai',
  '/gestao-de-reputacao-online',
  '/avaliacoes-google',
  '/reputacao-google',
  '/analise-de-avaliacoes-com-ia',
  '/feedback-de-clientes',
  '/como-melhorar-avaliacoes-google',
  '/monitoramento-reputacao-online',
  '/gestao-de-feedback',
]);

const highPriority = new Set([
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
  for (const family of TRANSLATED_BLOG_FAMILIES) {
    if (Object.values(family).includes(path as (typeof family)[keyof typeof family])) {
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
  const isBlog = canonical === '/blog' || canonical.startsWith('/blog/') || /^\/(en|es|zh)\/blog(?:\/|$)/.test(canonical);
  const priority = authorityCore.has(canonical) ? 1 : highPriority.has(canonical) ? 0.9 : isBlog ? 0.8 : 0.7;
  return {
    url: base + canonical,
    changeFrequency: authorityCore.has(canonical) || isBlog ? 'weekly' : 'monthly',
    priority,
    alternates: localizedAlternates(canonical),
    lastModified: LAST_MODIFIED[canonical] ? new Date(LAST_MODIFIED[canonical]) : undefined,
  };
}

const translatedBlogPaths = [
  '/en/blog/ai-review-analysis-guide',
  '/es/blog/analisis-resenas-ia',
  '/zh/blog/ai-review-analysis-guide',
];

const allPaths = [...canonicalPaths, ...localizedPaths, ...translatedBlogPaths]
  .filter((path, index, arr) => arr.indexOf(path) === index);

export default function sitemap(): MetadataRoute.Sitemap {
  return allPaths.map(entry);
}
