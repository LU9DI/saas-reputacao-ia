#!/usr/bin/env node
/**
 * Build a reviewable SEO/AEO opportunity backlog. Never creates public pages.
 *
 * Usage:
 *   node scripts/build-seo-aeo-opportunities.mjs
 *   node scripts/build-seo-aeo-opportunities.mjs --out /tmp/seo-opportunities
 *
 * Demand, product fit, evidence and editorial approval are deliberately external
 * inputs. Missing evidence keeps an opportunity blocked from publication.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const taxonomyPath = path.join(root, 'data/seo-aeo-opportunity-taxonomy.json');
const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outputDir = outFlag >= 0 ? path.resolve(args[outFlag + 1]) : path.join(root, 'reports/seo-aeo-opportunities');
const taxonomy = JSON.parse(await readFile(taxonomyPath, 'utf8'));
// Compact taxonomy entries may be [id, label] tuples to keep source reviewable.
taxonomy.sectors = taxonomy.sectors.map((row) => Array.isArray(row) ? { id: row[0], label: row[1] } : row);
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const csvCell = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
check(Array.isArray(taxonomy.sectors) && taxonomy.sectors.length >= 100, 'Expected at least 100 sector definitions.');
check(Array.isArray(taxonomy.intents) && taxonomy.intents.length >= 10, 'Expected at least 10 intent definitions.');
check(Array.isArray(taxonomy.formats) && taxonomy.formats.length >= 4, 'Expected at least 4 content formats.');
for (const [name, rows] of Object.entries({ sectors: taxonomy.sectors, intents: taxonomy.intents, formats: taxonomy.formats })) {
  const ids = rows.map((row) => row.id);
  check(ids.every(Boolean), `${name}: every row needs an id.`);
  check(new Set(ids).size === ids.length, `${name}: duplicate IDs detected.`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

const candidates = [];
const seenSlugs = new Set();
const seenQueries = new Map();
const sectorDuplicates = new Map();
for (const sector of taxonomy.sectors) {
  const normalizedLabel = normalize(sector.label).trim();
  const sectorOwners = sectorDuplicates.get(normalizedLabel) ?? [];
  sectorOwners.push(sector.id);
  sectorDuplicates.set(normalizedLabel, sectorOwners);
  for (const intent of taxonomy.intents) {
    for (const format of taxonomy.formats) {
      const query = intent.query.replaceAll('{sector}', sector.label);
      const slug = `${sector.id}-${intent.id}-${format.id}`;
      const normalizedQuery = normalize(query).replace(/[^a-z0-9]+/g, ' ').trim();
      const queryOwners = seenQueries.get(normalizedQuery) ?? [];
      queryOwners.push(slug);
      seenQueries.set(normalizedQuery, queryOwners);
      const duplicateSlug = seenSlugs.has(slug);
      seenSlugs.add(slug);
      const flags = [];
      if (duplicateSlug) flags.push('duplicate-slug');
      if (sectorOwners.length > 1) flags.push('duplicate-sector-label');
      if (intent.productFit === 'conditional') flags.push('verify-product-fit');
      if (intent.productFit === 'adjacent') flags.push('verify-commercial-relevance');
      if (format.id === 'benchmark') flags.push('dataset-required');
      if (format.id === 'tool') flags.push('working-tool-required');
      candidates.push({
        id: slug,
        sectorId: sector.id,
        sector: sector.label,
        intentId: intent.id,
        intent: intent.label,
        formatId: format.id,
        format: format.label,
        family: intent.family,
        queryHypothesis: query,
        slug,
        suggestedPath: `/seo-candidatos/${slug}`,
        productFit: intent.productFit,
        demandEvidence: null,
        demandEvidenceSource: null,
        distinctiveEvidence: [],
        verifiedProductCapability: null,
        editorialReviewer: null,
        internalLinksReviewed: false,
        canonicalOwner: 'filtraai.com (provisional; assess other properties first)',
        status: 'candidate-only',
        publishAllowed: false,
        flags,
      });
    }
  }
}

const duplicateQueries = [...seenQueries.entries()].filter(([, owners]) => {
  const distinctIntents = new Set(owners.map((slug) => slug.split('-').slice(0, -2).join('-')));
  return distinctIntents.size > 1;
});
for (const [, owners] of duplicateQueries) {
  for (const candidate of candidates) {
    if (owners.includes(candidate.slug)) candidate.flags.push('duplicate-query-hypothesis');
  }
}
const sectorsWithDuplicateLabels = [...sectorDuplicates.entries()].filter(([, ids]) => ids.length > 1);
const summary = {
  generatedAt: new Date().toISOString(),
  purpose: 'Research backlog only. No route, page, sitemap entry or indexing directive is created.',
  counts: {
    sectors: taxonomy.sectors.length,
    intents: taxonomy.intents.length,
    formats: taxonomy.formats.length,
    candidates: candidates.length,
    uniqueSlugs: seenSlugs.size,
    duplicateQueryGroups: duplicateQueries.length,
    duplicateSectorLabelGroups: sectorsWithDuplicateLabels.length,
    publishAllowed: candidates.filter((candidate) => candidate.publishAllowed).length,
  },
  gate: {
    demandEvidenceRequired: taxonomy.gating.requireDemandEvidence,
    verifiedProductFitRequired: taxonomy.gating.requireVerifiedProductFit,
    editorialReviewRequired: taxonomy.gating.requireEditorialReview,
    internalLinksRequired: taxonomy.gating.requireInternalLinks,
    minimumDistinctiveEvidenceFields: taxonomy.gating.minimumDistinctiveEvidenceFields,
  },
  duplicateSectorLabelGroups: sectorsWithDuplicateLabels.map(([label, ids]) => ({ label, ids })),
  duplicateQueryGroups: duplicateQueries.map(([query, slugs]) => ({ query, slugs })),
  candidates,
};
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'opportunities.json'), JSON.stringify(summary, null, 2) + '\n');
const columns = ['id','sectorId','sector','intentId','intent','formatId','format','family','queryHypothesis','slug','productFit','demandEvidence','demandEvidenceSource','distinctiveEvidence','verifiedProductCapability','editorialReviewer','internalLinksReviewed','status','publishAllowed','flags'];
const csv = [columns.join(','), ...candidates.map((item) => columns.map((column) => csvCell(Array.isArray(item[column]) ? item[column].join('; ') : item[column])).join(','))].join('\n') + '\n';
await writeFile(path.join(outputDir, 'opportunities.csv'), csv);
console.log(JSON.stringify({ ...summary.counts, outputDir, publishedPagesCreated: 0 }, null, 2));
if (summary.counts.uniqueSlugs !== summary.counts.candidates) process.exitCode = 1;
