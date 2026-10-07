import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { getDb } from '../lib/db.js';

export type DotDecisionApprovalStatus = 'not_required' | 'awaiting_approval' | 'approved' | 'denied';
export type DotActionStatus = 'proposed' | 'awaiting_approval' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'skipped';
export type DotOutcomeStatus = 'pending' | 'observed' | 'improved' | 'unchanged' | 'regressed' | 'inconclusive';

export interface DotDecision {
  id: string;
  empresaId: string;
  planId: string | null;
  signalId: string | null;
  hypothesisId: string | null;
  decisionType: string;
  decision: string;
  rationaleSummary: string;
  confidenceScore: number;
  evidenceStepIds: string[];
  approvalRequired: boolean;
  approvalStatus: DotDecisionApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  actionId: string | null;
  outcomeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DotAction {
  id: string;
  empresaId: string;
  planId: string | null;
  actionType: string;
  targetKey: string;
  idempotencyKey: string;
  status: DotActionStatus;
  requestedBy: string | null;
  approvedBy: string | null;
  executedAt: string | null;
  resultSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DotOutcome {
  id: string;
  empresaId: string;
  planId: string | null;
  actionId: string | null;
  metricKey: string;
  baselineValue: number | null;
  observedValue: number | null;
  deltaValue: number | null;
  evaluationWindowStart: string | null;
  evaluationWindowEnd: string | null;
  status: DotOutcomeStatus;
  source: string;
  createdAt: string;
}

let schemaPromise: Promise<void> | null = null;

export function ensureDotLedgerSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getDb();
      await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_decisions (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        plan_id TEXT,
        signal_id TEXT,
        hypothesis_id TEXT,
        decision_type TEXT NOT NULL,
        decision TEXT NOT NULL,
        rationale_summary TEXT NOT NULL,
        confidence_score REAL NOT NULL DEFAULT 0,
        evidence_step_ids_json TEXT NOT NULL DEFAULT '[]',
        approval_required INTEGER NOT NULL DEFAULT 0,
        approval_status TEXT NOT NULL DEFAULT 'not_required',
        approved_by TEXT,
        approved_at TEXT,
        action_id TEXT,
        outcome_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_decisions_tenant_time ON dot_agent_decisions(empresa_id, created_at)');
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_decisions_plan ON dot_agent_decisions(empresa_id, plan_id, created_at)');

      await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_actions (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        plan_id TEXT,
        action_type TEXT NOT NULL,
        target_key TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        status TEXT NOT NULL,
        requested_by TEXT,
        approved_by TEXT,
        executed_at TEXT,
        result_summary TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(empresa_id, idempotency_key)
      `);
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_actions_tenant_status ON dot_agent_actions(empresa_id, status, updated_at)');

      await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_outcomes (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        plan_id TEXT,
        action_id TEXT,
        metric_key TEXT NOT NULL,
        baseline_value REAL,
        observed_value REAL,
        delta_value REAL,
        evaluation_window_start TEXT,
        evaluation_window_end TEXT,
        status TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL
      `);
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_outcomes_tenant_time ON dot_agent_outcomes(empresa_id, created_at)');
    })();
  }
  return schemaPromise;
}

function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(-30) : [];
}

function rowDecision(row: any): DotDecision {
  let evidenceStepIds: string[] = [];
  try { evidenceStepIds = ids(JSON.parse(row.evidence_step_ids_json || '[]')); } catch {}
  return {
    id: row.id,
    empresaId: row.empresa_id,
    planId: row.plan_id ?? null,
    signalId: row.signal_id ?? null,
    hypothesisId: row.hypothesis_id ?? null,
    decisionType: row.decision_type,
    decision: row.decision,
    rationaleSummary: row.rationale_summary,
    confidenceScore: Number(row.confidence_score || 0),
    evidenceStepIds,
    approvalRequired: Boolean(Number(row.approval_required || 0)),
    approvalStatus: row.approval_status,
    approvedBy: row.approved_by ?? null,
    approvedAt: row.approved_at ?? null,
    actionId: row.action_id ?? null,
    outcomeId: row.outcome_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowAction(row: any): DotAction {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    planId: row.plan_id ?? null,
    actionType: row.action_type,
    targetKey: row.target_key,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    requestedBy: row.requested_by ?? null,
    approvedBy: row.approved_by ?? null,
    executedAt: row.executed_at ?? null,
    resultSummary: row.result_summary ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function recordDotDecision(input: {
  empresaId: string;
  planId?: string | null;
  signalId?: string | null;
  hypothesisId?: string | null;
  decisionType: string;
  decision: string;
  rationaleSummary?: string;
  confidenceScore?: number;
  evidenceStepIds?: string[];
  approvalRequired?: boolean;
}): Promise<DotDecision> {
  await ensureDotLedgerSchema();
  const id = randomUUID();
  const now = new Date().toISOString();
  await getDb().run(
    'INSERT INTO dot_agent_decisions (id,empresa_id,plan_id,signal_id,hypothesis_id,decision_type,decision,rationale_summary,confidence_score,evidence_step_ids_json,approval_required,approval_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      id,
      input.empresaId,
      input.planId ?? null,
      input.signalId ?? null,
      input.hypothesisId ?? null,
      input.decisionType.slice(0, 120),
      input.decision.slice(0, 4000),
      String(input.rationaleSummary || '').slice(0, 2000),
      Math.max(0, Math.min(100, Number(input.confidenceScore || 0))),
      JSON.stringify(ids(input.evidenceStepIds)),
      input.approvalRequired ? 1 : 0,
      input.approvalRequired ? 'awaiting_approval' : 'not_required',
      now,
      now,
    ],
  );
  return rowDecision(await getDb().get('SELECT * FROM dot_agent_decisions WHERE id=?', [id]));
}

export async function approveDotDecision(id: string, empresaId: string, approvedBy: string): Promise<boolean> {
  await ensureDotLedgerSchema();
  const result = await getDb().run(
    "UPDATE dot_agent_decisions SET approval_status='approved',approved_by=?,approved_at=?,updated_at=? WHERE id=? AND empresa_id=? AND approval_status='awaiting_approval'",
    [approvedBy, new Date().toISOString(), new Date().toISOString(), id, empresaId],
  );
  return Number((result as any)?.changes || 0) > 0;
}

export function buildDotActionIdempotencyKey(input: {
  empresaId: string;
  actionType: string;
  targetKey: string;
  planId?: string | null;
  fingerprint?: string | null;
}): string {
  return createHash('sha256')
    .update([input.empresaId, input.actionType, input.targetKey, input.planId || '', input.fingerprint || ''].join('|'))
    .digest('hex');
}

export async function getOrCreateDotAction(input: {
  empresaId: string;
  planId?: string | null;
  actionType: string;
  targetKey: string;
  fingerprint?: string | null;
  requestedBy?: string | null;
  approvalRequired?: boolean;
}): Promise<{ action: DotAction; created: boolean }> {
  await ensureDotLedgerSchema();
  const idempotencyKey = buildDotActionIdempotencyKey(input);
  const existing = await getDb().get(
    'SELECT * FROM dot_agent_actions WHERE empresa_id=? AND idempotency_key=? LIMIT 1',
    [input.empresaId, idempotencyKey],
  );
  if (existing) return { action: rowAction(existing), created: false };

  const id = randomUUID();
  const now = new Date().toISOString();
  const status: DotActionStatus = input.approvalRequired ? 'awaiting_approval' : 'proposed';
  try {
    await getDb().run(
      'INSERT INTO dot_agent_actions (id,empresa_id,plan_id,action_type,target_key,idempotency_key,status,requested_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, input.empresaId, input.planId ?? null, input.actionType.slice(0, 160), input.targetKey.slice(0, 500), idempotencyKey, status, input.requestedBy ?? null, now, now],
    );
  } catch {
    const raced = await getDb().get('SELECT * FROM dot_agent_actions WHERE empresa_id=? AND idempotency_key=? LIMIT 1', [input.empresaId, idempotencyKey]);
    if (raced) return { action: rowAction(raced), created: false };
    throw new Error('Não foi possível registrar a ação DOT de forma idempotente.');
  }
  return { action: rowAction(await getDb().get('SELECT * FROM dot_agent_actions WHERE id=?', [id])), created: true };
}

export async function updateDotAction(input: {
  id: string;
  empresaId: string;
  status: DotActionStatus;
  approvedBy?: string | null;
  resultSummary?: string | null;
}): Promise<DotAction | null> {
  await ensureDotLedgerSchema();
  const now = new Date().toISOString();
  const executedAt = input.status === 'completed' ? now : null;
  await getDb().run(
    'UPDATE dot_agent_actions SET status=?,approved_by=COALESCE(?,approved_by),executed_at=COALESCE(?,executed_at),result_summary=COALESCE(?,result_summary),updated_at=? WHERE id=? AND empresa_id=?',
    [input.status, input.approvedBy ?? null, executedAt, input.resultSummary?.slice(0, 2000) ?? null, now, input.id, input.empresaId],
  );
  const row = await getDb().get('SELECT * FROM dot_agent_actions WHERE id=? AND empresa_id=?', [input.id, input.empresaId]);
  return row ? rowAction(row) : null;
}

export async function recordDotOutcome(input: {
  empresaId: string;
  planId?: string | null;
  actionId?: string | null;
  metricKey: string;
  baselineValue?: number | null;
  observedValue?: number | null;
  evaluationWindowStart?: string | null;
  evaluationWindowEnd?: string | null;
  status: DotOutcomeStatus;
  source: string;
}): Promise<DotOutcome> {
  await ensureDotLedgerSchema();
  const id = randomUUID();
  const now = new Date().toISOString();
  const baseline = input.baselineValue == null ? null : Number(input.baselineValue);
  const observed = input.observedValue == null ? null : Number(input.observedValue);
  await getDb().run(
    'INSERT INTO dot_agent_outcomes (id,empresa_id,plan_id,action_id,metric_key,baseline_value,observed_value,delta_value,evaluation_window_start,evaluation_window_end,status,source,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, input.empresaId, input.planId ?? null, input.actionId ?? null, input.metricKey.slice(0, 160), baseline, observed, baseline != null && observed != null ? observed - baseline : null, input.evaluationWindowStart ?? null, input.evaluationWindowEnd ?? null, input.status, input.source.slice(0, 160), now],
  );
  return {
    id,
    empresaId: input.empresaId,
    planId: input.planId ?? null,
    actionId: input.actionId ?? null,
    metricKey: input.metricKey,
    baselineValue: baseline,
    observedValue: observed,
    deltaValue: baseline != null && observed != null ? observed - baseline : null,
    evaluationWindowStart: input.evaluationWindowStart ?? null,
    evaluationWindowEnd: input.evaluationWindowEnd ?? null,
    status: input.status,
    source: input.source,
    createdAt: now,
  };
}

export async function bindDotDecisionAction(id: string, empresaId: string, actionId: string): Promise<void> {
  await ensureDotLedgerSchema();
  await getDb().run(
    'UPDATE dot_agent_decisions SET action_id=?,updated_at=? WHERE id=? AND empresa_id=?',
    [actionId, new Date().toISOString(), id, empresaId],
  );
}

export async function bindDotDecisionOutcome(id: string, empresaId: string, outcomeId: string): Promise<void> {
  await ensureDotLedgerSchema();
  await getDb().run(
    'UPDATE dot_agent_decisions SET outcome_id=?,updated_at=? WHERE id=? AND empresa_id=?',
    [outcomeId, new Date().toISOString(), id, empresaId],
  );
}

export async function approvePendingDotDecisionsForPlan(empresaId: string, planId: string, approvedBy: string): Promise<number> {
  await ensureDotLedgerSchema();
  const now = new Date().toISOString();
  const result = await getDb().run(
    "UPDATE dot_agent_decisions SET approval_status='approved',approved_by=?,approved_at=?,updated_at=? WHERE empresa_id=? AND plan_id=? AND approval_status='awaiting_approval'",
    [approvedBy, now, now, empresaId, planId],
  );
  return Number((result as any)?.changes || 0);
}

export async function promoteApprovedDotActionsForPlan(empresaId: string, planId: string, approvedBy: string): Promise<number> {
  await ensureDotLedgerSchema();
  const now = new Date().toISOString();
  const result = await getDb().run(
    "UPDATE dot_agent_actions SET status='proposed',approved_by=?,updated_at=? WHERE empresa_id=? AND plan_id=? AND status='awaiting_approval'",
    [approvedBy, now, empresaId, planId],
  );
  return Number((result as any)?.changes || 0);
}

export async function listDotDecisions(empresaId: string, limit = 20): Promise<DotDecision[]> {
  await ensureDotLedgerSchema();
  const rows = await getDb().all('SELECT * FROM dot_agent_decisions WHERE empresa_id=? ORDER BY created_at DESC LIMIT ?', [empresaId, Math.max(1, Math.min(limit, 50))]);
  return (rows as any[]).map(rowDecision);
}
