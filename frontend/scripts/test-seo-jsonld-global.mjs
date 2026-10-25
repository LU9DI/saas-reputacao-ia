import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync('src/app/components/JsonLd.tsx', 'utf8');
const rootLayout = readFileSync('src/app/layout.tsx', 'utf8');
const homepage = readFileSync('src/app/page.tsx', 'utf8');

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

console.log('SEO global and homepage JSON-LD scope tests passed.');
