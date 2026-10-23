#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

const host = 'filtraai.com';
const key = process.env.INDEXNOW_KEY || 'a3d7f1c94b2e6a805d1f7c3b9e4a6d82';
const keyLocation = `https://${host}/${key}.txt`;
const out = resolve(process.env.NEXT_OUT_DIR || 'out');
const statePath = resolve(process.env.INDEXNOW_STATE_FILE || '.cache/indexnow-state.json');
const sitemapPath = join(out, 'sitemap.xml');
assert.ok(existsSync(sitemapPath), `Static build sitemap is missing: ${sitemapPath}`);

const xml = readFileSync(sitemapPath, 'utf8');
const entries = [...xml.matchAll(/<url>([\\s\\S]*?)<\\/url>/gi)].map((match) => {
  const block = match[1];
  const loc = block.match(/<loc>\\s*([^<]+?)\\s*<\\/loc>/i)?.[1]?.replaceAll('&amp;', '&').trim();
  const lastmod = block.match(/<lastmod>\\s*([^<]+?)\\s*<\\/lastmod>/i)?.[1]?.trim() || null;
  return { loc, lastmod };
}).filter(({ loc }) => Boolean(loc));

function routeFile(pathname) {
  const clean = pathname.replace(/^\\/+|\\/+$/g, '');
  const candidates = pathname === '/'
    ? [join(out, 'index.html')]
    : [join(out, `${clean}.html`), join(out, clean, 'index.html')];
  return candidates.find((candidate) => {
    const absolute = resolve(candidate);
    return (absolute === out || absolute.startsWith(out + sep)) && existsSync(absolute);
  });
}
function robotsMeta(html) {
  const tags = [...html.matchAll(/<meta\\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of tags) {
    const name = tag.match(/\\bname=[\"']robots[\"']/i);
    if (!name) continue;
    return tag.match(/\\bcontent=[\"']([^\"']*)[\"']/i)?.[1] || '';
  }
  return '';
}
function eligible(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== host || parsed.search || parsed.hash) return false;
  if (parsed.pathname === '/zh' || parsed.pathname.startsWith('/zh/')) return false;
  const file = routeFile(parsed.pathname);
  if (!file) throw new Error(`Sitemap URL has no exported HTML: ${url}`);
  const html = readFileSync(file, 'utf8');
  if (/\\bnoindex\\b/i.test(robotsMeta(html))) return false;
  return true;
}

const current = {};
for (const { loc, lastmod } of entries) {
  let url;
  try { url = new URL(loc).toString(); } catch { throw new Error(`Invalid sitemap URL: ${loc}`); }
  if (!eligible(url)) continue;
  current[url] = lastmod;
}
assert.ok(Object.keys(current).length, 'No eligible URLs found in the local static sitemap');

let previous = null;
if (existsSync(statePath)) {
  try { previous = JSON.parse(readFileSync(statePath, 'utf8')); }
  catch { throw new Error(`IndexNow state file is invalid: ${statePath}`); }
}
if (!previous || typeof previous !== 'object' || Array.isArray(previous)) {
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(current, null, 2) + '\\n');
  console.log(`IndexNow baseline initialized with ${Object.keys(current).length} eligible URLs; nothing submitted on first run.`);
  process.exit(0);
}

const changed = Object.keys(current).filter((url) => !Object.hasOwn(previous, url) || current[url] !== previous[url]);
if (!changed.length) {
  console.log(`IndexNow: no new or changed eligible URLs (${Object.keys(current).length} tracked).`);
  process.exit(0);
}
if (changed.length > 10000) throw new Error(`Too many changed URLs for one IndexNow request: ${changed.length}`);

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation, urlList: changed }),
});
if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow rejected submission: HTTP ${response.status} ${await response.text()}`);
}
mkdirSync(dirname(statePath), { recursive: true });
writeFileSync(statePath, JSON.stringify(current, null, 2) + '\\n');
console.log(`IndexNow accepted ${changed.length} new/changed URLs (HTTP ${response.status}); ${Object.keys(current).length} eligible URLs tracked.`);
