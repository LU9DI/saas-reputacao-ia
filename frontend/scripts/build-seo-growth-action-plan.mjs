#!/usr/bin/env node
/**
 * Build a measurable SEO/AEO action queue from observed Search Console evidence
 * and the manually reviewed qualification queue. This is prioritization only:
 * it never invents a URL mapping, creates pages, or authorizes publication.
 *
 * Usage:
 *   node scripts/build-seo-growth-action-plan.mjs
 *   node scripts/build-seo-growth-action-plan.mjs --evidence path/demand-evidence.json --queue path/qualification-queue.json
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const evidencePath = path.resolve(arg('--evidence', path.join(root, 'reports/seo-aeo-opportunities/demand-evidence.json')));
const queuePath = path.resolve(arg('--queue', path.join(root, 'reports/seo-aeo-opportunities/qualification-queue.json')));
const outputDir = path.resolve(arg('--out', path.join(root, 'reports/seo-aeo-opportunities')));
const minImpressions = Number(arg('--min-impressions', '10'));
const lowCtrPercent = Number(arg('--low-ctr-percent', '2'));
if (!Number.isFinite(minImpressions) || minImpressions < 1) throw new Error('--min-impressions must be >= 1.');
if (!Number.isFinite(lowCtrPercent) || lowCtrPercent < 0 || lowCtrPercent > 100) throw new Error('--low-ctr-percent must be between 0 and 100.');

const [evidenceReport, qualificationReport] = await Promise.all([
  readFile(evidencePath, 'utf8').then(JSON.parse),
  readFile(queuePath, 'utf8').then(JSON.parse),
]);
const queueById = new Map((qualificationReport.queue ?? []).filter((item) => item.evidenceId).map((item) => [item.evidenceId, item]));
const actions = [];
const add = (evidence, type, priority, score, why, nextSteps, extras = {}) => {
  actions.push({
    actionId: `${evidence.evidenceId}-${type}`,
    priority,
    score,
    type,
    evidenceId: evidence.evidenceId,
    query: evidence.query,
    metrics: evidence.metrics ?? {},
    target: extras.target ?? null,
    evidenceSource: evidence.source ?? null,
    dateRange: evidence.dateRange ?? null,
    rationale: why,
    nextSteps,
    signals: extras.signals ?? [],
    status: 'review-required',
    publishAllowed: false,
  });
};
for (const evidence of evidenceReport.evidence ?? []) {
  const metrics = evidence.metrics ?? {};
  const impressions = Number(metrics.impressions ?? 0);
  const clicks = Number(metrics.clicks ?? 0);
  const ctr = Number(metrics.ctrPercent ?? (impressions ? clicks / impressions * 100 : 0));
  const position = metrics.averagePosition == null ? null : Number(metrics.averagePosition);
  const qualified = queueById.get(evidence.evidenceId);
  const commonSignals = [
    ...(impressions < minImpressions ? ['below-configured-impression-threshold'] : []),
    ...(!evidence.dateRange?.startDate || !evidence.dateRange?.endDate ? ['date-window-incomplete'] : []),
    ...(!evidence.siteUrl ? ['site-property-not-specified'] : []),
  ];

  if (qualified?.action === 'optimize-existing-page-review' && qualified.target?.url) {
    add(evidence, 'optimize-mapped-existing-page', 'P1', 100 + Math.min(impressions, 1000) / 100,
      'A human-reviewed mapping points to an existing URL; validate intent and the live page before editing.',
      ['Inspect the target page and current SERP for the query.', 'Improve title/H1 and opening answer only where they match the page intent.', 'Add specific proof, examples, and useful internal links.', 'Measure clicks, impressions, CTR, and position over a comparable period.'],
      { target: qualified.target, signals: commonSignals });
    continue;
  }
  if (qualified?.action === 'evaluate-new-candidate-review' && qualified.target?.candidateId) {
    add(evidence, 'review-new-page-candidate', 'P2', 70 + Math.min(impressions, 1000) / 100,
      'A human-reviewed mapping points to a candidate; this is an editorial review, not publication approval.',
      ['Confirm the product capability and distinct search intent.', 'Check existing URLs for overlap and cannibalization.', 'Require original evidence, a useful answer, sources, and a human reviewer.', 'Keep noindex/out of sitemap until all quality and technical gates pass.'],
      { target: qualified.target, signals: commonSignals });
    continue;
  }
  if (impressions >= minImpressions && position !== null && position >= 4 && position <= 20 && ctr < lowCtrPercent) {
    add(evidence, 'snippet-and-page-fit-review', 'P1', 90 + Math.min(impressions, 1000) / 100,
      'The query has observed impressions, a potentially reachable position, and CTR below the configured threshold; this is a review signal, not proof of a title problem.',
      ['Verify the query/page relationship in the Search Console Pages report before choosing a URL.', 'Compare title and description with actual search intent and competing snippets.', 'Make the result promise specific and truthful; do not add unsupported claims.', 'Annotate the change and compare CTR/clicks after a comparable measurement window.'],
      { signals: commonSignals });
  } else if (impressions > 0 && position !== null && position > 20) {
    add(evidence, 'relevance-and-authority-review', impressions >= minImpressions ? 'P1' : 'P2', 60 + Math.min(impressions, 1000) / 100,
      'The query is observed but average position is beyond 20; investigate relevance, page coverage, technical indexing, and internal links before creating another URL.',
      ['Find the actual ranking URL using a query-by-page Search Console export.', 'Inspect indexability, canonical, rendered content, and internal links.', 'Compare the page against search intent and add original examples or methodology.', 'Create a new page only if a distinct intent and non-overlapping purpose are established.'],
      { signals: commonSignals });
  } else if (impressions >= minImpressions && position !== null && position <= 10 && ctr < lowCtrPercent) {
    add(evidence, 'high-visibility-low-ctr-review', 'P1', 85 + Math.min(impressions, 1000) / 100,
      'A top-ten average position with low CTR warrants a query/page and SERP review; averages can hide device, country, and URL differences.',
      ['Break down the query by page, device, country, and date in Search Console.', 'Review the actual snippet and intent match.', 'Test one accurate title/description improvement at a time.', 'Track the same query/page dimensions before and after.'],
      { signals: commonSignals });
  } else {
    add(evidence, 'map-and-validate-query', impressions > 0 ? 'P2' : 'P3', 30 + Math.min(impressions, 1000) / 100,
      'No explicit human-reviewed destination is available, so the query must not be assigned to a URL by lexical similarity alone.',
      ['Export query-by-page data from Search Console for a fully specified date range.', 'Review language, intent, and the exact page currently receiving impressions.', 'Record a reviewed mapping with rationale, or keep the query unmapped.', 'Do not create or publish a page from this evidence alone.'],
      { signals: commonSignals });
  }
}

const priorityRank = { P1: 1, P2: 2, P3: 3 };
actions.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.score - a.score || a.query.localeCompare(b.query));
const counts = {
  evidenceItems: (evidenceReport.evidence ?? []).length,
  actions: actions.length,
  p1: actions.filter((item) => item.priority === 'P1').length,
  p2: actions.filter((item) => item.priority === 'P2').length,
  p3: actions.filter((item) => item.priority === 'P3').length,
  mappedExistingPageReviews: actions.filter((item) => item.type === 'optimize-mapped-existing-page').length,
  newCandidateReviews: actions.filter((item) => item.type === 'review-new-page-candidate').length,
  publishAllowed: 0,
};
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: 'Prioritized SEO/AEO execution queue based on observed query evidence and explicit reviewed mappings.',
  policy: { lexicalUrlAssignment: false, pageCreation: false, routeCreation: false, indexingEnabled: false, publishAllowed: false },
  thresholds: { minImpressions, lowCtrPercent },
  provenance: {
    evidenceFile: path.basename(evidencePath),
    qualificationFile: path.basename(queuePath),
    source: evidenceReport.provenance?.source ?? null,
    siteUrl: evidenceReport.provenance?.siteUrl ?? null,
    dateRange: evidenceReport.provenance?.dateRange ?? null,
  },
  counts,
  actions,
};
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'growth-action-plan.json'), JSON.stringify(report, null, 2) + '\n');
const columns = ['priority','score','type','evidenceId','query','clicks','impressions','ctrPercent','averagePosition','targetUrl','candidateId','rationale','nextSteps','signals','status','publishAllowed'];
const csvCell = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
const csv = [columns.join(','), ...actions.map((item) => {
  const flat = { ...item, clicks: item.metrics.clicks, impressions: item.metrics.impressions, ctrPercent: item.metrics.ctrPercent,
    averagePosition: item.metrics.averagePosition, targetUrl: item.target?.url, candidateId: item.target?.candidateId,
    nextSteps: item.nextSteps.join(' | '), signals: item.signals.join(';') };
  return columns.map((column) => csvCell(flat[column])).join(',');
})].join('\n') + '\n';
await writeFile(path.join(outputDir, 'growth-action-plan.csv'), csv);
console.log(JSON.stringify({ ...counts, outputDir, publicationAuthorized: false }, null, 2));
