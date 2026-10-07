import { randomUUID } from 'crypto';
import { getDb } from '../lib/db.js';

export type DotHypothesisStatus = 'open' | 'supported' | 'refuted' | 'inconclusive';
export type DotConfidence = 'low' | 'medium' | 'high';

export interface DotHypothesis {
  id: string;
  empresaId: string;
  signalId: string;
  statement: string;
  rationale: string;
  status: DotHypothesisStatus;
  confidence: DotConfidence;
  confidenceScore: number;
  evidenceStepIds: string[];
  createdAt: string;
  updatedAt: string;
}

let schemaPromise: Promise<void> | null = null;

export function ensureDotDecisionSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getDb();
      await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_hypotheses (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        signal_id TEXT NOT NULL,
        statement TEXT NOT NULL,
        rationale TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        confidence TEXT NOT NULL DEFAULT 'low',
        confidence_score REAL NOT NULL DEFAULT 0,
        evidence_step_ids_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_hypotheses_signal ON dot_agent_hypotheses(empresa_id, signal_id, status, updated_at)');
    })();
  }
  return schemaPromise;
}

function classify(score: number): DotConfidence {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function safeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').slice(-30);
}

export function buildInitialDotHypothesis(signal: {
  id: string;
  signalType: string;
  title: string;
  summary: string;
}): Omit<DotHypothesis, 'id' | 'createdAt' | 'updatedAt'> {
  switch (signal.signalType) {
    case 'reviews_negative_pressure':
      return {
        empresaId: '',
        signalId: signal.id,
        statement: 'A deterioração recente da reputação está concentrada em uma pressão operacional que está gerando experiências negativas.',
        rationale: signal.summary,
        status: 'open',
        confidence: 'low',
        confidenceScore: 35,
        evidenceStepIds: [],
      };
    case 'reviews_rating_decline':
      return {
        empresaId: '',
        signalId: signal.id,
        statement: 'A queda da nota média representa uma mudança recente de experiência, e não apenas uma oscilação normal do volume de avaliações.',
        rationale: signal.summary,
        status: 'open',
        confidence: 'low',
        confidenceScore: 35,
        evidenceStepIds: [],
      };
    case 'goal_stalled':
      return {
        empresaId: '',
        signalId: signal.id,
        statement: 'O objetivo operacional está estagnado por falta de progresso ou de atividade recente suficiente.',
        rationale: signal.summary,
        status: 'open',
        confidence: 'medium',
        confidenceScore: 55,
        evidenceStepIds: [],
      };
    default:
      return {
        empresaId: '',
        signalId: signal.id,
        statement: `O sinal "${signal.title}" representa um problema operacional relevante que merece investigação antes de qualquer ação.`,
        rationale: signal.summary,
        status: 'open',
        confidence: 'low',
        confidenceScore: 30,
        evidenceStepIds: [],
      };
  }
}

export async function ensureDotHypothesis(empresaId: string, signal: {
  id: string;
  signalType: string;
  title: string;
  summary: string;
}): Promise<DotHypothesis> {
  await ensureDotDecisionSchema();
  const db = getDb();
  const existing = await db.get(
    "SELECT id,empresa_id,signal_id,statement,rationale,status,confidence,confidence_score,evidence_step_ids_json,created_at,updated_at FROM dot_agent_hypotheses WHERE empresa_id=? AND signal_id=? AND status IN ('open','supported') ORDER BY updated_at DESC LIMIT 1",
    [empresaId, signal.id],
  );
  if (existing) return rowToHypothesis(existing);

  const now = new Date().toISOString();
  const base = buildInitialDotHypothesis(signal);
  const id = randomUUID();
  await db.run(
    'INSERT INTO dot_agent_hypotheses (id,empresa_id,signal_id,statement,rationale,status,confidence,confidence_score,evidence_step_ids_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [id, empresaId, signal.id, base.statement, base.rationale, base.status, base.confidence, base.confidenceScore, '[]', now, now],
  );
  return rowToHypothesis(await db.get(
    'SELECT id,empresa_id,signal_id,statement,rationale,status,confidence,confidence_score,evidence_step_ids_json,created_at,updated_at FROM dot_agent_hypotheses WHERE id=?',
    [id],
  ));
}

export async function getOpenDotHypothesisForSignal(empresaId: string, signalId: string): Promise<DotHypothesis | null> {
  await ensureDotDecisionSchema();
  const row = await getDb().get(
    "SELECT id,empresa_id,signal_id,statement,rationale,status,confidence,confidence_score,evidence_step_ids_json,created_at,updated_at FROM dot_agent_hypotheses WHERE empresa_id=? AND signal_id=? AND status IN ('open','supported') ORDER BY updated_at DESC LIMIT 1",
    [empresaId, signalId],
  );
  return row ? rowToHypothesis(row) : null;
}

export function evaluateDotEvidence(input: {
  signalType: string;
  toolId: string;
  result: unknown;
}): { support: 'support' | 'refute' | 'neutral'; strength: number } {
  if (input.toolId === 'reviews.read' && Array.isArray(input.result)) {
    const ratings = input.result.map((row: any) => Number(row?.rating)).filter(Number.isFinite);
    if (!ratings.length) return { support: 'neutral', strength: 5 };
    const negative = ratings.filter((rating) => rating <= 2).length;
    if (input.signalType === 'reviews_negative_pressure') {
      return negative > 0 ? { support: 'support', strength: Math.min(30, 10 + negative * 3) } : { support: 'refute', strength: 12 };
    }
    if (input.signalType === 'reviews_rating_decline') {
      const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      return average <= 3.2 ? { support: 'support', strength: 15 } : { support: 'neutral', strength: 5 };
    }
  }

  if (input.toolId === 'reviews.analyze' && input.result && typeof input.result === 'object') {
    const average = Number((input.result as any).averageRating);
    if (Number.isFinite(average) && input.signalType.startsWith('reviews_')) {
      return average <= 3.2 ? { support: 'support', strength: 15 } : { support: 'neutral', strength: 5 };
    }
  }

  if (input.toolId === 'dot.goals.read' && Array.isArray(input.result) && input.signalType === 'goal_stalled') {
    const active = input.result.filter((goal: any) => String(goal?.status) === 'active');
    const stalled = active.filter((goal: any) => Number(goal?.progress || 0) < 50);
    return stalled.length ? { support: 'support', strength: Math.min(25, 10 + stalled.length * 3) } : { support: 'refute', strength: 15 };
  }

  return { support: 'neutral', strength: 5 };
}

export async function attachDotHypothesisEvidence(input: {
  hypothesisId: string;
  evidenceStepId: string;
  support: 'support' | 'refute' | 'neutral';
  strength?: number;
}): Promise<DotHypothesis | null> {
  await ensureDotDecisionSchema();
  const db = getDb();
  const row = await db.get(
    'SELECT id,empresa_id,signal_id,statement,rationale,status,confidence,confidence_score,evidence_step_ids_json,created_at,updated_at FROM dot_agent_hypotheses WHERE id=?',
    [input.hypothesisId],
  );
  if (!row) return null;

  const current = rowToHypothesis(row);
  const strength = Math.max(5, Math.min(35, Number(input.strength || 15)));
  const delta = input.support === 'support' ? strength : input.support === 'refute' ? -strength : 0;
  const score = Math.max(0, Math.min(100, current.confidenceScore + delta));
  const evidence = Array.from(new Set([...current.evidenceStepIds, input.evidenceStepId])).slice(-30);
  const status: DotHypothesisStatus = score >= 75 ? 'supported' : score <= 25 ? 'refuted' : 'open';
  const confidence = classify(score);
  const now = new Date().toISOString();

  await db.run(
    'UPDATE dot_agent_hypotheses SET status=?,confidence=?,confidence_score=?,evidence_step_ids_json=?,updated_at=? WHERE id=?',
    [status, confidence, score, JSON.stringify(evidence), now, input.hypothesisId],
  );
  return {
    ...current,
    status,
    confidence,
    confidenceScore: score,
    evidenceStepIds: evidence,
    updatedAt: now,
  };
}

export async function listDotHypotheses(empresaId: string, limit = 20): Promise<DotHypothesis[]> {
  await ensureDotDecisionSchema();
  const rows = await getDb().all(
    'SELECT id,empresa_id,signal_id,statement,rationale,status,confidence,confidence_score,evidence_step_ids_json,created_at,updated_at FROM dot_agent_hypotheses WHERE empresa_id=? ORDER BY updated_at DESC LIMIT ?',
    [empresaId, Math.max(1, Math.min(limit, 50))],
  );
  return (rows as any[]).map(rowToHypothesis);
}

function rowToHypothesis(row: any): DotHypothesis {
  let ids: string[] = [];
  try { ids = safeIds(JSON.parse(row.evidence_step_ids_json || '[]')); } catch {}
  return {
    id: row.id,
    empresaId: row.empresa_id,
    signalId: row.signal_id,
    statement: row.statement,
    rationale: row.rationale,
    status: row.status,
    confidence: row.confidence,
    confidenceScore: Number(row.confidence_score || 0),
    evidenceStepIds: ids,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
