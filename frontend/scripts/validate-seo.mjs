import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const sitemap = read('src/app/sitemap.ts');
const plansLayout = read('src/app/planos/layout.tsx');
const robots = read('src/app/robots.ts');
const publicRobots = read('public/robots.txt');

const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

check(sitemap.includes("  '/planos',"), 'sitemap.ts must include /planos');
check(plansLayout.includes("canonical: 'https://filtraai.com/planos'"), 'Plans canonical must point to /planos');
check(plansLayout.includes("url: 'https://filtraai.com/planos'"), 'Plans Open Graph URL must point to /planos');
check(robots.includes('https://filtraai.com/sitemap.xml'), 'Next robots metadata must reference the sitemap');
check(publicRobots.includes('https://filtraai.com/sitemap.xml'), 'public/robots.txt must reference the sitemap');

const paths = [...sitemap.matchAll(/^\s*'((?:\/)[^']*)',?\s*$/gm)].map((match) => match[1]);
const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
check(duplicates.length === 0, `sitemap source contains duplicate literal paths: ${[...new Set(duplicates)].join(', ')}`);

const families = [...sitemap.matchAll(/^\s*'([^']+)':\s*\{([^}]+)\},?\s*$/gm)];
for (const [, family, body] of families) {
  const targets = [...body.matchAll(/(?:'[^']+'|[a-z-]+):\s*'([^']+)'/g)].map((match) => match[1]);
  check(new Set(targets).size === targets.length, `hreflang family ${family} maps multiple languages to the same URL`);
  check(targets.every((path) => path.startsWith('/')), `hreflang family ${family} contains a non-local path`);
}

assert.equal(errors.length, 0, errors.map((error) => `- ${error}`).join('\n'));
console.log(`SEO source validation passed: ${paths.length} literal path entries and ${families.length} hreflang families checked.`);
