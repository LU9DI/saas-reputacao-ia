/**
 * LGPD: anonimiza WhatsApp antigo — datas em JS (Postgres-safe).
 */
import type { Database } from 'sqlite';

const DEFAULT_DAYS = Number(process.env.LGPD_WHATSAPP_RETENTION_DAYS || 90);

/** Lista colunas de `reviews` sem depender só de PRAGMA (SQLite). */
async function listReviewColumns(db: Database): Promise<string[]> {
  try {
    const rows = await db.all(`PRAGMA table_info(reviews)`);
    if (Array.isArray(rows) && rows.length) {
      return rows.map((c: any) => String(c.name));
    }
  } catch {
    /* Postgres ou adapter */
  }
  try {
    const rows = await db.all(
      `SELECT column_name as name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'reviews'`
    );
    return (rows || []).map((c: any) => String(c.name || c.column_name));
  } catch {
    return [];
  }
}

export async function ensureReviewTreatmentColumns(db: Database): Promise<void> {
  const cols = await listReviewColumns(db);
  for (const [name, def] of [
    ['treated_at', 'TEXT'],
    ['treated_note', 'TEXT'],
    ['client_whatsapp', 'TEXT'],
  ] as const) {
    if (cols.length && cols.includes(name)) continue;
    try {
      await db.exec(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ${name} ${def}`);
    } catch {
      try {
        await db.exec(`ALTER TABLE reviews ADD COLUMN ${name} ${def}`);
      } catch {
        /* */
      }
    }
  }
}

export async function anonymizeOldClientWhatsapp(
  db: Database,
  opts?: { retentionDays?: number; limit?: number }
): Promise<{ anonymized: number }> {
  await ensureReviewTreatmentColumns(db);
  const days = opts?.retentionDays ?? DEFAULT_DAYS;
  const limit = opts?.limit ?? 500;
  const treatedCutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  const createdCutoff = new Date(Date.now() - days * 86400000).toISOString();

  let rows: any[] = [];
  try {
    rows = await db.all(
      `SELECT id FROM reviews
       WHERE client_whatsapp IS NOT NULL
         AND TRIM(client_whatsapp) != ''
         AND client_whatsapp != '[anonimizado]'
         AND (
           (treated_at IS NOT NULL AND treated_at <= ?)
           OR (createdAt IS NOT NULL AND createdAt <= ?)
         )
       LIMIT ?`,
      [treatedCutoff, createdCutoff, limit]
    );
  } catch (e: any) {
    console.warn('LGPD sweep query:', e?.message || e);
    return { anonymized: 0 };
  }

  let anonymized = 0;
  for (const r of rows || []) {
    try {
      await db.run(`UPDATE reviews SET client_whatsapp = '[anonimizado]' WHERE id = ?`, [r.id]);
      anonymized += 1;
    } catch {
      /* */
    }
  }
  return { anonymized };
}
