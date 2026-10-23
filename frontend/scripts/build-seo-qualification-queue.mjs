#!/usr/bin/env node
/**
 * Qualify imported search evidence using explicit human-reviewed mappings only.
 * No semantic URL matching, route creation, indexing, or publication occurs.
 *
 * Mapping file schema:
 * { "mappings": [{ "normalizedQuery": "example query", "targetType": "existing-page",
 *   "targetUrl": "https://filtraai.com/example", "reviewedBy": "reviewer",
 *   "reviewedAt": "2026-10-23", "rationale": "Existing page covers this intent" }] }
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(name);
  return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '') : fallback;
};
const evidencePath = path.resolve(arg('--evidence', path.join(root, 'reports/seo-aeo-opportunities/demand-evidence.json')));
const candidatesPath = path.resolve(arg('--candidates', path.join(root, 'reports/seo-aeo-opportunities/opportunities.json')));
const mappingsPath = path.resolve(arg('--mappings', path.join(root, 'data/seo-aeo-manual-mappings.json')));
const outputDir = path.resolve(arg('--out', path.join(root, 'reports/seo-aeo-opportunities')));
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const evidenceReport = await readJson(evidencePath);
let candidateRows = [];
try {
  const parsed = await readJson(candidatesPath);
  candidateRows = Array.isArray(parsed.candidates) ? parsed.candidates : [];
} catch { /* Candidate generation is optional; explicit evidence review still works. */ }
let mappings = [];
try {
  const parsed = await readJson(mappingsPath);
  mappings = Array.isArray(parsed.mappings) ? parsed.mappings : [];
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const candidateIds = new Set(candidateRows.map((candidate) => candidate.id));
const keyed = new Map();
const mappingErrors = [];
for (const [index, mapping] of mappings.entries()) {
  const key = mapping.evidenceId ? `id:${mapping.evidenceId}` : mapping.normalizedQuery ? `query:${normalize(mapping.normalizedQuery)}` : null;
  const issues = [];
  if (!key) issues.push('mapping-requires-evidenceId-or-normalizedQuery');
  if (!['existing-page', 'candidate'].includes(mapping.targetType)) issues.push('unsupported-targetType');
  if (mapping.targetType === 'existing-page') {
    try {
      const url = new URL(mapping.targetUrl);
      if (!['http:', 'https:'].includes(url.protocol)) issues.push('existing-page-target-must-be-http-url');
    } catch { issues.push('existing-page-targetUrl-must-be-absolute-url'); }
  }
  if (mapping.targetType === 'candidate' && (!mapping.candidateId || !candidateIds.has(mapping.candidateId))) issues.push('candidate-target-must-reference-known-candidate-id');
  if (!String(mapping.reviewedBy ?? '').trim()) issues.push('reviewedBy-required');
  if (!String(mapping.reviewedAt ?? '').trim()) issues.push('reviewedAt-required');
  if (!String(mapping.rationale ?? '').trim()) issues.push('rationale-required');
  if (issues.length) { mappingErrors.push({ mappingIndex: index, issues }); continue; }
  const list = keyed.get(key) ?? [];
  list.push(mapping);
  keyed.set(key, list);
}
const queue = (evidenceReport.evidence ?? []).map((evidence) => {
  const idKey = `id:${evidence.evidenceId}`;
  const queryKey = `query:${normalize(evidence.normalizedQuery || evidence.query)}`;
  const matches = [...(keyed.get(idKey) ?? []), ...(keyed.get(queryKey) ?? [])];
  let action = 'manual-mapping-required';
  let target = null;
  const reasons = [...(evidence.flags ?? [])];
  if (matches.length > 1) {
    action = 'blocked-conflicting-mappings';
    reasons.push('multiple-reviewed-mappings-match-evidence');
  } else if (matches.length === 1 && matches[0].targetType === 'existing-page' && evidence.siteUrl) {
    const mappingUrl = new URL(matches[0].targetUrl);
    let propertyUrl;
    try { propertyUrl = new URL(evidence.siteUrl); } catch { propertyUrl = null; }
    if (!propertyUrl || mappingUrl.origin !== propertyUrl.origin) {
      action = 'blocked-target-property-mismatch';
      reasons.push('existing-page-target-origin-does-not-match-evidence-site-property');
    }
  }
  if (action === 'manual-mapping-required' && matches.length === 1) {
    const mapping = matches[0];
    target = {
      type: mapping.targetType,
      ...(mapping.targetType === 'existing-page' ? { url: mapping.targetUrl } : { candidateId: mapping.candidateId }),
      reviewedBy: mapping.reviewedBy,
      reviewedAt: mapping.reviewedAt,
      rationale: mapping.rationale,
    };
    action = mapping.targetType === 'existing-page' ? 'optimize-existing-page-review' : 'evaluate-new-candidate-review';
    reasons.push('explicit-human-reviewed-mapping');
  } else if (matches.length === 0) {
    reasons.push('no-explicit-human-reviewed-target');
    if ((evidence.exactCandidateMatchIds ?? []).length === 1) reasons.push('exact-candidate-match-is-suggestion-only');
  }
  if (!(evidence.metrics?.impressions > 0)) reasons.push('insufficient-impression-evidence');
  return {
    evidenceId: evidence.evidenceId,
    query: evidence.query,
    normalizedQuery: evidence.normalizedQuery,
    metrics: evidence.metrics,
    source: evidence.source,
    siteUrl: evidence.siteUrl,
    dateRange: evidence.dateRange,
    exactCandidateMatchIds: evidence.exactCandidateMatchIds ?? [],
    action,
    target,
    reasons: [...new Set(reasons)],
    publishAllowed: false,
  };
});
const counts = {
  evidenceItems: queue.length,
  optimizeExistingPageReview: queue.filter((x) => x.action === 'optimize-existing-page-review').length,
  evaluateNewCandidateReview: queue.filter((x) => x.action === 'evaluate-new-candidate-review').length,
  manualMappingRequired: queue.filter((x) => x.action === 'manual-mapping-required').length,
  conflictingMappingsBlocked: queue.filter((x) => x.action === 'blocked-conflicting-mappings').length,
  targetPropertyMismatchesBlocked: queue.filter((x) => x.action === 'blocked-target-property-mismatch').length,
  invalidMappings: mappingErrors.length,
  publishAllowed: 0,
};
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: 'Human review queue only. These classifications do not authorize content creation, route changes, indexing, or publication.',
  policy: { semanticMatchingEnabled: false, implicitUrlGenerationEnabled: false, publishAllowed: false },
  provenance: { evidenceFile: path.basename(evidencePath), candidateFile: path.basename(candidatesPath), mappingsFile: path.basename(mappingsPath) },
  counts,
  mappingErrors,
  queue,
};
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'qualification-queue.json'), JSON.stringify(report, null, 2) + '\n');
const columns = ['evidenceId','query','siteUrl','startDate','endDate','clicks','impressions','ctrPercent','averagePosition','action','targetType','targetUrl','candidateId','reviewedBy','reviewedAt','rationale','reasons','publishAllowed'];
const csvCell = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
const csv = [columns.join(','), ...queue.map((item) => {
  const flat = { ...item, startDate: item.dateRange?.startDate, endDate: item.dateRange?.endDate, ...item.metrics,
    targetType: item.target?.type, targetUrl: item.target?.url, candidateId: item.target?.candidateId,
    reviewedBy: item.target?.reviewedBy, reviewedAt: item.target?.reviewedAt, rationale: item.target?.rationale,
    reasons: item.reasons.join(';') };
  return columns.map((column) => csvCell(flat[column])).join(',');
})].join('\n') + '\n';
await writeFile(path.join(outputDir, 'qualification-queue.csv'), csv);
console.log(JSON.stringify({ ...counts, outputDir }, null, 2));
