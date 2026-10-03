import { getDb } from '../lib/db.js';
import { getDotPreferences } from './dotPreferences.js';
import { runDotMonitor } from './dotMonitor.js';
import { monitorDueDotFollowUps } from './dotFollowUp.js';

let timer: NodeJS.Timeout | null = null;
let running = false;

async function ensureSchedulerColumn() {
  const db = getDb();
  const cols = (await db.all('PRAGMA table_info(empresas)')).map((c: any) => c.name);
  if (!cols.includes('dot_monitor_last_at')) await db.exec('ALTER TABLE empresas ADD COLUMN dot_monitor_last_at TEXT');
}

export async function runDueDotMonitors() {
  if (running) return { ok: true, skipped: true, reason: 'already_running' };
  running = true;
  try {
    await ensureSchedulerColumn();
    const db = getDb();
    const companies = await db.all(
      `SELECT id, plan, status, dot_monitor_last_at FROM empresas
       WHERE status IN ('ativo', 'trial')
         AND LOWER(IFNULL(plan, '')) IN ('rei', 'corporativo', 'corp')`
    );
    let processed = 0;
    let skipped = 0;
    const results = [];
    const followUpResults = await monitorDueDotFollowUps();
    for (const company of companies || []) {
      const p = await getDotPreferences(company.id);
      const last = company.dot_monitor_last_at ? new Date(company.dot_monitor_last_at).getTime() : 0;
      const due = !last || Date.now() - last >= p.checkIntervalMinutes * 60_000;
      if (!due) { skipped++; continue; }
      try {
        const result = await runDotMonitor(company.id);
        await db.run('UPDATE empresas SET dot_monitor_last_at = ? WHERE id = ?', [new Date().toISOString(), company.id]);
        processed++;
        results.push({ empresa_id: company.id, ...result });
      } catch (error: any) {
        results.push({ empresa_id: company.id, ok: false, error: String(error?.message || error) });
      }
    }
    return { ok: true, processed, skipped, results, followups: followUpResults };
  } finally {
    running = false;
  }
}

export function startDotMonitorScheduler() {
  if (timer) return;
  const interval = Math.max(60_000, Number(process.env.FILTRA_DOT_MONITOR_TICK_MS || 300_000));
  timer = setInterval(() => {
    void runDueDotMonitors().catch((error) => console.warn('Dot scheduler:', error?.message || error));
  }, interval);
  timer.unref();
  console.log(`🤖 Filtra Dot monitor ativo — tick ${Math.round(interval / 1000)}s`);
}