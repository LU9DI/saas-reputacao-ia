export const PUBLIC_INDEX_MIN_BUSINESSES = 10;
export const PUBLIC_INDEX_MIN_REVIEWS = 100;

export type ReputationIndexInput = {
  reviewId: string;
  businessId: string;
  sector: string;
  region?: string;
  rating: number;
  observedAt: string;
  publicationConsent: boolean;
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

function normalizedLabel(value: string, fallback: string): string {
  const normalized = String(value || '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
  return normalized || fallback;
}

function periodFromDate(value: string): string | null {
  const date = new Date(value);
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
  const minBusinesses = Math.max(2, Math.floor(options.minBusinesses ?? PUBLIC_INDEX_MIN_BUSINESSES));
  const minReviews = Math.max(10, Math.floor(options.minReviews ?? PUBLIC_INDEX_MIN_REVIEWS));
  const uniqueReviews = new Map<string, {
    businessId: string;
    sector: string;
    region: string;
    period: string;
    rating: 1 | 2 | 3 | 4 | 5;
  }>();

  for (const row of rows) {
    if (!row || row.publicationConsent !== true || row.isTest === true) continue;
    const reviewId = String(row.reviewId || '').trim().slice(0, 160);
    const businessId = String(row.businessId || '').trim().slice(0, 160);
    const rating = Number(row.rating);
    const period = periodFromDate(String(row.observedAt || ''));
    if (!reviewId || !businessId || !period || !Number.isInteger(rating) || rating < 1 || rating > 5) continue;

    // Only the first valid occurrence is counted, preventing duplicate IDs
    // from inflating the public sample.
    if (uniqueReviews.has(reviewId)) continue;
    uniqueReviews.set(reviewId, {
      businessId,
      sector: normalizedLabel(row.sector, 'não-classificado'),
      region: normalizedLabel(row.region || '', 'brasil'),
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
