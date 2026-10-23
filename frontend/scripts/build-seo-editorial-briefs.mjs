#!/usr/bin/env node
/**
 * Turn explicitly mapped, evidence-backed candidate queue items into editorial review briefs.
 * This produces planning artifacts only: it never writes public content or routes.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const queuePath = path.resolve(getArg('--queue', path.join(root, 'reports/seo-aeo-opportunities/qualification-queue.json')));
const candidatesPath = path.resolve(getArg('--candidates', path.join(root, 'reports/seo-aeo-opportunities/opportunities.json')));
const outputDir = path.resolve(getArg('--out', path.join(root, 'reports/seo-aeo-opportunities')));
const queueReport = JSON.parse(await readFile(queuePath, 'utf8'));
const candidatesReport = JSON.parse(await readFile(candidatesPath, 'utf8'));
const candidates = new Map((candidatesReport.candidates ?? []).map((candidate) => [candidate.id, candidate]));
const requiredGates = [
  { id: 'verified-product-capability', label: 'Confirmar capacidade real do Filtra para esta intenção' },
  { id: 'distinctive-evidence-1', label: 'Anexar primeiro elemento de evidência original e autorizado' },
  { id: 'distinctive-evidence-2', label: 'Anexar segundo elemento de evidência original e autorizado' },
  { id: 'source-verification', label: 'Registrar fontes primárias, datas e limites das afirmações' },
  { id: 'editorial-review', label: 'Revisão editorial humana e checagem de conteúdo útil' },
  { id: 'search-intent-review', label: 'Confirmar intenção, idioma, público e aderência comercial' },
  { id: 'cannibalization-review', label: 'Comparar com URLs existentes e resolver canibalização' },
  { id: 'technical-review', label: 'Revisar canonical, indexabilidade, links internos e sitemap' },
];
const briefs = [];
const blocked = [];
for (const item of queueReport.queue ?? []) {
  if (item.action !== 'evaluate-new-candidate-review') continue;
  const candidateId = item.target?.candidateId;
  const candidate = candidates.get(candidateId);
  if (!candidate) {
    blocked.push({ evidenceId: item.evidenceId, candidateId: candidateId ?? null, reason: 'candidate-not-found-in-backlog' });
    continue;
  }
  if (!(Number(item.metrics?.impressions) > 0)) {
    blocked.push({ evidenceId: item.evidenceId, candidateId, reason: 'no-positive-impression-evidence' });
    continue;
  }
  briefs.push({
    briefId: `brief-${item.evidenceId}-${candidate.id}`,
    status: 'editorial-review-required',
    evidence: {
      evidenceId: item.evidenceId,
      query: item.query,
      source: item.source ?? null,
      siteUrl: item.siteUrl ?? null,
      dateRange: item.dateRange ?? null,
      metrics: item.metrics,
      exactCandidateMatchIds: item.exactCandidateMatchIds ?? [],
    },
    candidate: {
      id: candidate.id,
      sectorId: candidate.sectorId,
      sector: candidate.sector,
      intentId: candidate.intentId,
      intent: candidate.intent,
      formatId: candidate.formatId,
      format: candidate.format,
      productFit: candidate.productFit,
      queryHypothesis: candidate.queryHypothesis,
      suggestedPath: candidate.suggestedPath,
      flags: candidate.flags ?? [],
    },
    editorialPlan: {
      workingTitle: null,
      readerQuestion: item.query,
      answerFirstSummary: null,
      primarySourceUrls: [],
      distinctiveEvidence: [],
      verifiedProductCapability: null,
      outline: [],
      examplesOrMethodology: null,
      faqQuestions: [],
      internalLinkTargets: [],
      canonicalTarget: null,
      reviewer: null,
      reviewedAt: null,
    },
    requiredGates: requiredGates.map((gate) => ({ ...gate, passed: false, evidence: null })),
    publishAllowed: false,
  });
}
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: 'Editorial planning queue only. No page content, public route, sitemap entry, canonical, or indexing request is created.',
  policy: { generatedContent: false, routeCreation: false, indexingEnabled: false, publishAllowed: false },
  source: { queueFile: path.basename(queuePath), candidateFile: path.basename(candidatesPath) },
  counts: { briefs: briefs.length, blocked: blocked.length, publishAllowed: 0 },
  blocked,
  briefs,
};
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'editorial-briefs.json'), JSON.stringify(report, null, 2) + '\n');
const csvCell = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
const columns = ['briefId','evidenceId','query','impressions','clicks','averagePosition','sector','intent','format','productFit','candidateId','suggestedPath','flags','status','publishAllowed'];
const csv = [columns.join(','), ...briefs.map((brief) => {
  const row = { briefId: brief.briefId, evidenceId: brief.evidence.evidenceId, query: brief.evidence.query,
    impressions: brief.evidence.metrics?.impressions, clicks: brief.evidence.metrics?.clicks,
    averagePosition: brief.evidence.metrics?.averagePosition, sector: brief.candidate.sector,
    intent: brief.candidate.intent, format: brief.candidate.format, productFit: brief.candidate.productFit,
    candidateId: brief.candidate.id, suggestedPath: brief.candidate.suggestedPath,
    flags: brief.candidate.flags.join(';'), status: brief.status, publishAllowed: false };
  return columns.map((column) => csvCell(row[column])).join(',');
})].join('\n') + '\n';
await writeFile(path.join(outputDir, 'editorial-briefs.csv'), csv);
console.log(JSON.stringify({ ...report.counts, outputDir }, null, 2));
