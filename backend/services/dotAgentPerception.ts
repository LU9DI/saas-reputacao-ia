import { randomUUID } from 'crypto';
import { getDb } from '../lib/db.js';
import {
  createDotPlan,
  ensureDotPlanSchema,
  findActiveDotPlanForSignal,
  findRecentDotPlanForSignal,
} from './dotAgentPlan.js';

export type DotSignalSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DotSignalStatus = 'active' | 'resolved' | 'planned' | 'ignored';

export interface DotPerceptionSignal {
  id: string;
  empresaId: string;
  signalType: string;
  fingerprint: string;
  severity: DotSignalSeverity;
  priorityScore: number;
  title: string;
  summary: string;
  source: string;
  status: DotSignalStatus;
  payload: Record<string, unknown>;
  firstSeenAt: string;
  lastSeenAt: string;
}

const SEVERITY_SCORE: Record<DotSignalSeverity, number> = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 100,
};

let schemaPromise: Promise<void> | null = null;

export function ensureDotPerceptionSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getDb();
      await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_signals (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        signal_type TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        severity TEXT NOT NULL,
        priority_score REAL NOT NULL DEFAULT 0,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        source TEXT NOT NULL,
        payload_json TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active',
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_signals_tenant_priority ON dot_agent_signals(empresa_id, status, priority_score, last_seen_at)');
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_signals_fingerprint ON dot_agent_signals(empresa_id, fingerprint)');
    })();
  }
  return schemaPromise;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreSignal(severity: DotSignalSeverity, recurrence: number, recencyBoost = 0): number {
  return clampScore(SEVERITY_SCORE[severity] + Math.min(15, recurrence * 3) + Math.min(10, recencyBoost));
}

function classifyNegativePressure(negative: number, average: number | null): DotSignalSeverity | null {
  if (negative >= 10 || (negative >= 5 && average !== null && average <= 2.5)) return 'critical';
  if (negative >= 5 || (negative >= 3 && average !== null && average <= 3.2)) return 'high';
  if (negative >= 1) return 'medium';
  return null;
}

async function upsertSignal(input: {
  empresaId: string;
  signalType: string;
  fingerprint: string;
  severity: DotSignalSeverity | null;
  title: string;
  summary: string;
  source: string;
  payload: Record<string, unknown>;
  recurrence?: number;
  recencyBoost?: number;
}): Promise<DotPerceptionSignal | null> {
  await ensureDotPerceptionSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const existingRows = await db.all(
    'SELECT id,first_seen_at FROM dot_agent_signals WHERE empresa_id=? AND fingerprint=? ORDER BY updated_at DESC LIMIT 1',
    [input.empresaId, input.fingerprint],
  );
  const existing = (existingRows as any[])?.[0];

  if (!input.severity) {
    if (existing) {
      await db.run(
        "UPDATE dot_agent_signals SET status='resolved', last_seen_at=?, updated_at=? WHERE id=?",
        [now, now, existing.id],
      );
    }
    return null;
  }

  const priorityScore = scoreSignal(input.severity, input.recurrence || 0, input.recencyBoost || 0);
  const payloadJson = JSON.stringify(input.payload).slice(0, 12000);

  if (existing) {
    await db.run(
      'UPDATE dot_agent_signals SET signal_type=?,severity=?,priority_score=?,title=?,summary=?,source=?,payload_json=?,status=?,last_seen_at=?,updated_at=? WHERE id=?',
      [
        input.signalType,
        input.severity,
        priorityScore,
        input.title.slice(0, 500),
        input.summary.slice(0, 2000),
        input.source.slice(0, 120),
        payloadJson,
        'active',
        now,
        now,
        existing.id,
      ],
    );
    return getDotSignal(existing.id);
  }

  const id = randomUUID();
  await db.run(
    'INSERT INTO dot_agent_signals (id,empresa_id,signal_type,fingerprint,severity,priority_score,title,summary,source,payload_json,status,first_seen_at,last_seen_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      id,
      input.empresaId,
      input.signalType,
      input.fingerprint,
      input.severity,
      priorityScore,
      input.title.slice(0, 500),
      input.summary.slice(0, 2000),
      input.source.slice(0, 120),
      payloadJson,
      'active',
      now,
      now,
      now,
      now,
    ],
  );
  return getDotSignal(id);
}

async function getDotSignal(id: string): Promise<DotPerceptionSignal | null> {
  const row = await getDb().get(
    'SELECT id,empresa_id,signal_type,fingerprint,severity,priority_score,title,summary,source,status,payload_json,first_seen_at,last_seen_at FROM dot_agent_signals WHERE id=? LIMIT 1',
    [id],
  );
  if (!row) return null;
  return {
    id: row.id,
    empresaId: row.empresa_id,
    signalType: row.signal_type,
    fingerprint: row.fingerprint,
    severity: row.severity as DotSignalSeverity,
    priorityScore: Number(row.priority_score || 0),
    title: row.title,
    summary: row.summary,
    source: row.source,
    status: row.status as DotSignalStatus,
    payload: safeJson(row.payload_json),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  };
}

export async function detectDotSignals(empresaId: string): Promise<DotPerceptionSignal[]> {
  await ensureDotPerceptionSchema();
  const db = getDb();
  const now = Date.now();
  const recentCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const previousCutoff = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

  const recent = await db.get(
    'SELECT COUNT(*) AS total, SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) AS negative, AVG(rating) AS average_rating FROM reviews WHERE empresa_id=? AND createdAt>=?',
    [empresaId, recentCutoff],
  );
  const previous = await db.get(
    'SELECT COUNT(*) AS total, SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) AS negative, AVG(rating) AS average_rating FROM reviews WHERE empresa_id=? AND createdAt>=? AND createdAt<?',
    [empresaId, previousCutoff, recentCutoff],
  );

  const recentNegative = Number(recent?.negative || 0);
  const recentAverage = recent?.average_rating == null ? null : Number(recent.average_rating);
  const previousAverage = previous?.average_rating == null ? null : Number(previous.average_rating);
  const severity = classifyNegativePressure(recentNegative, recentAverage);
  const recurrence = Number(recent?.total || 0);
  const detected: DotPerceptionSignal[] = [];

  const negativeSignal = await upsertSignal({
    empresaId,
    signalType: 'reviews_negative_pressure',
    fingerprint: 'reviews:negative-pressure',
    severity,
    title: 'Pressão negativa nas avaliações',
    summary: `Foram detectadas ${recentNegative} avaliações de 1–2 estrelas nos últimos 7 dias${recentAverage === null ? '' : `, com média ${recentAverage.toFixed(2)}`}.`,
    source: 'reviews',
    payload: { recentTotal: Number(recent?.total || 0), recentNegative, recentAverage },
    recurrence,
    recencyBoost: recentNegative > 0 ? 5 : 0,
  });
  if (negativeSignal) detected.push(negativeSignal);

  if (recentAverage !== null && previousAverage !== null && previousAverage - recentAverage >= 0.4) {
    const declineSignal = await upsertSignal({
      empresaId,
      signalType: 'reviews_rating_decline',
      fingerprint: 'reviews:rating-decline',
      severity: previousAverage - recentAverage >= 0.8 ? 'critical' : 'high',
      title: 'Queda recente na nota média',
      summary: `A nota média caiu ${(previousAverage - recentAverage).toFixed(2)} ponto(s) contra os 7 dias anteriores.`,
      source: 'reviews',
      payload: { recentAverage, previousAverage, delta: previousAverage - recentAverage },
      recurrence: Number(recent?.total || 0),
      recencyBoost: 8,
    });
    if (declineSignal) detected.push(declineSignal);
  } else {
    await upsertSignal({
      empresaId,
      signalType: 'reviews_rating_decline',
      fingerprint: 'reviews:rating-decline',
      severity: null,
      title: '',
      summary: '',
      source: 'reviews',
      payload: {},
    });
  }

  const stalledGoals = await db.all(
    "SELECT id,title,progress,status,last_activity_at FROM dot_agent_goals WHERE empresa_id=? AND status='active' AND (COALESCE(progress,0) < 50 OR last_activity_at IS NULL OR last_activity_at<?) ORDER BY updated_at ASC LIMIT 10",
    [empresaId, new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()],
  );

  const activeGoalIds = new Set<string>();
  for (const goal of stalledGoals || []) {
    const goalId = String(goal.id);
    activeGoalIds.add(goalId);
    const signal = await upsertSignal({
      empresaId,
      signalType: 'goal_stalled',
      fingerprint: `goal:stalled:${goalId}`,
      severity: Number(goal.progress || 0) < 25 ? 'high' : 'medium',
      title: `Objetivo operacional parado: ${String(goal.title || 'sem título')}`,
      summary: `O objetivo está com ${Number(goal.progress || 0)}% de progresso e sem atividade recente suficiente.`,
      source: 'dot_agent_goals',
      payload: { goalId, title: goal.title, progress: Number(goal.progress || 0), lastActivityAt: goal.last_activity_at || null },
      recurrence: 1,
      recencyBoost: 4,
    });
    if (signal) detected.push(signal);
  }

  const knownGoalSignals = await db.all(
    "SELECT id,fingerprint FROM dot_agent_signals WHERE empresa_id=? AND signal_type='goal_stalled' AND status IN ('active','planned')",
    [empresaId],
  );
  for (const signal of knownGoalSignals || []) {
    const goalId = String(signal.fingerprint || '').replace('goal:stalled:', '');
    if (!activeGoalIds.has(goalId)) {
      await db.run("UPDATE dot_agent_signals SET status='resolved',updated_at=? WHERE id=?", [new Date().toISOString(), signal.id]);
    }
  }

  return detected.sort((a, b) => b.priorityScore - a.priorityScore);
}

export async function listTopDotSignals(empresaId: string, limit = 10): Promise<DotPerceptionSignal[]> {
  await ensureDotPerceptionSchema();
  const rows = await getDb().all(
    "SELECT id,empresa_id,signal_type,fingerprint,severity,priority_score,title,summary,source,status,payload_json,first_seen_at,last_seen_at FROM dot_agent_signals WHERE empresa_id=? AND status IN ('active','planned') ORDER BY priority_score DESC,last_seen_at DESC LIMIT ?",
    [empresaId, Math.max(1, Math.min(limit, 50))],
  );
  return (rows as any[]).map((row) => ({
    id: row.id,
    empresaId: row.empresa_id,
    signalType: row.signal_type,
    fingerprint: row.fingerprint,
    severity: row.severity as DotSignalSeverity,
    priorityScore: Number(row.priority_score || 0),
    title: row.title,
    summary: row.summary,
    source: row.source,
    status: row.status as DotSignalStatus,
    payload: safeJson(row.payload_json),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  }));
}

export async function createAutonomousDotPlans(empresaId: string, minPriority = 70, limit = 2): Promise<DotPlanCreationResult[]> {
  await ensureDotPlanSchema();
  const signals = await listTopDotSignals(empresaId, limit * 2);
  const created: DotPlanCreationResult[] = [];

  for (const signal of signals) {
    if (created.length >= limit || signal.priorityScore < minPriority || signal.status === 'ignored') continue;
    const existing = await findActiveDotPlanForSignal(empresaId, signal.fingerprint);
    if (existing) continue;
    const recent = await findRecentDotPlanForSignal(empresaId, signal.fingerprint, Number(process.env.DOT_AUTONOMOUS_PLAN_COOLDOWN_HOURS || 24));
    if (recent) continue;

    const sessionId = `autonomous:${signal.fingerprint}`;
    const plan = await createDotPlan({
      empresaId,
      actorUserId: 'system-dot',
      sessionId,
      objective: `Investigue e acompanhe automaticamente o sinal "${signal.title}". Evidência inicial: ${signal.summary}`,
      triggerSignalId: signal.id,
      triggerFingerprint: signal.fingerprint,
    });

    await getDb().run(
      "UPDATE dot_agent_signals SET status='planned',updated_at=? WHERE id=?",
      [new Date().toISOString(), signal.id],
    );

    created.push({ planId: plan.id, signalId: signal.id, fingerprint: signal.fingerprint });
  }

  return created;
}

export type DotPlanCreationResult = {
  planId: string;
  signalId: string;
  fingerprint: string;
};

function safeJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
