export type FailoverOrigin = 'primary' | 'fallback';

export type SpendEvent = {
  budgetAmount?: number;
  currentSpend?: number;
  thresholdPercent?: number;
  teamId?: string;
  eventId?: string;
  source?: string;
};

export const SPEND_ALERT_THRESHOLDS = [50, 75, 100] as const;

export function classifySpendEvent(payload: SpendEvent): 'observe' | 'failover' | 'ignore' {
  const threshold = Number(payload.thresholdPercent);
  if (!Number.isFinite(threshold)) return 'ignore';
  if (threshold === 50 || threshold === 75) return 'observe';
  if (threshold >= 90 || threshold === 100) return 'failover';
  return 'ignore';
}

export function shouldFailoverForStatus(status: number): boolean {
  return [502, 503, 504, 521, 522, 523, 524].includes(status);
}

export function shouldRespectCooldown(changedAt: number | null, now: number, cooldownMs: number): boolean {
  return changedAt != null && now - changedAt < cooldownMs;
}
