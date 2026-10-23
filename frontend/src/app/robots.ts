import type { MetadataRoute } from 'next';

const base = 'https://filtraai.com';

// Explicit groups are intentional: crawlers that match a named group may not
// inherit the wildcard rules. Keep search/retrieval bots allowed and make the
// separate model-training choice explicit.
export const dynamic = 'force-static';

const retrievalBots = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Googlebot',
  'Bingbot',
  'Applebot',
];

const trainingBots = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      ...retrievalBots.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/api/'],
      })),
      ...trainingBots.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
