import { randomUUID } from "crypto";
import { getDb } from "../db";

export type DotPlanStepStatus = "pending" | "working" | "completed" | "blocked" | "failed";

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
  status: "working" | "waiting_approval" | "completed" | "failed" | "paused";
  currentStepId?: string | null;
}

let schemaPromise: Promise<void> | null = null;

export function ensureDotPlanSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getDb();
      await db.query(`
        CREATE TABLE IF NOT EXISTS dot_agent_plans (
          id TEXT PRIMARY KEY,
          empresa_id TEXT NOT NULL,
          actor_user_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          objective TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'working',
          current_step_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS dot_agent_plan_steps (
          id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL,
          sequence INTEGER NOT NULL,
          title TEXT NOT NULL,
          kind TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          tool_id TEXT,
          rationale TEXT,
          evidence_json JSONB,
          error TEXT,
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_dot_agent_plans_tenant_session ON dot_agent_plans(empresa_id, session_id, updated_at DESC)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_dot_agent_plan_steps_plan_seq ON dot_agent_plan_steps(plan_id, sequence)`);
    })();
  }
  return schemaPromise;
}

export async function createDotPlan(input: {
  empresaId: string;
  actorUserId: string;
  sessionId: string;
  objective: string;
}): Promise<DotPlan> {
  await ensureDotPlanSchema();
  const db = getDb();
  const id = randomUUID();
  await db.query(
    `INSERT INTO dot_agent_plans (id, empresa_id, actor_user_id, session_id, objective)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, input.empresaId, input.actorUserId, input.sessionId, input.objective],
  );
  return {
    id,
    empresaId: input.empresaId,
    actorUserId: input.actorUserId,
    sessionId: input.sessionId,
    objective: input.objective,
    status: "working",
  };
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
  const next = await db.query<{ next: number }>(
    `SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM dot_agent_plan_steps WHERE plan_id = $1`,
    [input.planId],
  );
  const sequence = Number(next.rows[0]?.next ?? 1);
  const id = randomUUID();
  await db.query(
    `INSERT INTO dot_agent_plan_steps
      (id, plan_id, sequence, title, kind, tool_id, rationale)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, input.planId, sequence, input.title, input.kind, input.toolId ?? null, input.rationale ?? null],
  );
  await db.query(
    `UPDATE dot_agent_plans SET current_step_id = $2, updated_at = NOW() WHERE id = $1`,
    [input.planId, id],
  );
  return {
    id,
    planId: input.planId,
    sequence,
    title: input.title,
    kind: input.kind,
    status: "pending",
    toolId: input.toolId ?? null,
    rationale: input.rationale ?? null,
  };
}

export async function updateDotPlanStep(
  stepId: string,
  update: {
    status: DotPlanStepStatus;
    evidence?: unknown;
    error?: string;
  },
): Promise<void> {
  await ensureDotPlanSchema();
  const db = getDb();
  await db.query(
    `UPDATE dot_agent_plan_steps
       SET status = $2,
           evidence_json = COALESCE($3::jsonb, evidence_json),
           error = $4,
           started_at = CASE WHEN $2 = 'working' AND started_at IS NULL THEN NOW() ELSE started_at END,
           completed_at = CASE WHEN $2 IN ('completed','failed','blocked') THEN NOW() ELSE completed_at END
     WHERE id = $1`,
    [
      stepId,
      update.status,
      update.evidence === undefined ? null : JSON.stringify(update.evidence),
      update.error ?? null,
    ],
  );
}

export async function setDotPlanStatus(
  planId: string,
  status: DotPlan["status"],
): Promise<void> {
  await ensureDotPlanSchema();
  const db = getDb();
  await db.query(
    `UPDATE dot_agent_plans SET status = $2, updated_at = NOW() WHERE id = $1`,
    [planId, status],
  );
}

export async function getDotPlan(planId: string): Promise<DotPlan | null> {
  await ensureDotPlanSchema();
  const db = getDb();
  const result = await db.query<{
    id: string; empresa_id: string; actor_user_id: string; session_id: string;
    objective: string; status: DotPlan["status"]; current_step_id: string | null;
  }>(
    `SELECT id, empresa_id, actor_user_id, session_id, objective, status, current_step_id
       FROM dot_agent_plans WHERE id = $1 LIMIT 1`,
    [planId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    empresaId: row.empresa_id,
    actorUserId: row.actor_user_id,
    sessionId: row.session_id,
    objective: row.objective,
    status: row.status,
    currentStepId: row.current_step_id,
  };
}
