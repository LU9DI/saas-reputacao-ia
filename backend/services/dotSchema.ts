import { ensureDotAccessSchema } from './dotAccessControl.js';
import { ensureDotActionAuditSchema } from './dotActionAudit.js';
import { getDotPreferences } from './dotPreferences.js';
import { getDb } from '../lib/db.js';

async function ensureDotPreferencesColumn() {
  // Calling getDotPreferences performs the portable ALTER-if-missing migration.
  // Use a real company row when available; the column migration itself does not
  // depend on the company id.
  const db = getDb();
  const row = await db.get('SELECT id FROM empresas LIMIT 1');
  if (row?.id) {
    await getDotPreferences(String(row.id));
    return;
  }
  try {
    await db.exec('ALTER TABLE empresas ADD COLUMN dot_preferences_json TEXT');
  } catch (error: any) {
    const message = String(error?.message || error).toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) throw error;
  }
}

export async function ensureDotSchema() {
  const db = getDb();

  await ensureDotAccessSchema();
  await ensureDotActionAuditSchema();

  await db.exec(`CREATE TABLE IF NOT EXISTS dot_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT NOT NULL,
    acknowledged_at TEXT,
    source_followup_id INTEGER
  )`);
  try { await db.exec('ALTER TABLE dot_events ADD COLUMN source_followup_id INTEGER'); } catch (error: any) {
    const message = String(error?.message || error).toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) throw error;
  }
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_events_empresa_created ON dot_events(empresa_id, created_at)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_events_followup ON dot_events(empresa_id, source_followup_id)');

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
    options_json TEXT NOT NULL DEFAULT '[]',
    requires_approval INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  )`);
  try { await db.exec("ALTER TABLE dot_decisions ADD COLUMN options_json TEXT NOT NULL DEFAULT '[]'"); } catch (error: any) {
    const message = String(error?.message || error).toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) throw error;
  }
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_decisions_empresa_status ON dot_decisions(empresa_id, status, created_at)');

  await db.exec(`CREATE TABLE IF NOT EXISTS dot_action_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    decision_id INTEGER NOT NULL,
    option_id TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'prepared',
    approved_at TEXT,
    executed_at TEXT,
    error TEXT,
    created_at TEXT NOT NULL
  )`);
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_action_queue_decision_option ON dot_action_queue(empresa_id, decision_id, option_id)');
  await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_action_queue_one_active_decision ON dot_action_queue(empresa_id, decision_id) WHERE status IN ('prepared','approved','executing')");

  await db.exec(`CREATE TABLE IF NOT EXISTS dot_internal_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    decision_id INTEGER NOT NULL,
    action_id INTEGER NOT NULL,
    event_id INTEGER,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    summary TEXT NOT NULL,
    next_step TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_internal_cases_action ON dot_internal_cases(empresa_id, action_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_internal_cases_empresa_status ON dot_internal_cases(empresa_id, status, updated_at)');

  await db.exec(`CREATE TABLE IF NOT EXISTS dot_followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    decision_id INTEGER NOT NULL,
    action_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    due_at TEXT NOT NULL,
    baseline_json TEXT NOT NULL,
    outcome TEXT,
    result_json TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL
  )`);
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_followups_action ON dot_followups(empresa_id, action_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_followups_empresa_status ON dot_followups(empresa_id, status, due_at)');

  await db.exec(`CREATE TABLE IF NOT EXISTS dot_tool_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    allowed INTEGER NOT NULL,
    actor_type TEXT NOT NULL,
    actor_user_id TEXT,
    input_json TEXT NOT NULL DEFAULT '{}',
    result_json TEXT,
    error TEXT,
    created_at TEXT NOT NULL
  )`);
  try { await db.exec('ALTER TABLE dot_tool_audit ADD COLUMN actor_user_id TEXT'); } catch (error: any) {
    const message = String(error?.message || error).toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) throw error;
  }
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_tool_audit_empresa ON dot_tool_audit(empresa_id, created_at)');

  await ensureDotPreferencesColumn();
}
