import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import assert from 'node:assert/strict';

const appRoot = resolve(process.cwd(), 'src/app');
const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');
const sitemap = read('src/app/sitemap.ts');
const rootLayout = read('src/app/layout.tsx');
const plansLayout = read('src/app/planos/layout.tsx');
const plansPage = read('src/app/planos/page.tsx');
const robots = read('src/app/robots.ts');
const localizedPages = read('src/app/[lang]/[slug]/page.tsx');
const localizedBlogs = read('src/app/[lang]/blog/[slug]/page.tsx');
const localizedHome = read('src/app/[lang]/page.tsx');
const localizedBlogIndex = read('src/app/[lang]/blog/page.tsx');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

check(sitemap.includes("  '/planos',"), 'sitemap.ts must include /planos');
check(rootLayout.includes('localized-document-language') && rootLayout.includes('document.documentElement.lang'), 'Root layout must set the document language for localized routes before hydration');
check(plansLayout.includes("canonical: 'https://filtraai.com/planos'"), 'Plans canonical must point to /planos');
check(plansLayout.includes("url: 'https://filtraai.com/planos'"), 'Plans Open Graph URL must point to /planos');
check(!plansPage.includes('window.location.replace'), 'Plans page must render content instead of redirecting client-side');
check(plansPage.includes('<PlanCards />'), 'Plans page must render the shared pricing cards');
check(robots.includes("const base = 'https://filtraai.com'") && robots.includes('sitemap: `${base}/sitemap.xml`'), 'Next robots metadata must reference the canonical sitemap URL');
check(robots.includes("disallow: ['/api/']"), 'robots metadata must disallow API endpoints only');
check(sitemap.includes('const TRANSLATED_BLOG_FAMILIES') && sitemap.includes("es: '/es/blog/analisis-resenas-ia'"), 'Translated AI-analysis articles must be represented in sitemap hreflang alternates');
check(localizedBlogs.includes('const translatedFamilies') && localizedBlogs.includes("if ('pt' in family)"), 'Translated blog metadata must cross-link all available languages without inventing a Portuguese equivalent');

const start = sitemap.indexOf('const canonicalPaths = [');
const end = sitemap.indexOf('\n];', start);
check(start >= 0 && end > start, 'canonicalPaths array must exist');
const canonicalBlock = start >= 0 && end > start ? sitemap.slice(start, end) : '';
const paths = [...canonicalBlock.matchAll(/^\s*'([^']+)',?\s*$/gm)].map((match) => match[1]);
const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
check(duplicates.length === 0, `canonicalPaths contains duplicate URLs: ${[...new Set(duplicates)].join(', ')}`);

const families = [...sitemap.matchAll(/^\s*'([^']+)':\s*\{([^}]+)\},?\s*$/gm)];
for (const [, family, body] of families) {
  const targets = [...body.matchAll(/(?:'[^']+'|[a-z-]+):\s*'([^']+)'/g)].map((match) => match[1]);
  check(new Set(targets).size === targets.length, `hreflang family ${family} maps multiple languages to the same URL`);
  check(targets.every((path) => path.startsWith('/')), `hreflang family ${family} contains a non-local path`);
  check(targets.length === 4, `hreflang family ${family} should define pt-BR, en, es and zh`);
}

function collectPageRoutes(directory = appRoot) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) found.push(...collectPageRoutes(fullPath));
    else if (entry.isFile() && entry.name === 'page.tsx') {
      const appPath = relative(appRoot, fullPath).split(sep).join('/');
      const route = appPath === 'page.tsx' ? '/' : `/${appPath.replace(/\/page\.tsx$/, '')}`;
      if (!route.includes('[') && !route.includes('(')) found.push(route.replace(/\/+/g, '/'));
    }
  }
  return found;
}

const staticRoutes = new Set(collectPageRoutes());
function slugsForLanguage(source, language) {
  const startMatch = new RegExp('^\\s*' + language + ':\\[', 'm').exec(source);
  if (!startMatch) return new Set();
  const start = startMatch.index;
  const nextLanguages = ['en', 'es', 'zh'].slice(['en', 'es', 'zh'].indexOf(language) + 1);
  const ends = nextLanguages
    .map((next) => new RegExp('^\\s*' + next + ':\\[', 'm').exec(source.slice(start + 1)))
    .filter(Boolean)
    .map((match) => start + 1 + match.index);
  const end = ends.length ? Math.min(...ends) : source.indexOf('\n};', start + 1);
  const block = source.slice(start, end < 0 ? source.length : end);
  return new Set([...block.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1]));
}
const localizedSlugs = Object.fromEntries(['en', 'es', 'zh'].map((lang) => [lang, slugsForLanguage(localizedPages, lang)]));
const localizedBlogSlugs = Object.fromEntries(['en', 'es', 'zh'].map((lang) => [lang, slugsForLanguage(localizedBlogs, lang)]));
const familiesStart = sitemap.indexOf('const SEO_FAMILIES');
const familiesEnd = sitemap.indexOf('const canonicalPaths', familiesStart);
const translatedStart = sitemap.indexOf('const translatedBlogPaths = [');
const translatedEnd = sitemap.indexOf('\n];', translatedStart);
const sitemapData = [
  familiesStart >= 0 && familiesEnd > familiesStart ? sitemap.slice(familiesStart, familiesEnd) : '',
  canonicalBlock,
  translatedStart >= 0 && translatedEnd > translatedStart ? sitemap.slice(translatedStart, translatedEnd) : '',
].join('\n');
const literalPaths = [...sitemapData.matchAll(/'((?:\/)[^']*)'/g)].map((match) => match[1]);
const sitemapPaths = [...new Set(literalPaths)].filter((path) => path !== '/');
for (const path of sitemapPaths) {
  if (/^\/(en|es|zh)\/blog\/[^/]+$/.test(path)) {
    const slug = path.split('/').at(-1);
    const language = path.split('/')[1];
    check(localizedBlogSlugs[language]?.has(slug), `Sitemap blog route has no matching ${language} article slug: ${path}`);
  } else if (/^\/(en|es|zh)\/blog$/.test(path)) {
    check(localizedBlogIndex.includes('generateStaticParams'), 'Localized blog index must define static params');
  } else if (/^\/(en|es|zh)\/[^/]+$/.test(path)) {
    const slug = path.split('/').at(-1);
    const language = path.split('/')[1];
    check(localizedSlugs[language]?.has(slug), `Sitemap localized route has no matching ${language} page slug: ${path}`);
  } else if (/^\/(en|es|zh)$/.test(path)) {
    check(localizedHome.includes('generateStaticParams'), 'Localized home must define static params');
  } else if (!staticRoutes.has(path)) {
    check(false, `Sitemap route has no matching static page: ${path}`);
  }
}


const localSeoArticle = read('src/app/blog/seo-local-avaliacoes-local-pack/page.tsx');
const reputationGuide = read('src/app/blog/gestao-reputacao-online-guia/page.tsx');
const blogIndex = read('src/app/blog/page.tsx');
const ratingCalculator = read('src/app/calculadora-nota-google/page.tsx');

check(localSeoArticle.includes("const canonical = 'https://filtraai.com/blog/seo-local-avaliacoes-local-pack'"), 'Local SEO article must declare its self-referencing canonical');
check(localSeoArticle.includes("title: 'Pacotes de SEO local: preço, escopo e o que incluir (2026)'"), 'Local SEO article title must match the package/pricing search intent');
check(localSeoArticle.includes('href="/calculadora-nota-google"'), 'Local SEO article must link contextually to the Google rating calculator');
check(localSeoArticle.includes('const faqs = [') && localSeoArticle.includes('mainEntity: faqs.map'), 'Local SEO FAQ schema must be generated from the same FAQ data as the visible page');
check(localSeoArticle.includes('Pacote básico, recorrente ou multiunidade?') && localSeoArticle.includes('Como precificar pacotes de SEO local'), 'Local SEO article must cover package scope and pricing decisions');
check(reputationGuide.includes("title: 'Como fazer gestão de reputação online: guia prático'"), 'Reputation guide must target the informational how-to intent');
check(reputationGuide.includes("dateModified: '2026-10-20'"), 'Reputation guide Article schema must use the actual content update date');
check(sitemap.includes("'/blog/seo-local-avaliacoes-local-pack': '2026-10-20'"), 'Sitemap lastModified must reflect the local SEO article update');
check(sitemap.includes("'/gestao-de-reputacao-online': '2026-10-20'") && sitemap.includes("'/blog/gestao-reputacao-online-guia': '2026-10-20'"), 'Sitemap dates must align with the updated reputation pages');
check(ratingCalculator.includes('const faq = [') && ratingCalculator.includes("const canonical = 'https://filtraai.com/calculadora-nota-google'"), 'Rating calculator must keep its canonical and visible FAQ source');

const localSeoHeadings = [...localSeoArticle.matchAll(/<H2>([^<]+)<\\/H2>/g)].map((match) => match[1].trim().toLocaleLowerCase('pt-BR'));
const repeatedLocalSeoHeadings = localSeoHeadings.filter((heading, index) => localSeoHeadings.indexOf(heading) !== index);
check(repeatedLocalSeoHeadings.length === 0, `Local SEO article contains repeated headings: ${[...new Set(repeatedLocalSeoHeadings)].join(', ')}`);

assert.equal(errors.length, 0, errors.map((error) => `- ${error}`).join('\n'));
console.log(`SEO source validation passed: ${paths.length} canonical paths, ${families.length} hreflang families and ${sitemapPaths.length} unique sitemap path literals checked.`);
