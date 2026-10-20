import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPublicReputationIndex,
  PUBLIC_INDEX_MIN_BUSINESSES,
  PUBLIC_INDEX_MIN_REVIEWS,
  type ReputationIndexInput,
} from '../services/publicReputationIndex.js';

function makeRows(businessCount: number, reviewsPerBusiness: number): ReputationIndexInput[] {
  const rows: ReputationIndexInput[] = [];
  for (let business = 1; business <= businessCount; business += 1) {
    for (let review = 1; review <= reviewsPerBusiness; review += 1) {
      rows.push({
        reviewId: `review-${business}-${review}`,
        businessId: `business-${business}`,
        sector: 'Restaurantes',
        region: 'Sudeste',
        rating: review % 5 + 1,
        observedAt: '2026-09-15T12:00:00.000Z',
        publicationConsent: true,
        publicationConsentEvidenceId: `consent-${business}`,
        publicationConsentVersion: 'public-index-v1',
        publicationConsentAt: '2026-09-01T00:00:00.000Z',
        publicationConsentScope: 'public_aggregate_index',
      });
    }
  }
  return rows;
}

test('publishes no sector indicator below both privacy thresholds', () => {
  assert.equal(PUBLIC_INDEX_MIN_BUSINESSES, 10);
  assert.equal(PUBLIC_INDEX_MIN_REVIEWS, 100);
  assert.deepEqual(buildPublicReputationIndex(makeRows(9, 12)), []);
  assert.deepEqual(buildPublicReputationIndex(makeRows(10, 9)), []);
});

test('publishes aggregate metrics only when the sample meets thresholds', () => {
  const result = buildPublicReputationIndex(makeRows(10, 10));
  assert.equal(result.length, 1);
  assert.deepEqual(
    {
      sector: result[0].sector,
      region: result[0].region,
      period: result[0].period,
      businessCount: result[0].businessCount,
      reviewCount: result[0].reviewCount,
      averageRating: result[0].averageRating,
      positiveReviewPercent: result[0].positiveReviewPercent,
      methodologyVersion: result[0].methodologyVersion,
    },
    {
      sector: 'restaurantes',
      region: 'sudeste',
      period: '2026-09',
      businessCount: 10,
      reviewCount: 100,
      averageRating: 3,
      positiveReviewPercent: 40,
      methodologyVersion: '1.0',
    },
  );
  assert.deepEqual(result[0].ratingDistribution, [
    { rating: 1, count: 20 },
    { rating: 2, count: 20 },
    { rating: 3, count: 20 },
    { rating: 4, count: 20 },
    { rating: 5, count: 20 },
  ]);
  assert.equal(JSON.stringify(result).includes('business-1'), false);
  assert.equal(JSON.stringify(result).includes('review-1-1'), false);
});

test('excludes records without explicit publication consent and test data', () => {
  const rows = makeRows(10, 10).map((row, index) => ({
    ...row,
    publicationConsent: index < 80,
    isTest: index >= 80,
  }));
  assert.deepEqual(buildPublicReputationIndex(rows), []);
});

test('deduplicates review IDs per business and ignores invalid rows', () => {
  const rows = makeRows(10, 10);
  rows.push({ ...rows[0], rating: 1 });
  rows.push({ ...rows[1], rating: 9 });
  rows.push({ ...rows[2], observedAt: 'not-a-date' });
  const result = buildPublicReputationIndex(rows);
  assert.equal(result.length, 1);
  assert.equal(result[0].reviewCount, 100);
});

test('keeps sector, region and month as separate comparison cohorts', () => {
  const rows = makeRows(10, 10);
  const anotherMonth = makeRows(10, 10).map((row) => ({
    ...row,
    reviewId: `oct-${row.reviewId}`,
    observedAt: '2026-10-15T12:00:00.000Z',
  }));
  assert.equal(buildPublicReputationIndex([...rows, ...anotherMonth]).length, 2);
});

test('normalizes known sector aliases and rejects uncontrolled micro-segments', () => {
  const known = makeRows(10, 10).map((row) => ({ ...row, sector: 'Clínica', region: 'Sudeste' }));
  const unknown = makeRows(10, 10).map((row) => ({ ...row, sector: 'Clínica do bairro X', region: 'São Paulo capital' }));
  const result = buildPublicReputationIndex(known);
  assert.equal(result.length, 1);
  assert.equal(result[0].sector, 'clinicas');
  assert.deepEqual(buildPublicReputationIndex(unknown), []);
});

test('does not treat a consent boolean alone as publication authorization', () => {
  const rows = makeRows(10, 10).map(({ publicationConsentEvidenceId, publicationConsentVersion, publicationConsentAt, publicationConsentScope, ...row }) => row);
  assert.deepEqual(buildPublicReputationIndex(rows), []);
});

test('does not allow callers to lower the minimum privacy thresholds', () => {
  const rows = makeRows(9, 12);
  assert.deepEqual(
    buildPublicReputationIndex(rows, { minBusinesses: 2, minReviews: 10 }),
    [],
  );
  assert.deepEqual(
    buildPublicReputationIndex(makeRows(10, 9), { minBusinesses: 2, minReviews: 10 }),
    [],
  );
  assert.equal(
    buildPublicReputationIndex(makeRows(10, 10), { minBusinesses: 50, minReviews: 500 }).length,
    0,
  );
});

test('rejects ambiguous dates and impossible calendar dates', () => {
  const ambiguous = makeRows(10, 10).map((row) => ({ ...row, observedAt: '1' }));
  const impossible = makeRows(10, 10).map((row) => ({ ...row, observedAt: '2026-02-30T12:00:00.000Z' }));
  const invalidConsentDate = makeRows(10, 10).map((row) => ({
    ...row,
    publicationConsentAt: '2026-02-30',
  }));
  assert.deepEqual(buildPublicReputationIndex(ambiguous), []);
  assert.deepEqual(buildPublicReputationIndex(impossible), []);
  assert.deepEqual(buildPublicReputationIndex(invalidConsentDate), []);
});

test('deduplication keys do not collide when identifiers contain separators', () => {
  const rows = makeRows(10, 10);
  rows[0] = { ...rows[0], businessId: 'a:b', reviewId: 'c' };
  rows[1] = { ...rows[1], businessId: 'a', reviewId: 'b:c' };
  const result = buildPublicReputationIndex(rows);
  assert.equal(result.length, 1);
  assert.equal(result[0].reviewCount, 100);
});

test('normalizes timestamp offsets to UTC before assigning the monthly cohort', () => {
  const rows = makeRows(10, 10).map((row) => ({
    ...row,
    observedAt: '2026-10-01T00:30:00+03:00',
  }));
  const result = buildPublicReputationIndex(rows);
  assert.equal(result.length, 1);
  assert.equal(result[0].period, '2026-09');
});
