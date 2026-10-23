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
function metadataObject(source, key) {
  const start = source.indexOf(`${key}: {`);
  if (start < 0) return '';
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, index + 1);
    }
  }
  return '';
}

check(sitemap.includes("  '/planos',"), 'sitemap.ts must include /planos');
check(rootLayout.includes('localized-document-language') && rootLayout.includes('document.documentElement.lang'), 'Root layout must set the document language for localized routes before hydration');
check(plansLayout.includes("canonical: 'https://filtraai.com/planos'"), 'Plans canonical must point to /planos');
check(plansLayout.includes("url: 'https://filtraai.com/planos'"), 'Plans Open Graph URL must point to /planos');
check(!plansPage.includes('window.location.replace'), 'Plans page must render content instead of redirecting client-side');
check(plansPage.includes('<PlanCards />'), 'Plans page must render the shared pricing cards');
check(robots.includes("const base = 'https://filtraai.com'") && robots.includes('sitemap: `${base}/sitemap.xml`'), 'Next robots metadata must reference the canonical sitemap URL');
check(robots.includes("disallow: ['/api/']"), 'robots metadata must disallow API endpoints only');
const markdownGenerator = read('scripts/generate-seo-markdown.mjs');
const frontendPackage = JSON.parse(read('package.json'));
const nextConfig = read('next.config.mjs');
check(frontendPackage.scripts.build.includes('scripts/generate-seo-markdown.mjs'), 'Frontend build must generate Markdown companions before Next.js build');
check(markdownGenerator.includes('pages.length !== 308') && markdownGenerator.includes('uniqueSlugs.size !== pages.length'), 'Markdown generator must fail on unexpected page count or duplicate slugs');
check(markdownGenerator.includes('canonical:') && markdownGenerator.includes('public/solucoes'), 'Markdown companions must declare their canonical HTML URL and stay in a separate public path');
check(nextConfig.includes("source: '/solucoes/:slug.md'") && nextConfig.includes('text/markdown; charset=utf-8'), 'Vercel must serve Markdown companions with the correct content type');
check(sitemap.includes("'/solucoes/") && !sitemap.includes('.md'), 'Markdown companion files must remain outside the XML sitemap');

const retrievalBotsBlock = robots.match(/const retrievalBots = \[([\s\S]*?)\];/)?.[1] || '';
const trainingBotsBlock = robots.match(/const trainingBots = \[([\s\S]*?)\];/)?.[1] || '';
for (const bot of ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot', 'Applebot']) {
  check(retrievalBotsBlock.includes(`'${bot}'`) && !trainingBotsBlock.includes(`'${bot}'`), `robots must classify ${bot} as a retrieval/search crawler`);
}
for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot']) {
  check(trainingBotsBlock.includes(`'${bot}'`) && !retrievalBotsBlock.includes(`'${bot}'`), `robots must explicitly classify ${bot} under the training-crawler policy`);
}
check(robots.includes('...retrievalBots.map') && robots.includes('...trainingBots.map'), 'robots must emit both explicit crawler policy groups');
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
const programmaticSeoPage = read('src/app/solucoes/[seoPage]/page.tsx');
const programmaticSeoSlugs = new Set([...programmaticSeoPage.matchAll(/[\"']?slug[\"']?\s*:\s*[\"']([^\"']+)[\"']/g)].map((match) => match[1]));
check(programmaticSeoPage.includes('generateStaticParams') && programmaticSeoPage.includes('SeoLanding'), 'Programmatic commercial pages must be statically generated and render the shared SEO landing template');
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
  } else if (path.startsWith('/solucoes/')) {
    check(programmaticSeoSlugs.has(path.slice('/solucoes/'.length)), `Sitemap programmatic route has no matching SEO page: ${path}`);
  } else if (!staticRoutes.has(path)) {
    check(false, `Sitemap route has no matching static page: ${path}`);
  }
}


const localSeoArticle = read('src/app/blog/seo-local-avaliacoes-local-pack/page.tsx');
const reputationGuide = read('src/app/blog/gestao-reputacao-online-guia/page.tsx');
const blogIndex = read('src/app/blog/page.tsx');
const ratingCalculator = read('src/app/calculadora-nota-google/page.tsx');
const reputationLanding = read('src/app/gestao-de-reputacao-online/page.tsx');
const blogArticleComponent = read('src/app/components/BlogArticle.tsx');
const seoLandingComponent = read('src/app/components/SeoLanding.tsx');
const seoPageHeader = read('src/app/components/SeoPageHeader.tsx');
const homePage = read('src/app/preview/page.tsx');

check(localSeoArticle.includes("const canonical = 'https://filtraai.com/blog/seo-local-avaliacoes-local-pack'"), 'Local SEO article must declare its self-referencing canonical');
const blogSchemaLib = read('src/app/lib/blogSchema.ts');
const blogSchemaComponent = read('src/app/components/BlogSchema.tsx');
const pluginDemo = read('public/plugin-demo.html');

check(blogSchemaLib.includes("'@type': 'BlogPosting'") && blogSchemaLib.includes("'@type': 'BreadcrumbList'") && blogSchemaLib.includes('image: OG_IMAGE_URL'), 'Shared blog schema must emit BlogPosting + BreadcrumbList with a real social image');
check(blogSchemaComponent.includes('buildBlogPosting') && blogSchemaComponent.includes('buildBreadcrumbList'), 'BlogSchema component must render both BlogPosting and BreadcrumbList');
check(localSeoArticle.includes('<BlogSchema') && localSeoArticle.includes('canonical={canonical}') && localSeoArticle.includes('datePublished="2026-09-23"') && localSeoArticle.includes('dateModified="2026-10-20"'), 'Local SEO article must expose BlogPosting + BreadcrumbList via BlogSchema with canonical and real dates');
check(localSeoArticle.includes('headline="Pacotes de SEO local: o que incluir para gerar crescimento"'), 'Local SEO BlogPosting headline must match the visible H1');
check(localSeoArticle.includes("title: 'Pacotes de SEO local: preço, escopo e o que incluir'") && localSeoArticle.includes("card: 'summary_large_image'") && localSeoArticle.includes('images: [OG_IMAGE_META.url]'), 'Local SEO article must define article-specific Twitter metadata instead of inheriting generic site metadata');
check(reputationGuide.includes("title: 'Como fazer gestão de reputação online: processo e indicadores'") && reputationGuide.includes("card: 'summary_large_image'") && reputationGuide.includes('images: [OG_IMAGE_META.url]'), 'Reputation guide must define article-specific Twitter metadata instead of inheriting generic site metadata');
const socialMetadataPages = [
  ['Blog hub', blogIndex],
  ['Rating calculator', ratingCalculator],
  ['Reputation guide', reputationGuide],
  ['Local SEO article', localSeoArticle],
  ['Reputation landing page', reputationLanding],
];
for (const [name, source] of socialMetadataPages) {
  check(metadataObject(source, 'openGraph').includes('images: [OG_IMAGE_META]'), `${name} Open Graph metadata must keep the shared social image`);
  const twitter = metadataObject(source, 'twitter');
  if (twitter.includes("card: 'summary_large_image'")) {
    check(twitter.includes('images: [OG_IMAGE_META.url]'), `${name} summary_large_image Twitter card must declare the shared social image`);
  }
}
check(localSeoArticle.includes('datePublished="2026-09-23"'), 'Local SEO BlogPosting must declare the original publication date');
check(blogArticleComponent.includes('href="/calculadora-nota-google"') && blogArticleComponent.includes('Calculadora de nota do Google'), 'Shared blog article navigation must link to the rating calculator');
check(blogIndex.includes("href: '/calculadora-nota-google'"), 'Blog hub must link to the Google rating calculator');
check(blogIndex.includes('Como fazer gestão de reputação online: guia prático'), 'Blog hub title must match the informational reputation guide intent');
check(localSeoArticle.includes("title: 'Pacotes de SEO local: preço, escopo e o que incluir (2026)'"), 'Local SEO article title must match the package/pricing search intent');
check(localSeoArticle.includes('href="/calculadora-nota-google"'), 'Local SEO article must link contextually to the Google rating calculator');
check(localSeoArticle.includes('const faqs = [') && localSeoArticle.includes('mainEntity: faqs.map'), 'Local SEO FAQ schema must be generated from the same FAQ data as the visible page');
check(localSeoArticle.includes('Pacote básico, recorrente ou multiunidade?') && localSeoArticle.includes('Como precificar pacotes de SEO local'), 'Local SEO article must cover package scope and pricing decisions');
check(reputationGuide.includes("title: 'Como fazer gestão de reputação online: guia prático'"), 'Reputation guide must target the informational how-to intent');
check(reputationGuide.includes('dateModified="2026-10-20"'), 'Reputation guide BlogPosting schema must use the actual content update date');
check(sitemap.includes("'/blog/seo-local-avaliacoes-local-pack': '2026-10-20'"), 'Sitemap lastModified must reflect the local SEO article update');
check(sitemap.includes("'/gestao-de-reputacao-online': '2026-10-22'") && sitemap.includes("'/blog/gestao-reputacao-online-guia': '2026-10-20'"), 'Sitemap dates must align with the updated reputation pages');
check(sitemap.includes("'/blog': '2026-10-22'"), 'Sitemap must reflect the blog hub metadata update');
const sitemapLastModified = sitemap.match(/const LAST_MODIFIED[^=]*= \{([\s\S]*?)\n\};/)?.[1] ?? '';
const sitemapLastModifiedKeys = [...sitemapLastModified.matchAll(/^  '([^']+)':/gm)].map((match) => match[1]);
check(sitemapLastModifiedKeys.length === new Set(sitemapLastModifiedKeys).size, 'Sitemap lastModified map must not contain duplicate keys');
check(ratingCalculator.includes('const faq = [') && ratingCalculator.includes("const canonical = 'https://filtraai.com/calculadora-nota-google'"), 'Rating calculator must keep its canonical and visible FAQ source');
check(ratingCalculator.includes('href="/blog/seo-local-avaliacoes-local-pack"'), 'Rating calculator must link to the local SEO strategy guide');
check(seoLandingComponent.includes("href: '/calculadora-nota-google'") && seoLandingComponent.includes('Calculadora de nota do Google'), 'Commercial reputation landing pages must cross-link to the rating calculator');
check(reputationLanding.includes("title: 'Software de gestão de reputação online'") && !reputationLanding.includes("title: 'Software de gestão de reputação online | Filtra.AI'"), 'Reputation landing title must not repeat the Filtra.AI brand');
check(reputationLanding.includes('faq={faq}') && !reputationLanding.includes('faqSchema'), 'Reputation landing FAQ must be visible and use the shared FAQ schema');
check(blogIndex.includes("en: 'https://filtraai.com/en/blog'") && blogIndex.includes("es: 'https://filtraai.com/es/blog'") && blogIndex.includes("'x-default': 'https://filtraai.com/blog'"), 'Blog hub must declare PT, EN and ES hreflang alternates');
check(seoPageHeader.includes('href="/blog"') && seoPageHeader.includes('href="/planos"'), 'Commercial SEO header must link to the blog hub and plans page');
check(blogArticleComponent.includes('href="/planos"'), 'Shared blog article navigation must link to the plans page');
check(homePage.includes('href="/blog"') && homePage.includes('href="/planos"') && homePage.includes("'/avaliacoes-google'"), 'Home page must link to the blog hub, plans and Google reviews priority page');

const expandedLandingPages = [
  ['Google reputation page', read('src/app/reputacao-google/page.tsx')],
  ['Feedback management page', read('src/app/gestao-de-feedback/page.tsx')],
  ['Improve Google reviews page', read('src/app/como-melhorar-avaliacoes-google/page.tsx')],
  ['Hotels page', read('src/app/hoteis/page.tsx')],
  ['Restaurants page', read('src/app/restaurantes/page.tsx')],
  ['Tourism page', read('src/app/turismo/page.tsx')],
  ['Associations page', read('src/app/associacoes/page.tsx')],
  ['AI page', read('src/app/ia/page.tsx')],
];
for (const [name, source] of expandedLandingPages) {
  check(source.includes('faq={['), `${name} must expose visible FAQ content and FAQPage schema`);
}

const localSeoInternalLinks = [...localSeoArticle.matchAll(/<Link\s+href="(\/[^"]+)"/g)].map((match) => match[1]);
for (const path of localSeoInternalLinks) {
  check(staticRoutes.has(path), `Local SEO article links to a route without a static page: ${path}`);
}
check(localSeoInternalLinks.includes('/calculadora-nota-google'), 'Local SEO article must retain its contextual calculator link');
const localSeoHeadings = [...localSeoArticle.matchAll(/<H2>([^<]+)<\/H2>/g)].map((match) => match[1].trim().toLocaleLowerCase('pt-BR'));
const repeatedLocalSeoHeadings = localSeoHeadings.filter((heading, index) => localSeoHeadings.indexOf(heading) !== index);
check(repeatedLocalSeoHeadings.length === 0, `Local SEO article contains repeated headings: ${[...new Set(repeatedLocalSeoHeadings)].join(', ')}`);

const blogDir = resolve(appRoot, 'blog');
const blogPostDirs = readdirSync(blogDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
check(blogPostDirs.length >= 16, `Expected at least 16 blog posts, found ${blogPostDirs.length}`);
for (const dir of blogPostDirs) {
  const source = read(`src/app/blog/${dir}/page.tsx`);
  const schemaTag = source.match(/<BlogSchema[\s\S]*?\/>/)?.[0] ?? '';
  check(source.includes('<BlogSchema'), `${dir} must render the shared BlogSchema`);
  check(schemaTag.includes('canonical='), `${dir} BlogSchema must declare its canonical`);
  check(schemaTag.includes('datePublished="'), `${dir} BlogSchema must declare datePublished`);
  check(schemaTag.includes('dateModified="'), `${dir} BlogSchema must declare dateModified`);
  check(source.includes('twitter:'), `${dir} must define article-specific Twitter metadata`);
  check(metadataObject(source, 'openGraph').includes('images:'), `${dir} Open Graph metadata must include a social image`);
  check(source.includes('BlogArticle') || source.includes('<BlogBreadcrumb'), `${dir} must render a visible breadcrumb`);
}
check(blogArticleComponent.includes('<BlogBreadcrumb'), 'Shared blog article layout must render the visible breadcrumb');
check(pluginDemo.includes('name="robots" content="noindex, nofollow"'), 'Plugin demo page must be noindexed');
check(!rootLayout.includes('robots: { index: true, follow: true'), 'Root layout must not emit index/follow on the framework 404');
check(rootLayout.includes("other: { googlebot: 'max-image-preview:large, max-snippet:-1' }"), 'Root layout must preserve Googlebot image/snippet directives');

const socialTemplates = [
  ['Localized landing pages', read('src/app/[lang]/[slug]/page.tsx')],
  ['Localized blog articles', read('src/app/[lang]/blog/[slug]/page.tsx')],
  ['Localized home', read('src/app/[lang]/page.tsx')],
  ['Localized blog index', read('src/app/[lang]/blog/page.tsx')],
];
for (const [name, source] of socialTemplates) {
  check(source.includes('OG_IMAGE_META') && source.includes('buildTwitter'), `${name} must define og:image and Twitter images`);
}

const monitoringSocial = read('src/app/monitoramento-reputacao-online/page.tsx');
const aiReviewSocial = read('src/app/analise-de-avaliacoes-com-ia/page.tsx');
for (const [name, source] of [
  ['Reputation monitoring landing', monitoringSocial],
  ['AI review analysis landing', aiReviewSocial],
]) {
  const twitter = metadataObject(source, 'twitter');
  check(twitter.includes('title,') && twitter.includes('description,'), `${name} must define page-specific Twitter title and description instead of inheriting generic site copy`);
  check(twitter.includes("card: 'summary_large_image'") && twitter.includes('images: [OG_IMAGE_META.url]'), `${name} must define a large Twitter card and social image`);
}

const socialLandingFiles = [
  'src/app/ia/page.tsx',
  'src/app/filtra-ai/page.tsx',
  'src/app/analise-de-avaliacoes-com-ia/page.tsx',
  'src/app/avaliacoes-google/page.tsx',
  'src/app/monitoramento-reputacao-online/page.tsx',
  'src/app/auditoria-gratuita/page.tsx',
  'src/app/auditoria-gratuita/layout.tsx',
  'src/app/hoteis/page.tsx',
  'src/app/turismo/page.tsx',
  'src/app/agencias/page.tsx',
  'src/app/clinicas/page.tsx',
  'src/app/franquias/page.tsx',
  'src/app/associacoes/page.tsx',
  'src/app/como-funciona/page.tsx',
  'src/app/parceiros/page.tsx',
  'src/app/pedir-estrela-vs-filtrar/page.tsx',
  'src/app/termos/layout.tsx',
  'src/app/privacidade/layout.tsx',
  'src/app/planos/layout.tsx',
];
for (const path of socialLandingFiles) {
  const source = read(path);
  check(metadataObject(source, 'openGraph').includes('images:'), `${path} Open Graph metadata must include og:image`);
  const twitter = metadataObject(source, 'twitter');
  check(!twitter || twitter.includes('images:'), `${path} Twitter metadata must include twitter:image`);
}

// Rotas dinâmicas: o shell `_` atende o export estático, mas dev/Vercel precisam
// aceitar ids arbitrários. `dynamicParams = false` restringiria a rota ao placeholder.
for (const route of ['painel', 'avaliacao', 'widget']) {
  const source = read(`src/app/${route}/[id]/page.tsx`);
  check(
    !/^\s*export\s+const\s+dynamicParams\s*=\s*false\b/m.test(source),
    `/${route}/[id] must not disable dynamicParams; runtime ids would return 404`,
  );
}
const redirects = read('public/_redirects')
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\s+/g, ' '));
for (const [route, shell] of [
  ['/painel/*', '/painel/_.html'],
  ['/avaliacao/*', '/avaliacao/_.html'],
  ['/widget/*', '/widget/_.html'],
]) {
  check(redirects.includes(`${route} ${shell} 200`), `_redirects must map ${route} to ${shell} with status 200`);
}

// Next returns 308 for `permanent: true`; these legacy SEO redirects must be 301.
const nextConfigSource = read('next.config.mjs');
for (const route of [
  '/en/hoteis',
  '/en/clinicas',
  '/en/auditoria-gratuita',
  '/en/turismo',
  '/es/parceiros',
  '/es/feedback-de-clientes',
  '/zh/gestao-de-reputacao-online',
  '/zh/agencias',
  '/zh/restaurantes',
  '/zh/avaliacoes-google',
]) {
  const line = nextConfigSource.split(/\r?\n/).find((entry) => entry.includes(`source: '${route}'`));
  check(line?.includes('statusCode: 301'), `${route} must redirect with statusCode 301`);
}

assert.equal(errors.length, 0, errors.map((error) => `- ${error}`).join('\n'));
console.log(`SEO source validation passed: ${paths.length} canonical paths, ${families.length} hreflang families and ${sitemapPaths.length} unique sitemap path literals checked.`);
