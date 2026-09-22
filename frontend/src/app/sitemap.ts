import type { MetadataRoute } from 'next';
const base = 'https://filtraai.com';
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ['/', '/planos', '/ai-reputation-management', '/review-monitoring', '/hotel-reputation-management', '/restaurant-reputation-management', '/google-review-monitoring', '/termos', '/privacidade'];
  return routes.map((path) => ({ url: base + path, lastModified: now, changeFrequency: path === '/' ? 'weekly' : 'monthly', priority: path === '/' ? 1 : path.startsWith('/ai-') ? 0.9 : 0.8 }));
}
