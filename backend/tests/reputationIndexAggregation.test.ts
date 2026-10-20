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

  it('deduplicates reviews by source and source review identifier', () => {
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

    assert.equal(result.quality.eligibleRecords, 2);
    assert.equal(result.quality.duplicateRecords, 1);
    assert.equal(result.overall?.reviewCount, 2);
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
