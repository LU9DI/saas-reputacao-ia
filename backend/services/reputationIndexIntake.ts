import type { ReputationResearchReview } from './reputationIndexAggregation.js';

export type ReputationSourceApproval = {
  sourceId: string;
  authorizationId: string;
  sourceType: 'customer-opt-in' | 'official-api' | 'licensed-dataset';
  approvedForPublicResearch: boolean;
  termsReviewedAt: string;
  reviewedBy: string;
  expiresAt?: string | null;
};

export type ReputationCompanyConsent = {
  companyKey: string;
  consentRecordId: string;
  consentVersion: string;
  grantedAt: string;
  revokedAt?: string | null;
};

export type ReputationIntakeRecord = Omit<
  ReputationResearchReview,
  'sourceAuthorized' | 'companyConsent'
>;

export type ReputationIntakeResult = {
  eligible: ReputationResearchReview[];
  audit: {
    inputRecords: number;
    eligibleRecords: number;
    excludedRecords: number;
    reasons: Record<string, number>;
  };
};

function validTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

/**
 * Applies documented source approvals and revocable company opt-in records
 * before records reach the aggregation function. This is a technical control,
 * not a legal determination; approval must be granted by the responsible team.
 */
export function prepareAuthorizedResearchBatch(
  records: ReputationIntakeRecord[],
  sourceApprovals: ReputationSourceApproval[],
  companyConsents: ReputationCompanyConsent[],
  now = new Date(),
): ReputationIntakeResult {
  const approvals = new Map(sourceApprovals.map((item) => [item.sourceId, item]));
  const consents = new Map(companyConsents.map((item) => [item.companyKey, item]));
  const duplicateSourceIds = new Set(sourceApprovals
    .filter((item, index) => sourceApprovals.findIndex((candidate) => candidate.sourceId === item.sourceId) !== index)
    .map((item) => item.sourceId));
  const duplicateCompanyKeys = new Set(companyConsents
    .filter((item, index) => companyConsents.findIndex((candidate) => candidate.companyKey === item.companyKey) !== index)
    .map((item) => item.companyKey));
  const eligible: ReputationResearchReview[] = [];
  const reasons: Record<string, number> = {};

  const exclude = (reason: string) => {
    reasons[reason] = (reasons[reason] ?? 0) + 1;
  };

  for (const record of records) {
    if (duplicateSourceIds.has(record.sourceId)) {
      exclude('source_approval_ambiguous');
      continue;
    }
    const approval = approvals.get(record.sourceId);
    if (!approval || !approval.approvedForPublicResearch ||
        !approval.authorizationId.trim() || !approval.reviewedBy.trim() ||
        !validTimestamp(approval.termsReviewedAt) ||
        Date.parse(approval.termsReviewedAt) > now.getTime()) {
      exclude('source_not_approved');
      continue;
    }
    if (approval.expiresAt && (!validTimestamp(approval.expiresAt) ||
        Date.parse(approval.expiresAt) <= now.getTime())) {
      exclude('source_approval_expired');
      continue;
    }

    if (duplicateCompanyKeys.has(record.companyKey)) {
      exclude('company_consent_ambiguous');
      continue;
    }
    const consent = consents.get(record.companyKey);
    if (!consent || !consent.consentRecordId.trim() || !consent.consentVersion.trim() ||
        !validTimestamp(consent.grantedAt) || Date.parse(consent.grantedAt) > now.getTime()) {
      exclude('company_consent_missing_or_invalid');
      continue;
    }
    if (consent.revokedAt && (!validTimestamp(consent.revokedAt) ||
        Date.parse(consent.revokedAt) <= now.getTime())) {
      exclude('company_consent_revoked');
      continue;
    }

    eligible.push({ ...record, sourceAuthorized: true, companyConsent: true });
  }

  return {
    eligible,
    audit: {
      inputRecords: records.length,
      eligibleRecords: eligible.length,
      excludedRecords: records.length - eligible.length,
      reasons,
    },
  };
}
