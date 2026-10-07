import { randomUUID } from 'crypto';
import { getDb } from '../lib/db.js';

export type DotPlanStepStatus = 'pending' | 'working' | 'completed' | 'blocked' | 'failed';
export type DotPlanStatus = 'working' | 'waiting_approval' | 'completed' | 'failed' | 'paused';

export interface DotPlanStep {
  id: string;
  planId: string;
  sequence: number;
  title: string;
  kind: string;
  status: DotPlanStepStatus;
  toolId?: string | null;
  rationale?: string | null;
  evidence?: unknown;
  error?: string | null;
}

export interface DotPlan {
  id: string;
  empresaId: string;
  actorUserId: string;
  sessionId: string;
  objective: string;
  status: DotPlanStatus;
  currentStepId?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalAction?: string | null;
  triggerSignalId?: string | null;
  triggerFingerprint?: string | null;
}

let schemaPromise: Promise<void> | null = null;

export function ensureDotPlanSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getDb();
      await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_plans (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        actor_user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        objective TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'working',
        current_step_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        approved_by TEXT,
        approved_at TEXT,
        approval_action TEXT,
        trigger_signal_id TEXT,
        trigger_fingerprint TEXT
      )`);
      try { await db.exec('ALTER TABLE dot_agent_plans ADD COLUMN approved_by TEXT'); } catch {}
      try { await db.exec('ALTER TABLE dot_agent_plans ADD COLUMN approved_at TEXT'); } catch {}
      try { await db.exec('ALTER TABLE dot_agent_plans ADD COLUMN approval_action TEXT'); } catch {}
      try { await db.exec('ALTER TABLE dot_agent_plans ADD COLUMN trigger_signal_id TEXT'); } catch {}
      try { await db.exec('ALTER TABLE dot_agent_plans ADD COLUMN trigger_fingerprint TEXT'); } catch {}
      await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_plan_steps (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        title TEXT NOT NULL,
        kind TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        tool_id TEXT,
        rationale TEXT,
        evidence_json TEXT,
        error TEXT,
        started_at TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL
      )`);
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_plans_tenant_session ON dot_agent_plans(empresa_id, session_id, updated_at)');
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_plans_trigger ON dot_agent_plans(empresa_id, trigger_fingerprint, status, updated_at)');
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_plan_steps_plan_seq ON dot_agent_plan_steps(plan_id, sequence)');
    })();
  }
  return schemaPromise;
}

export async function createDotPlan(input: {
  empresaId: string;
  actorUserId: string;
  sessionId: string;
  objective: string;
  triggerSignalId?: string | null;
  triggerFingerprint?: string | null;
}): Promise<DotPlan> {
  await ensureDotPlanSchema();
  const id = randomUUID();
  const now = new Date().toISOString();
  await getDb().run(
    'INSERT INTO dot_agent_plans (id,empresa_id,actor_user_id,session_id,objective,status,created_at,updated_at,trigger_signal_id,trigger_fingerprint) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [id, input.empresaId, input.actorUserId, input.sessionId, input.objective.slice(0, 4000), 'working', now, now, input.triggerSignalId ?? null, input.triggerFingerprint ?? null],
  );
  return { id, empresaId: input.empresaId, actorUserId: input.actorUserId, sessionId: input.sessionId, objective: input.objective, status: 'working', approvedBy: null, approvedAt: null, approvalAction: null, triggerSignalId: input.triggerSignalId ?? null, triggerFingerprint: input.triggerFingerprint ?? null };
}

export async function addDotPlanStep(input: {
  planId: string;
  title: string;
  kind: string;
  toolId?: string;
  rationale?: string;
}): Promise<DotPlanStep> {
  await ensureDotPlanSchema();
  const db = getDb();
  const rows = await db.all(
    'SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM dot_agent_plan_steps WHERE plan_id=?',
    [input.planId],
  );
  const sequence = Number((rows as any[])?.[0]?.next ?? 1);
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.run(
    'INSERT INTO dot_agent_plan_steps (id,plan_id,sequence,title,kind,status,tool_id,rationale,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, input.planId, sequence, input.title.slice(0, 1000), input.kind.slice(0, 120), 'pending', input.toolId ?? null, input.rationale?.slice(0, 2000) ?? null, now],
  );
  await db.run(
    'UPDATE dot_agent_plans SET current_step_id=?, updated_at=? WHERE id=?',
    [id, now, input.planId],
  );
  return { id, planId: input.planId, sequence, title: input.title, kind: input.kind, status: 'pending', toolId: input.toolId ?? null, rationale: input.rationale ?? null };
}

export async function updateDotPlanStep(stepId: string, update: {
  status: DotPlanStepStatus;
  evidence?: unknown;
  error?: string;
}): Promise<void> {
  await ensureDotPlanSchema();
  const now = new Date().toISOString();
  await getDb().run(
    `UPDATE dot_agent_plan_steps
       SET status=?,
           evidence_json=COALESCE(?, evidence_json),
           error=?,
           started_at=CASE WHEN ?='working' AND started_at IS NULL THEN ? ELSE started_at END,
           completed_at=CASE WHEN ? IN ('completed','failed','blocked') THEN ? ELSE completed_at END
     WHERE id=?`,
    [
      update.status,
      update.evidence === undefined ? null : JSON.stringify(update.evidence).slice(0, 20000),
      update.error?.slice(0, 4000) ?? null,
      update.status, now, update.status, now, stepId,
    ],
  );
}

export async function findActiveDotPlanForSignal(empresaId: string, triggerFingerprint: string): Promise<DotPlan | null> {
  await ensureDotPlanSchema();
  const rows = await getDb().all(
    "SELECT id,empresa_id,actor_user_id,session_id,objective,status,current_step_id,approved_by,approved_at,approval_action,trigger_signal_id,trigger_fingerprint FROM dot_agent_plans WHERE empresa_id=? AND trigger_fingerprint=? AND status IN ('working','paused','waiting_approval') ORDER BY updated_at DESC LIMIT 1",
    [empresaId, triggerFingerprint],
  );
  const row = (rows as any[])?.[0];
  if (!row) return null;
  return { id: row.id, empresaId: row.empresa_id, actorUserId: row.actor_user_id, sessionId: row.session_id, objective: row.objective, status: row.status as DotPlanStatus, currentStepId: row.current_step_id, approvedBy: row.approved_by ?? null, approvedAt: row.approved_at ?? null, approvalAction: row.approval_action ?? null, triggerSignalId: row.trigger_signal_id ?? null, triggerFingerprint: row.trigger_fingerprint ?? null };
}

export async function recordDotPlanApproval(planId: string, approvedBy: string, approvalAction?: string | null): Promise<void> {
  await ensureDotPlanSchema();
  await getDb().run(
    'UPDATE dot_agent_plans SET approved_by=?, approved_at=?, approval_action=?, updated_at=? WHERE id=?',
    [approvedBy, new Date().toISOString(), approvalAction?.slice(0, 1000) ?? null, new Date().toISOString(), planId],
  );
}

export async function setDotPlanStatus(planId: string, status: DotPlanStatus): Promise<void> {
  await ensureDotPlanSchema();
  await getDb().run(
    'UPDATE dot_agent_plans SET status=?, updated_at=? WHERE id=?',
    [status, new Date().toISOString(), planId],
  );
}

export async function getDotPlan(planId: string): Promise<DotPlan | null> {
  await ensureDotPlanSchema();
  const rows = await getDb().all(
    'SELECT id,empresa_id,actor_user_id,session_id,objective,status,current_step_id,approved_by,approved_at,approval_action,trigger_signal_id,trigger_fingerprint FROM dot_agent_plans WHERE id=? LIMIT 1',
    [planId],
  );
  const row = (rows as any[])?.[0];
  if (!row) return null;
  return {
    id: row.id,
    empresaId: row.empresa_id,
    actorUserId: row.actor_user_id,
    sessionId: row.session_id,
    objective: row.objective,
    status: row.status as DotPlanStatus,
    currentStepId: row.current_step_id,
    approvedBy: row.approved_by ?? null,
    approvedAt: row.approved_at ?? null,
    approvalAction: row.approval_action ?? null,
    triggerSignalId: row.trigger_signal_id ?? null,
    triggerFingerprint: row.trigger_fingerprint ?? null,
  };
}


export async function listDotPlans(empresaId: string, actorUserId: string, limit = 10): Promise<DotPlan[]> {
  await ensureDotPlanSchema();
  const rows = await getDb().all(
    "SELECT id,empresa_id,actor_user_id,session_id,objective,status,current_step_id,approved_by,approved_at,approval_action,trigger_signal_id,trigger_fingerprint FROM dot_agent_plans WHERE empresa_id=? AND (actor_user_id=? OR actor_user_id='system-dot') ORDER BY updated_at DESC LIMIT ?",
    [empresaId, actorUserId, Math.max(1, Math.min(limit, 50))],
  );
  return (rows as any[]).map((row) => ({
    id: row.id,
    empresaId: row.empresa_id,
    actorUserId: row.actor_user_id,
    sessionId: row.session_id,
    objective: row.objective,
    status: row.status as DotPlanStatus,
    currentStepId: row.current_step_id,
    approvedBy: row.approved_by ?? null,
    approvedAt: row.approved_at ?? null,
    approvalAction: row.approval_action ?? null,
    triggerSignalId: row.trigger_signal_id ?? null,
    triggerFingerprint: row.trigger_fingerprint ?? null,
  }));
}

export async function listDotPlanSteps(planId: string): Promise<DotPlanStep[]> {
  await ensureDotPlanSchema();
  const rows = await getDb().all(
    'SELECT id,plan_id,sequence,title,kind,status,tool_id,rationale,evidence_json,error FROM dot_agent_plan_steps WHERE plan_id=? ORDER BY sequence ASC',
    [planId],
  );
  return (rows as any[]).map((row) => ({
    id: row.id,
    planId: row.plan_id,
    sequence: Number(row.sequence),
    title: row.title,
    kind: row.kind,
    status: row.status as DotPlanStepStatus,
    toolId: row.tool_id,
    rationale: row.rationale,
    evidence: row.evidence_json ? safeJson(row.evidence_json) : undefined,
    error: row.error,
  }));
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
