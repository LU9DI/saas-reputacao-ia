import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateReputationIndex,
  type ReputationResearchReview,
} from '../services/reputationIndexAggregation.js';

function review(overrides: Partial<ReputationResearchReview> = {}): ReputationResearchReview {
  return {
    companyKey: 'company-a',
    sourceId: 'authorized-provider',
    sourceReviewId: 'review-1',
    rating: 5,
    createdAt: '2026-10-10T12:00:00.000Z',
    sector: 'Restaurantes',
    region: 'SP',
    sourceAuthorized: true,
    companyConsent: true,
    hasResponse: true,
    ...overrides,
  };
}

describe('aggregateReputationIndex', () => {
  it('publishes only aggregates meeting thresholds and never returns company identifiers', () => {
    const records = [
      review(),
      review({ companyKey: 'company-b', sourceReviewId: 'review-2', rating: 3, hasResponse: false }),
      review({ companyKey: 'company-c', sourceReviewId: 'review-3', rating: 4, hasResponse: undefined }),
    ];
    const result = aggregateReputationIndex(records, {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
      minCompanies: 3,
      minReviews: 3,
    });

    assert.equal(result.overall?.companyCount, 3);
    assert.equal(result.overall?.reviewCount, 3);
    assert.equal(result.overall?.averageRating, 4);
    assert.deepEqual(result.overall?.ratingDistribution, { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 });
    assert.equal(result.overall?.responseRate, 50);
    assert.equal(result.bySector.length, 1);
    assert.equal(result.byRegion.length, 1);
    assert.equal(JSON.stringify(result).includes('company-a'), false);
    assert.equal(JSON.stringify(result).includes('review-1'), false);
  });

  it('fails closed for unauthorized, unconsented, test, invalid and out-of-window rows', () => {
    const records = [
      review(),
      review({ companyKey: 'company-b', sourceReviewId: 'no-source-auth', sourceAuthorized: false }),
      review({ companyKey: 'company-c', sourceReviewId: 'no-consent', companyConsent: false }),
      review({ companyKey: 'company-d', sourceReviewId: 'test', isTest: true }),
      review({ companyKey: 'company-e', sourceReviewId: 'bad-rating', rating: 6 }),
      review({ companyKey: 'company-f', sourceReviewId: 'old', createdAt: '2026-08-01' }),
    ];
    const result = aggregateReputationIndex(records, {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
      minCompanies: 1,
      minReviews: 1,
    });

    assert.equal(result.quality.inputRecords, 6);
    assert.equal(result.quality.eligibleRecords, 1);
    assert.equal(result.quality.excludedRecords, 5);
    assert.equal(result.overall?.reviewCount, 1);
  });

  it('fails closed for conflicting duplicates and preserves IDs from separate sources', () => {
    const records = [
      review(),
      review({ companyKey: 'company-b', sourceReviewId: 'review-1' }),
      review({ companyKey: 'company-b', sourceId: 'other-provider', sourceReviewId: 'review-1' }),
    ];
    const result = aggregateReputationIndex(records, {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
      minCompanies: 1,
      minReviews: 1,
    });

    assert.equal(result.quality.eligibleRecords, 1);
    assert.equal(result.quality.conflictingRecords, 2);
    assert.equal(result.quality.duplicateRecords, 0);
    assert.equal(result.overall?.reviewCount, 1);
  });

  it('drops every record when the same source review ID has conflicting data', () => {
    const result = aggregateReputationIndex([
      review({ companyKey: 'company-a', rating: 5 }),
      review({ companyKey: 'company-b', rating: 1 }),
      review({ companyKey: 'company-c', sourceId: 'other-provider', sourceReviewId: 'review-2', rating: 4 }),
    ], {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
      minCompanies: 1,
      minReviews: 1,
    });
    assert.equal(result.quality.eligibleRecords, 1);
    assert.equal(result.quality.conflictingRecords, 2);
    assert.equal(result.quality.excludedRecords, 2);
    assert.equal(result.overall?.reviewCount, 1);
    assert.equal(result.overall?.averageRating, 4);
  });

  it('deduplicates exact repeated records without counting them twice', () => {
    const result = aggregateReputationIndex([
      review(),
      review(),
    ], {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
      minCompanies: 1,
      minReviews: 1,
    });
    assert.equal(result.quality.eligibleRecords, 1);
    assert.equal(result.quality.duplicateRecords, 1);
    assert.equal(result.quality.conflictingRecords, 0);
  });

  it('withholds small samples by default and includes the full final calendar day', () => {
    const oneLateReview = review({ createdAt: '2026-10-31T23:59:59.999Z' });
    const defaultThresholds = aggregateReputationIndex([oneLateReview], {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
    });
    assert.equal(defaultThresholds.overall, null);
    assert.deepEqual(defaultThresholds.bySector, []);
    assert.deepEqual(defaultThresholds.byRegion, []);

    const lowThresholds = aggregateReputationIndex([oneLateReview], {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
      minCompanies: 1,
      minReviews: 1,
    });
    assert.equal(lowThresholds.quality.eligibleRecords, 1);
    assert.equal(lowThresholds.overall?.periodEnd, '2026-10-31');
  });

  it('rejects impossible calendar dates and malformed timestamps', () => {
    assert.throws(() => aggregateReputationIndex([], {
      windowStart: '2026-02-31',
      windowEnd: '2026-03-31',
    }), /ISO válidas/);
    const result = aggregateReputationIndex([
      review({ createdAt: '2026-10-10T12:00:00' }),
      review({ companyKey: 'company-b', sourceReviewId: 'review-2', createdAt: '2026-10-10T24:00:00Z' }),
      review({ companyKey: 'company-c', sourceReviewId: 'review-3', createdAt: '2026-10-10T12:60:00Z' }),
      review({ companyKey: 'company-d', sourceReviewId: 'review-4', createdAt: '2026-10-10T12:00:00+14:30' }),
    ], {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
      minCompanies: 1,
      minReviews: 1,
    });
    assert.equal(result.quality.eligibleRecords, 0);
  });

  it('does not collide when source identifiers contain separators', () => {
    const result = aggregateReputationIndex([
      review({ sourceId: 'provider:one', sourceReviewId: 'review' }),
      review({ sourceId: 'provider', sourceReviewId: 'one:review' }),
    ], {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
      minCompanies: 1,
      minReviews: 1,
    });
    assert.equal(result.quality.eligibleRecords, 2);
    assert.equal(result.quality.duplicateRecords, 0);
  });

  it('rejects invalid windows and invalid publication thresholds', () => {
    assert.throws(() => aggregateReputationIndex([], {
      windowStart: '2026-11-01',
      windowEnd: '2026-10-01',
    }), /windowStart/);
    assert.throws(() => aggregateReputationIndex([], {
      windowStart: '2026-10-01',
      windowEnd: '2026-10-31',
      minCompanies: 0,
    }), /limites mínimos/);
  });
});
