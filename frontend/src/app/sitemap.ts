import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

const paths = [
  '',
  '/filtra-ai',
  '/reputacao-google',
  '/como-melhorar-avaliacoes-google',
  '/monitoramento-reputacao-online',
  '/gestao-de-feedback',
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

const localizedPaths = [
  '/en','/es','/zh',
  '/en/ai','/en/customer-feedback','/en/ai-review-analysis','/en/online-reputation-management','/en/google-reviews',
  '/es/ia','/es/feedback-clientes','/es/analisis-resenas-ia','/es/gestion-reputacion-online','/es/resenas-google',
  '/zh/ai','/zh/customer-feedback','/zh/ai-review-analysis','/zh/online-reputation-management','/zh/google-reviews',
  '/en/filtra-ai','/es/filtra-ai','/zh/filtra-ai',
  '/en/google-reputation','/es/reputacion-google','/zh/google-reputation',
  '/en/improve-google-reviews','/es/mejorar-resenas-google','/zh/improve-google-reviews',
  '/en/online-reputation-monitoring','/es/monitoreo-reputacion-online','/zh/online-reputation-monitoring',
  '/en/customer-feedback-management','/es/gestion-feedback-clientes','/zh/customer-feedback-management',
] as const;

const highPriority = new Set<string>([
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
  return [...paths, ...localizedPaths].map((path) => {
    const freq: 'weekly' | 'monthly' =
      path === '' || path.startsWith('/blog') ? 'weekly' : 'monthly';
    const priority =
      path === '' ? 1 : highPriority.has(path) ? 0.95 : path.startsWith('/blog') ? 0.8 : 0.7;
    return entry(path, freq, priority);
  });
}
