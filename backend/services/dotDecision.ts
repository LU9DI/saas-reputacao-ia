import { getDb } from '../lib/db.js';

export type DotDecision = {
  id?: number;
  eventId: number;
  type: 'monitoramento' | 'crise_reputacional' | 'oportunidade';
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  severity: string;
  reason: string;
  evidence: string[];
  recommendation: string;
  requiresApproval: boolean;
  status: 'pending' | 'prepared' | 'approved' | 'rejected';
  createdAt?: string;
};

async function ensureSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    severity TEXT NOT NULL,
    reason TEXT NOT NULL,
    evidence_json TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    requires_approval INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  )`);
}

function classify(event: any): DotDecision {
  const critical = event.severity === 'critical' || event.type === 'rating_drop';
  return {
    eventId: Number(event.id),
    type: critical ? 'crise_reputacional' : 'monitoramento',
    priority: event.severity === 'critical' ? 'critica' : event.severity === 'warning' ? 'alta' : 'media',
    severity: event.severity,
    reason: event.details,
    evidence: [event.title, event.details],
    recommendation: critical
      ? 'Investigar imediatamente a origem do sinal e preparar um plano de resposta antes de qualquer ação externa.'
      : 'Acompanhar a evolução do sinal e preparar uma intervenção caso ele persista ou se agrave.',
    requiresApproval: true,
    status: 'pending',
  };
}

export async function createDecisionsForEvents(empresaId: string, events: any[]) {
  await ensureSchema();
  const db = getDb();
  const created = [];
  for (const event of events || []) {
    const exists = await db.get('SELECT id FROM dot_decisions WHERE empresa_id = ? AND event_id = ? LIMIT 1', [empresaId, event.id]);
    if (exists) continue;
    const d = classify(event);
    const r = await db.run(
      'INSERT INTO dot_decisions (empresa_id,event_id,type,priority,severity,reason,evidence_json,recommendation,requires_approval,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [empresaId,d.eventId,d.type,d.priority,d.severity,d.reason,JSON.stringify(d.evidence),d.recommendation,d.requiresApproval ? 1 : 0,d.status,new Date().toISOString()]
    );
    created.push({ ...d, id: r.lastID });
  }
  return created;
}

export async function updateDotDecision(empresaId: string, id: number, status: 'prepared' | 'approved' | 'rejected') {
  await ensureSchema();
  const db = getDb();
  const row = await db.get('SELECT id FROM dot_decisions WHERE id = ? AND empresa_id = ? LIMIT 1', [id, empresaId]);
  if (!row) return null;
  await db.run('UPDATE dot_decisions SET status = ? WHERE id = ? AND empresa_id = ?', [status, id, empresaId]);
  return { id, status };
}

export async function listDotDecisions(empresaId: string) {
  await ensureSchema();
  const rows = await getDb().all('SELECT * FROM dot_decisions WHERE empresa_id = ? ORDER BY id DESC LIMIT 50',[empresaId]);
  return (rows || []).map((r:any) => ({...r, evidence: JSON.parse(r.evidence_json || '[]'), requiresApproval: Boolean(r.requires_approval), createdAt: r.created_at}));
}