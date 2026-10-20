export const PUBLIC_INDEX_MIN_BUSINESSES = 10;
export const PUBLIC_INDEX_MIN_REVIEWS = 100;

export const PUBLIC_INDEX_SECTORS = [
  'restaurantes',
  'hoteis',
  'clinicas',
  'franquias',
  'varejo',
  'servicos',
] as const;

export const PUBLIC_INDEX_REGIONS = [
  'brasil',
  'norte',
  'nordeste',
  'centro-oeste',
  'sudeste',
  'sul',
] as const;

export type ReputationIndexInput = {
  reviewId: string;
  businessId: string;
  sector: string;
  region?: string;
  rating: number;
  observedAt: string;
  publicationConsent: boolean;
  publicationConsentEvidenceId?: string;
  publicationConsentVersion?: string;
  publicationConsentAt?: string;
  publicationConsentScope?: string;
  isTest?: boolean;
};

type NormalizedReview = {
  businessId: string;
  sector: string;
  region: string;
  period: string;
  rating: 1 | 2 | 3 | 4 | 5;
};

export type PublicReputationIndicator = {
  sector: string;
  region: string;
  period: string;
  businessCount: number;
  reviewCount: number;
  averageRating: number;
  positiveReviewPercent: number;
  ratingDistribution: Array<{ rating: 1 | 2 | 3 | 4 | 5; count: number }>;
  methodologyVersion: '1.0';
};

function normalizedKey(value: string): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function canonicalSector(value: string): string | null {
  const key = normalizedKey(value);
  const aliases: Record<string, string> = {
    restaurante: 'restaurantes',
    restaurantes: 'restaurantes',
    hotel: 'hoteis',
    hoteis: 'hoteis',
    clinica: 'clinicas',
    clinicas: 'clinicas',
    franquia: 'franquias',
    franquias: 'franquias',
    varejo: 'varejo',
    servico: 'servicos',
    servicos: 'servicos',
  };
  const sector = aliases[key];
  return sector && (PUBLIC_INDEX_SECTORS as readonly string[]).includes(sector) ? sector : null;
}

function canonicalRegion(value: string): string | null {
  const key = normalizedKey(value);
  const aliases: Record<string, string> = {
    brasil: 'brasil',
    norte: 'norte',
    nordeste: 'nordeste',
    'centro-oeste': 'centro-oeste',
    sudeste: 'sudeste',
    sul: 'sul',
  };
  const region = aliases[key];
  return region && (PUBLIC_INDEX_REGIONS as readonly string[]).includes(region) ? region : null;
}

function periodFromDate(value: string): string | null {
  const input = String(value || '').trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  const timestamp = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/i.exec(input);
  if (!dateOnly && !timestamp) return null;

  const match = dateOnly || timestamp;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() + 1 !== month ||
    calendarDate.getUTCDate() !== day
  ) return null;

  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 7);
}
/**
 * Pure, opt-in-only aggregation for a future public index.
 *
 * This function does not read the tenant database and must not be wired to
 * private tenant reviews without an explicit, documented publication consent
 * model. It intentionally returns aggregate indicators only.
 */
export function buildPublicReputationIndex(
  rows: ReputationIndexInput[],
  options: { minBusinesses?: number; minReviews?: number } = {},
): PublicReputationIndicator[] {
  // Callers may raise the privacy thresholds, but must never lower the published minimums.
  const minBusinesses = Math.max(PUBLIC_INDEX_MIN_BUSINESSES, Math.floor(options.minBusinesses ?? PUBLIC_INDEX_MIN_BUSINESSES));
  const minReviews = Math.max(PUBLIC_INDEX_MIN_REVIEWS, Math.floor(options.minReviews ?? PUBLIC_INDEX_MIN_REVIEWS));
  const uniqueReviews = new Map<string, NormalizedReview>();

  for (const row of rows) {
    if (
      !row ||
      row.publicationConsent !== true ||
      row.publicationConsentScope !== 'public_aggregate_index' ||
      !String(row.publicationConsentEvidenceId || '').trim() ||
      !String(row.publicationConsentVersion || '').trim() ||
      !periodFromDate(String(row.publicationConsentAt || '')) ||
      row.isTest === true
    ) continue;
    const reviewId = String(row.reviewId || '').trim().slice(0, 160);
    const businessId = String(row.businessId || '').trim().slice(0, 160);
    const rating = Number(row.rating);
    const period = periodFromDate(String(row.observedAt || ''));
    const sector = canonicalSector(row.sector);
    const region = canonicalRegion(row.region || '');
    if (!reviewId || !businessId || !period || !sector || !region || !Number.isInteger(rating) || rating < 1 || rating > 5) continue;

    // Only the first valid occurrence is counted, preventing duplicate IDs
    // from inflating the public sample.
    const dedupeKey = JSON.stringify([businessId, reviewId]);
    if (uniqueReviews.has(dedupeKey)) continue;
    uniqueReviews.set(dedupeKey, {
      businessId,
      sector,
      region,
      period,
      rating: rating as 1 | 2 | 3 | 4 | 5,
    });
  }

  const groups = new Map<string, NormalizedReview[]>();
  for (const review of uniqueReviews.values()) {
    const key = [review.sector, review.region, review.period].join('|');
    const group = groups.get(key) || [];
    group.push(review);
    groups.set(key, group);
  }

  const output: PublicReputationIndicator[] = [];
  for (const reviews of groups.values()) {
    const businessIds = new Set(reviews.map((review) => review.businessId));
    if (businessIds.size < minBusinesses || reviews.length < minReviews) continue;

    const ratingDistribution = ([1, 2, 3, 4, 5] as const).map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
    }));
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const positiveCount = reviews.filter((review) => review.rating >= 4).length;
    const first = reviews[0];

    output.push({
      sector: first.sector,
      region: first.region,
      period: first.period,
      businessCount: businessIds.size,
      reviewCount: reviews.length,
      averageRating: Number(averageRating.toFixed(2)),
      positiveReviewPercent: Number(((positiveCount / reviews.length) * 100).toFixed(1)),
      ratingDistribution,
      methodologyVersion: '1.0',
    });
  }

  return output.sort((a, b) =>
    a.period.localeCompare(b.period) || a.sector.localeCompare(b.sector) || a.region.localeCompare(b.region),
  );
}
