import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

const localized: Record<string, string[]> = {
  en: ['ai', 'customer-feedback', 'ai-review-analysis', 'online-reputation-management', 'google-reviews'],
  es: ['ia', 'feedback-clientes', 'analisis-resenas-ia', 'gestion-reputacion-online', 'resenas-google'],
  zh: ['ai', 'customer-feedback', 'ai-review-analysis', 'online-reputation-management', 'google-reviews'],
};

const paths = [
  '',
  '/filtra-ai',
  '/feedback-de-clientes',
  '/analise-de-avaliacoes-com-ia',
  '/gestao-de-reputacao-online',
  '/avaliacoes-google',
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
  '/ia',
  '/termos',
  '/privacidade',
] as const;

const highPriority = new Set<string>([
  '/feedback-de-clientes',
  '/analise-de-avaliacoes-com-ia',
  '/gestao-de-reputacao-online',
  '/avaliacoes-google',
  '/auditoria-gratuita',
  '/agencias',
  '/clinicas',
  '/restaurantes',
  '/franquias',
  '/pedir-estrela-vs-filtrar',
  '/ia',
  '/blog/gestao-reputacao-online-guia',
  '/blog/como-conseguir-avaliacoes-google',
  '/blog/seo-local-avaliacoes-local-pack',
]);

function entry(
  path: string,
  changeFrequency: 'weekly' | 'monthly',
  priority: number,
): MetadataRoute.Sitemap[number] {
  return { url: base + path, changeFrequency, priority };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseEntries: MetadataRoute.Sitemap = paths.map((path) => {
    const freq: 'weekly' | 'monthly' =
      path === '' || path.startsWith('/blog') ? 'weekly' : 'monthly';
    const priority =
      path === '' ? 1 : highPriority.has(path) ? 0.95 : path.startsWith('/blog') ? 0.8 : 0.7;
    return entry(path, freq, priority);
  });

  const localizedEntries: MetadataRoute.Sitemap = Object.entries(localized).flatMap(
    ([lang, slugs]) => slugs.map((slug) => entry('/' + lang + '/' + slug, 'monthly', 0.9)),
  );

  return [...baseEntries, ...localizedEntries];
}
