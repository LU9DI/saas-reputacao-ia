#!/usr/bin/env node

/**
 * Heuristic AEO (Answer Engine Optimization) source audit.
 * This measures source-code signals only, not semantic quality or citation likelihood.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appRoot = resolve(process.cwd(), 'src/app');

// Confirmed route files only; expand this inventory after validating new URLs.
const routes = [
  { path: '/', file: 'page.tsx', contentFiles: ['preview/page.tsx'], label: 'Homepage' },
  { path: '/gestao-de-reputacao-online', file: 'gestao-de-reputacao-online/page.tsx', label: 'Gestão de reputação' },
  { path: '/avaliacoes-google', file: 'avaliacoes-google/page.tsx', label: 'Avaliações Google' },
  { path: '/reputacao-google', file: 'reputacao-google/page.tsx', label: 'Reputação Google' },
  { path: '/analise-de-avaliacoes-com-ia', file: 'analise-de-avaliacoes-com-ia/page.tsx', label: 'Análise com IA' },
  { path: '/como-funciona', file: 'como-funciona/page.tsx', label: 'Como funciona' },
  { path: '/filtra-ai', file: 'filtra-ai/page.tsx', label: 'Produto Filtra.AI' },
  { path: '/auditoria-gratuita', file: 'auditoria-gratuita/page.tsx', label: 'Auditoria gratuita' },
  { path: '/monitoramento-reputacao-online', file: 'monitoramento-reputacao-online/page.tsx', label: 'Monitoramento' },
  { path: '/feedback-de-clientes', file: 'feedback-de-clientes/page.tsx', label: 'Feedback de clientes' },
];

const checks = [
  {
    id: 'title',
    weight: 15,
    description: 'metadados de título específicos da página',
    test: (source) => /export\s+const\s+metadata\b|generateMetadata\s*\(/.test(source) && /title\s*:/.test(source),
  },
  {
    id: 'description',
    weight: 15,
    description: 'metadados de descrição',
    test: (source) => /description\s*:/.test(source),
  },
  {
    id: 'h1',
    weight: 15,
    description: 'H1 explícito ou fornecido ao componente compartilhado SeoLanding',
    test: (source) => /<h1\b/.test(source) || /<SeoLanding\b[\s\S]*?\bh1\s*=/.test(source),
  },
  {
    id: 'direct-answer',
    weight: 20,
    description: 'resposta inicial, resumo ou lead textual',
    test: (source) => /resposta curta|em resumo|\b[a-zà-ú]+ é |\bserve para\b|\bpermite\b|\bconsiste em\b/i.test(source) || /\blead\s*=/.test(source),
  },
  {
    id: 'faq',
    weight: 10,
    description: 'perguntas frequentes ou perguntas e respostas',
    test: (source) => /perguntas frequentes|\bFAQ\b|FAQPage|\bfaq\s*=|\bquestion\s*:/.test(source),
  },
  {
    id: 'structured-data',
    weight: 10,
    description: 'dados estruturados locais ou providos por SeoLanding',
    test: (source) => /JsonLd|Schema|application\/ld\+json|FAQPage|BreadcrumbList|WebPage/.test(source) || /<SeoLanding\b[\s\S]*?\bbreadcrumbHref\s*=/.test(source),
  },
  {
    id: 'canonical',
    weight: 10,
    description: 'canonical explícito ou metadata alternates',
    test: (source) => /canonical\s*:|alternates\s*:/.test(source),
  },
  {
    id: 'evidence',
    weight: 5,
    description: 'sinais de método, fonte, evidência ou limites',
    test: (source) => /metodologia|fontes?\b|evidências?\b|limitações?\b|dados observados/i.test(source),
  },
];

function audit(route) {
  const filePath = resolve(appRoot, route.file);
  if (!existsSync(filePath)) {
    return { ...route, status: 'not-found', score: 0, checks: [], missing: ['arquivo de rota não encontrado'] };
  }

  // Some routes delegate visible content to a shared/child component; include known content files explicitly.
  const sourceFiles = [route.file, ...(route.contentFiles || [])];
  const source = sourceFiles
    .map((file) => resolve(appRoot, file))
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  const results = checks.map((check) => ({
    id: check.id,
    passed: check.test(source),
    weight: check.weight,
    description: check.description,
  }));
  const score = results.reduce((total, check) => total + (check.passed ? check.weight : 0), 0);

  return {
    ...route,
    status: 'audited',
    score,
    checks: results,
    missing: results.filter((check) => !check.passed).map((check) => check.description),
  };
}

if (!existsSync(appRoot)) {
  console.error('AEO audit failed: execute from the frontend directory; src/app was not found.');
  process.exit(1);
}

const results = routes.map(audit);
const audited = results.filter((result) => result.status === 'audited');
const missingRoutes = results.filter((result) => result.status === 'not-found');
const averageScore = audited.length
  ? Math.round(audited.reduce((sum, result) => sum + result.score, 0) / audited.length)
  : 0;

console.log(JSON.stringify({
  audit: 'Filtra.AI AEO source heuristic',
  generatedAt: new Date().toISOString(),
  auditedRoutes: audited.length,
  missingRoutes: missingRoutes.map(({ path, file }) => ({ path, file })),
  averageScore,
  interpretation: 'Pontuação heurística de sinais presentes no código-fonte; não mede qualidade semântica, precisão factual nem probabilidade de citação por mecanismos de IA.',
  routes: results,
}, null, 2));

if (!audited.length) {
  console.error('AEO audit failed: no known public route files were found.');
  process.exit(1);
}
