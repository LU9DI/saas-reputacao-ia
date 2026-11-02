/**
 * LGPD: anonimiza WhatsApp antigo — datas em JS (Postgres-safe).
 */
import type { Database } from 'sqlite';
import { requireReviewSchema } from './migrations.js';

const DEFAULT_DAYS = Number(process.env.LGPD_WHATSAPP_RETENTION_DAYS || 90);

/** Verifica (sem DDL) as colunas de tratamento LGPD em reviews. */
export async function ensureReviewTreatmentColumns(db: Database): Promise<void> {
  await requireReviewSchema(db, ['treated_at', 'treated_note', 'client_whatsapp']);
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
