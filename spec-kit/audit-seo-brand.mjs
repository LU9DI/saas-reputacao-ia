#!/usr/bin/env node

/**
 * Filtra.AI — SEO / brand communication guardrail.
 * Scans public frontend content for explicit competitor attacks,
 * depreciative third-party comparisons, and the known legacy phrase.
 *
 * Usage:
 *   node spec-kit/audit-seo-brand.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'frontend', 'src', 'app');

const RULES = [
  {
    name: 'legacy photography-filter attack',
    pattern: /ferramentas?\s+de\s+filtros?\s+de\s+fotografia/i,
  },
  {
    name: 'direct competitor attack',
    // Neutral educational references (e.g. "comparação com competidores") are
    // allowed. Block only when competitor language is explicitly tied to an
    // insulting or deceptive claim in the same short phrase.
    pattern: /\b(?:concorrentes?|competidores?)\b.{0,80}\b(?:fraude|inútil|rid[ií]culo|pior(?:es)?|inferior(?:es)?|enganoso(?:s)?|desonesto(?:s)?)\b|\b(?:fraude|inútil|rid[ií]culo|pior(?:es)?|inferior(?:es)?|enganoso(?:s)?|desonesto(?:s)?)\b.{0,80}\b(?:concorrentes?|competidores?)\b/i,
  },
  {
    name: 'depreciative framing',
    pattern: /\b(pior\s+(que|do\s+que)|inferior\s+a|rid[ií]culo|inútil|fraude)\b/i,
  },
];

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx']);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path));
    else if (EXTENSIONS.has(path.slice(path.lastIndexOf('.')))) files.push(path);
  }
  return files;
}

if (!statSync(ROOT).isDirectory()) {
  console.error('SEO guardrail: frontend/src/app não encontrado.');
  process.exit(1);
}

const violations = [];

for (const file of walk(ROOT)) {
  const content = readFileSync(file, 'utf8');
  for (const rule of RULES) {
    const match = content.match(rule.pattern);
    if (match) {
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        file: relative(process.cwd(), file),
        line,
        rule: rule.name,
        match: match[0],
      });
    }
  }
}

if (violations.length) {
  console.error('SEO/brand guardrail FAILED.');
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} — ${violation.rule} — "${violation.match}"`,
    );
  }
  process.exit(1);
}

console.log('SEO/brand guardrail PASSED: no prohibited competitor/depreciative language found.');
