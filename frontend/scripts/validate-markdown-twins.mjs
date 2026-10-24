// Valida as versões .md geradas por generate-markdown-twins.mjs no export estático.
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(frontendDir, 'out');
const exists = (p) => access(p).then(() => true, () => false);

if (!(await exists(out))) {
  console.log('Skipping markdown twin validation: no "out" directory was generated.');
  process.exit(0);
}

const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };

const sitemap = await readFile(path.join(out, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]);

// 1) .md nunca entra no sitemap (o HTML é o canônico).
check(!urls.some((u) => u.endsWith('.md')), 'sitemap.xml must not list .md URLs');

// 2) Cada página do sitemap (exceto a home) tem um gêmeo íntegro.
for (const url of urls) {
  const { pathname } = new URL(url);
  if (pathname === '/') continue;
  const file = path.join(out, `${pathname.slice(1)}.md`);
  if (!(await exists(file))) { errors.push(`missing markdown twin: ${pathname}.md`); continue; }
  const md = await readFile(file, 'utf8');
  check(md.startsWith(`> Fonte canônica: ${url} `), `${pathname}.md must start with its canonical source line`);
  check(md.length > 500, `${pathname}.md is suspiciously short (${md.length} chars)`);
  check(/^# .+/m.test(md), `${pathname}.md must contain an H1`);
  check(!/<(div|svg|script|style|button|nav)[\s>]/i.test(md), `${pathname}.md still contains raw HTML markup`);
}

// 3) _headers: Content-Type correto e canonical apontando para o HTML.
const headers = (await exists(path.join(out, '_headers'))) ? await readFile(path.join(out, '_headers'), 'utf8') : '';
check(/^\/\*\.md\s*$/m.test(headers), '_headers must declare a /*.md rule');
check(/Content-Type:\s*text\/markdown/i.test(headers), '_headers must serve .md as text/markdown');
check(headers.includes('Link: <https://filtraai.com/:splat>; rel="canonical"'), '_headers must point .md to the HTML canonical via Link');
check((headers.match(/^\S.*$/gm) || []).filter((l) => !l.startsWith('#')).length <= 100, '_headers exceeds the 100-rule Cloudflare Pages limit');

// 4) llms.txt lista só .md que existem; llms-full.txt traz conteúdo de verdade.
const llms = await readFile(path.join(out, 'llms.txt'), 'utf8');
const listed = [...llms.matchAll(/https:\/\/filtraai\.com\/(\S+?\.md)\b/g)].map((m) => m[1]);
check(listed.length > 20, `llms.txt should list the markdown versions (found ${listed.length})`);
for (const rel of listed) check(await exists(path.join(out, rel)), `llms.txt lists a missing file: ${rel}`);

const full = await readFile(path.join(out, 'llms-full.txt'), 'utf8');
check(full.length > 10_000, `llms-full.txt should carry the core pages' content (got ${full.length} chars)`);
check(full.includes('https://filtraai.com/gestao-de-reputacao-online'), 'llms-full.txt must include the reputation management page');

if (errors.length) {
  console.error(`Markdown twin validation FAILED (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Markdown twin validation passed: ${urls.length - 1} twins, ${listed.length} llms.txt entries, _headers rule OK.`);
