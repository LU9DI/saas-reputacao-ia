export type ReputationResearchReview = {
  /** Internal pseudonymous company key; never returned in public aggregates. */
  companyKey: string;
  /** Stable source identifier and source-specific review identifier for deduplication. */
  sourceId: string;
  sourceReviewId: string;
  rating: number;
  createdAt: string;
  sector?: string | null;
  region?: string | null;
  /** Set only after documented source permissions have been reviewed. */
  sourceAuthorized: boolean;
  /** Set only when the required research consent/authorization is recorded. */
  companyConsent: boolean;
  isTest?: boolean;
  hasResponse?: boolean;
};

export type ReputationAggregate = {
  label: string;
  companyCount: number;
  reviewCount: number;
  averageRating: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  responseRate: number | null;
  periodStart: string;
  periodEnd: string;
};

export type ReputationAggregationOptions = {
  windowStart: string;
  windowEnd: string;
  minCompanies?: number;
  minReviews?: number;
};

export type ReputationAggregationResult = {
  /** Null means the overall sample did not meet both publication thresholds. */
  overall: ReputationAggregate | null;
  bySector: ReputationAggregate[];
  byRegion: ReputationAggregate[];
  /** Internal quality diagnostics; do not expose this object directly in public APIs. */
  quality: {
    inputRecords: number;
    eligibleRecords: number;
    excludedRecords: number;
    duplicateRecords: number;
  };
};

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isEligible(
  row: ReputationResearchReview,
  start: number,
  end: number,
): boolean {
  const date = Date.parse(row.createdAt);
  return Boolean(
    row.sourceAuthorized &&
      row.companyConsent &&
      !row.isTest &&
      row.companyKey.trim() &&
      row.sourceId.trim() &&
      row.sourceReviewId.trim() &&
      Number.isInteger(row.rating) &&
      row.rating >= 1 &&
      row.rating <= 5 &&
      validDate(row.createdAt) &&
      date >= start &&
      date <= end,
  );
}

function aggregate(
  label: string,
  rows: ReputationResearchReview[],
  minCompanies: number,
  minReviews: number,
): ReputationAggregate | null {
  const companyCount = new Set(rows.map((row) => row.companyKey)).size;
  if (companyCount < minCompanies || rows.length < minReviews) return null;

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  };
  let totalRating = 0;
  let responseKnown = 0;
  let responded = 0;
  const dates: number[] = [];

  for (const row of rows) {
    distribution[row.rating as 1 | 2 | 3 | 4 | 5] += 1;
    totalRating += row.rating;
    dates.push(Date.parse(row.createdAt));
    if (typeof row.hasResponse === 'boolean') {
      responseKnown += 1;
      if (row.hasResponse) responded += 1;
    }
  }

  return {
    label,
    companyCount,
    reviewCount: rows.length,
    averageRating: round(totalRating / rows.length),
    ratingDistribution: distribution,
    responseRate: responseKnown ? round((responded / responseKnown) * 100, 1) : null,
    periodStart: new Date(Math.min(...dates)).toISOString().slice(0, 10),
    periodEnd: new Date(Math.max(...dates)).toISOString().slice(0, 10),
  };
}

/**
 * Builds only publication-ready aggregates. Raw review text and individual company
 * identifiers are intentionally absent from both input needs and output shape.
 * Legal/privacy approval remains an upstream requirement; these booleans are
 * technical fail-closed gates, not a substitute for that approval.
 */
export function aggregateReputationIndex(
  records: ReputationResearchReview[],
  options: ReputationAggregationOptions,
): ReputationAggregationResult {
  if (!validDate(options.windowStart) || !validDate(options.windowEnd)) {
    throw new Error('A janela de pesquisa deve usar datas ISO válidas.');
  }

  const start = Date.parse(options.windowStart);
  const end = Date.parse(options.windowEnd);
  if (start > end) throw new Error('windowStart deve ser anterior ou igual a windowEnd.');

  const minCompanies = options.minCompanies ?? 30;
  const minReviews = options.minReviews ?? 500;
  if (!Number.isInteger(minCompanies) || minCompanies < 1 ||
      !Number.isInteger(minReviews) || minReviews < 1) {
    throw new Error('Os limites mínimos de publicação devem ser inteiros positivos.');
  }

  const seen = new Set<string>();
  const eligible: ReputationResearchReview[] = [];
  let excludedRecords = 0;
  let duplicateRecords = 0;

  for (const row of records) {
    if (!isEligible(row, start, end)) {
      excludedRecords += 1;
      continue;
    }
    const key = `${row.sourceId.trim()}:${row.sourceReviewId.trim()}`;
    if (seen.has(key)) {
      duplicateRecords += 1;
      continue;
    }
    seen.add(key);
    eligible.push(row);
  }

  const bySector = new Map<string, ReputationResearchReview[]>();
  const byRegion = new Map<string, ReputationResearchReview[]>();
  for (const row of eligible) {
    const sector = row.sector?.trim();
    const region = row.region?.trim();
    if (sector) bySector.set(sector, [...(bySector.get(sector) ?? []), row]);
    if (region) byRegion.set(region, [...(byRegion.get(region) ?? []), row]);
  }

  const overall = aggregate('Brasil', eligible, minCompanies, minReviews);
  const sectorAggregates = [...bySector.entries()]
    .map(([label, rows]) => aggregate(label, rows, minCompanies, minReviews))
    .filter((item): item is ReputationAggregate => item !== null)
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  const regionAggregates = [...byRegion.entries()]
    .map(([label, rows]) => aggregate(label, rows, minCompanies, minReviews))
    .filter((item): item is ReputationAggregate => item !== null)
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  return {
    overall,
    bySector: sectorAggregates,
    byRegion: regionAggregates,
    quality: {
      inputRecords: records.length,
      eligibleRecords: eligible.length,
      excludedRecords,
      duplicateRecords,
    },
  };
}
