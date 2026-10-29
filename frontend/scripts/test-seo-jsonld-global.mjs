import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync('src/app/components/JsonLd.tsx', 'utf8');
const rootLayout = readFileSync('src/app/layout.tsx', 'utf8');
const homepage = readFileSync('src/app/page.tsx', 'utf8');
const plans = readFileSync('src/app/components/PlanCards.tsx', 'utf8');
const indexNow = readFileSync('scripts/submit-indexnow.mjs', 'utf8');

assert.match(rootLayout, /<JsonLd\s*\/>/, 'Global JSON-LD component must remain mounted in the root layout');
assert.match(component, /'@type': 'Organization'/, 'Global graph must describe the organization');
assert.match(component, /'@type': 'WebSite'/, 'Global graph must describe the website');
assert.match(component, /'@type': 'SoftwareApplication'/, 'Global graph must describe the software product');
assert.doesNotMatch(
  component,
  /'@type':\s*'WebPage'/,
  'Page-specific WebPage schema must not be emitted globally on every route',
);
assert.match(homepage, /'@type': 'WebPage'/, 'Homepage must retain its own WebPage schema');
assert.match(homepage, /'@id': 'https:\/\/filtraai\.com\/#webpage'/, 'Homepage schema must use the homepage entity ID');
assert.match(homepage, /['"]?inLanguage['"]?:\s*'pt-BR'/, 'Homepage schema must declare its language');

// Keep the global Offer aligned with the entry-level price shown to visitors.
assert.match(plans, /priceMensal:\s*'R\$\\u00a069,90'/, 'Entry monthly plan must remain R$ 69,90');
assert.match(component, /price:\s*'69\.90'/, 'SoftwareApplication Offer must use the paid entry price');
assert.match(component, /priceCurrency:\s*'BRL'/, 'SoftwareApplication Offer must use BRL');
assert.match(component, /url:\s*`\$\{siteUrl\}\/planos`/, 'SoftwareApplication Offer must link to the plans page');
assert.doesNotMatch(component, /price:\s*'0'/, 'A paid SaaS must not be marked as entirely free because it offers a free trial');
assert.match(component, /teste gratuito de 7 dias sem cartão/i, 'Offer description must distinguish the free trial from the paid subscription');

// IndexNow must cover all same-host URLs reachable through the central sitemap index.
assert.match(indexNow, /sitemapIndexUrl = `https:\/\/\$\{host\}\/sitemap-index\.xml`/, 'IndexNow must start from the central sitemap index');
assert.match(indexNow, /<sitemapindex\\b/, 'IndexNow must recognize sitemap indexes');
assert.match(indexNow, /MAX_URLS_PER_REQUEST = 10_000/, 'IndexNow requests must respect the 10,000 URL batch limit');
assert.match(indexNow, /visitedSitemaps/, 'IndexNow must avoid loops and duplicate sitemap fetches');
assert.match(indexNow, /discoveredUrls = new Set\(\)/, 'IndexNow must deduplicate discovered URLs');
assert.match(indexNow, /response\.status/, 'IndexNow must check and report each submission response');

console.log('SEO global JSON-LD, pricing consistency, and IndexNow coverage tests passed.');
