import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://filtraai.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    '',
    '/como-funciona',
    '/restaurantes',
    '/clinicas',
    '/agencias',
    '/pedir-estrela-vs-filtrar',
    '/blog/como-conseguir-avaliacoes-google',
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
