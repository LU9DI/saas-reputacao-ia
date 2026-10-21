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
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match || Number.isNaN(Date.parse(value))) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 ||
      calendar.getUTCDate() !== day || Number(hourText) > 23 ||
      Number(minuteText) > 59 || Number(secondText) > 59) return false;
  if (zone !== 'Z') {
    const offsetHour = Number(offsetHourText), offsetMinute = Number(offsetMinuteText);
    if (offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0)) return false;
  }
  return true;
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
  const approvals = new Map(sourceApprovals.map((item) => [item.sourceId.trim(), item]));
  const consents = new Map(companyConsents.map((item) => [item.companyKey.trim(), item]));
  const duplicateSourceIds = new Set<string>();
  const seenSourceIds = new Set<string>();
  for (const item of sourceApprovals) {
    const key = item.sourceId.trim();
    if (seenSourceIds.has(key)) duplicateSourceIds.add(key);
    seenSourceIds.add(key);
  }
  const duplicateCompanyKeys = new Set<string>();
  const seenCompanyKeys = new Set<string>();
  for (const item of companyConsents) {
    const key = item.companyKey.trim();
    if (seenCompanyKeys.has(key)) duplicateCompanyKeys.add(key);
    seenCompanyKeys.add(key);
  }
  const eligible: ReputationResearchReview[] = [];
  const reasons: Record<string, number> = {};

  const exclude = (reason: string) => {
    reasons[reason] = (reasons[reason] ?? 0) + 1;
  };

  for (const record of records) {
    if (!record.sourceId.trim() || !record.sourceReviewId.trim() || !record.companyKey.trim()) {
      exclude('record_identifier_missing');
      continue;
    }
    if (duplicateSourceIds.has(record.sourceId.trim())) {
      exclude('source_approval_ambiguous');
      continue;
    }
    const approval = approvals.get(record.sourceId.trim());
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

    if (duplicateCompanyKeys.has(record.companyKey.trim())) {
      exclude('company_consent_ambiguous');
      continue;
    }
    const consent = consents.get(record.companyKey.trim());
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
