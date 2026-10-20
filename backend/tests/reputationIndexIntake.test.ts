import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  prepareAuthorizedResearchBatch,
  type ReputationCompanyConsent,
  type ReputationIntakeRecord,
  type ReputationSourceApproval,
} from '../services/reputationIndexIntake.js';

const now = new Date('2026-10-20T12:00:00.000Z');
const record: ReputationIntakeRecord = {
  companyKey: 'pseudonymous-company-1',
  sourceId: 'authorized-source',
  sourceReviewId: 'review-1',
  rating: 5,
  createdAt: '2026-10-10T12:00:00.000Z',
  sector: 'Restaurantes',
  region: 'SP',
  hasResponse: true,
};

const approval: ReputationSourceApproval = {
  sourceId: 'authorized-source',
  authorizationId: 'approval-2026-01',
  sourceType: 'customer-opt-in',
  approvedForPublicResearch: true,
  termsReviewedAt: '2026-10-01T12:00:00.000Z',
  reviewedBy: 'privacy-review',
};

const consent: ReputationCompanyConsent = {
  companyKey: 'pseudonymous-company-1',
  consentRecordId: 'consent-2026-01',
  consentVersion: 'research-opt-in-v1',
  grantedAt: '2026-10-02T12:00:00.000Z',
};

describe('prepareAuthorizedResearchBatch', () => {
  it('admits records only when source approval and company consent are present', () => {
    const result = prepareAuthorizedResearchBatch([record], [approval], [consent], now);
    assert.equal(result.eligible.length, 1);
    assert.equal(result.eligible[0].sourceAuthorized, true);
    assert.equal(result.eligible[0].companyConsent, true);
    assert.deepEqual(result.audit.reasons, {});
  });

  it('fails closed when source approval is missing or not approved', () => {
    const missing = prepareAuthorizedResearchBatch([record], [], [consent], now);
    assert.equal(missing.eligible.length, 0);
    assert.equal(missing.audit.reasons.source_not_approved, 1);

    const pending = prepareAuthorizedResearchBatch(
      [record], [{ ...approval, approvedForPublicResearch: false }], [consent], now,
    );
    assert.equal(pending.eligible.length, 0);
    assert.equal(pending.audit.reasons.source_not_approved, 1);
  });

  it('excludes revoked consent and expired source approvals', () => {
    const revoked: ReputationCompanyConsent = {
      ...consent,
      revokedAt: '2026-10-19T00:00:00.000Z',
    };
    const revokedResult = prepareAuthorizedResearchBatch([record], [approval], [revoked], now);
    assert.equal(revokedResult.eligible.length, 0);
    assert.equal(revokedResult.audit.reasons.company_consent_revoked, 1);

    const expired: ReputationSourceApproval = {
      ...approval,
      expiresAt: '2026-10-19T00:00:00.000Z',
    };
    const expiredResult = prepareAuthorizedResearchBatch([record], [expired], [consent], now);
    assert.equal(expiredResult.eligible.length, 0);
    assert.equal(expiredResult.audit.reasons.source_approval_expired, 1);
  });

  it('rejects future-dated approval and malformed consent timestamps', () => {
    const futureApproval = {
      ...approval,
      termsReviewedAt: '2026-10-21T00:00:00.000Z',
    };
    const result = prepareAuthorizedResearchBatch(
      [record], [futureApproval], [{ ...consent, grantedAt: 'not-a-date' }], now,
    );
    assert.equal(result.eligible.length, 0);
    assert.equal(result.audit.reasons.source_not_approved, 1);
  });

  it('does not expose raw company keys in audit output', () => {
    const result = prepareAuthorizedResearchBatch([record], [approval], [consent], now);
    assert.equal(JSON.stringify(result.audit).includes('pseudonymous-company-1'), false);
  });
});
