import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import type { Database } from 'sqlite';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function secretOk(req: Request) {
  const supplied = String(req.headers['x-filtra-secret'] || req.headers['x-n8n-secret'] || '').trim();
  const expected = String(process.env.N8N_INBOUND_SECRET || process.env.N8N_WEBHOOK_SECRET || '').trim();
  return Boolean(expected && supplied && supplied === expected);
}

async function safeAlter(db: Database, sql: string) {
  try { await db.exec(sql); } catch { /* already exists / engine-specific */ }
}

export async function ensureAcquisitionSchema(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS acquisition_leads (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      company TEXT,
      consent INTEGER NOT NULL DEFAULT 0,
      consent_at TIMESTAMPTZ,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'eligible',
      acquisition_stage TEXT NOT NULL DEFAULT 'consented',
      acquisition_next_at TIMESTAMPTZ,
      acquisition_suppressed INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS acquisition_events (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      source TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      metadata_json TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS acquisition_campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      platform TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS acquisition_content (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      platform TEXT NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      utm_content TEXT,
      metadata_json TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await safeAlter(db, 'CREATE INDEX IF NOT EXISTS idx_acq_leads_eligible ON acquisition_leads(consent, acquisition_suppressed, acquisition_stage)');
  await safeAlter(db, 'CREATE INDEX IF NOT EXISTS idx_acq_events_lead ON acquisition_events(lead_id, occurred_at)');
  await safeAlter(db, 'CREATE INDEX IF NOT EXISTS idx_acq_content_campaign ON acquisition_content(campaign_id, platform)');
}

function jsonBody(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

export function mountAcquisitionRoutes(app: Express) {
  app.post('/api/public/acquisition/consent', async (req: Request, res: Response) => {
    try {
      const db = (await import('../lib/db.js')).getDb();
      await ensureAcquisitionSchema(db);
      const body = jsonBody(req.body);
      const email = String(body.email || '').trim().toLowerCase();
      const company = String(body.company || '').trim().slice(0, 200);
      const source = String(body.source || 'website').trim().slice(0, 120) || 'website';
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
      if (body.consent !== true) return res.status(400).json({ error: 'Consentimento explícito é necessário.' });

      const existing = await db.get('SELECT * FROM acquisition_leads WHERE email = ?', [email]);
      const leadId = String(existing?.id || crypto.randomUUID());
      await db.run(
        `INSERT INTO acquisition_leads
          (id,email,company,consent,consent_at,source,status,acquisition_stage,acquisition_suppressed,updated_at)
         VALUES (?,?,?,1,CURRENT_TIMESTAMP,?,'eligible','consented',0,CURRENT_TIMESTAMP)
         ON CONFLICT(email) DO UPDATE SET
           company=excluded.company,
           consent=1,
           consent_at=CURRENT_TIMESTAMP,
           source=excluded.source,
           status='eligible',
           acquisition_stage=CASE
             WHEN acquisition_leads.acquisition_stage IN ('suppressed','unsubscribed') THEN acquisition_leads.acquisition_stage
             ELSE 'consented'
           END,
           acquisition_suppressed=CASE
             WHEN acquisition_leads.acquisition_stage IN ('suppressed','unsubscribed') THEN 1
             ELSE 0
           END,
           updated_at=CURRENT_TIMESTAMP`,
        [leadId, email, company || null, source]
      );
      await db.run(
        'INSERT INTO acquisition_events (id,lead_id,event_type,source,occurred_at,metadata_json) VALUES (?,?,?, ?,CURRENT_TIMESTAMP,?)',
        [crypto.randomUUID(), leadId, 'consent.granted', source, JSON.stringify({ company, email }).slice(0, 20000)]
      );
      const row = await db.get('SELECT id,email,company,consent,source,acquisition_stage,acquisition_suppressed FROM acquisition_leads WHERE email = ?', [email]);
      return res.status(existing ? 200 : 201).json({ ok: true, lead_id: row.id, lead: row });
    } catch (error: any) {
      console.error('[acquisition] consent:', error?.message || error);
      return res.status(503).json({ error: 'Não foi possível registrar o consentimento agora.' });
    }
  });

  app.get('/api/n8n/acquisition/queue', async (req: Request, res: Response) => {
    if (!secretOk(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = (await import('../lib/db.js')).getDb();
    await ensureAcquisitionSchema(db);
    const rows = await db.all(
      `SELECT id,email,company,source,consent_at,acquisition_stage,acquisition_next_at
       FROM acquisition_leads
       WHERE consent=1 AND acquisition_suppressed=0
         AND status='eligible'
         AND acquisition_stage NOT IN ('suppressed','unsubscribed')
         AND (acquisition_next_at IS NULL OR acquisition_next_at <= CURRENT_TIMESTAMP)
       ORDER BY created_at ASC
       LIMIT 100`
    );
    return res.json({ ok: true, count: rows.length, leads: rows });
  });

  app.post('/api/n8n/acquisition/events', async (req: Request, res: Response) => {
    if (!secretOk(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = (await import('../lib/db.js')).getDb();
    await ensureAcquisitionSchema(db);
    const body = jsonBody(req.body);
    const leadId = String(body.lead_id || '').trim();
    const eventType = String(body.event_type || '').trim();
    const source = String(body.source || 'n8n').trim().slice(0, 120);
    if (!leadId || !eventType) return res.status(400).json({ error: 'lead_id e event_type são obrigatórios.' });
    const eventId = String(body.event_id || crypto.randomUUID()).slice(0, 120);
    await db.run(
      'INSERT INTO acquisition_events (id,lead_id,event_type,source,occurred_at,metadata_json) VALUES (?,?,?, ?,CURRENT_TIMESTAMP,?) ON CONFLICT(id) DO NOTHING',
      [eventId, leadId, eventType, source, JSON.stringify(body.metadata || {}).slice(0, 20000)]
    );
    if (['unsubscribe','suppressed','consent.revoked'].includes(eventType)) {
      await db.run(
        `UPDATE acquisition_leads
         SET consent=CASE WHEN ?='consent.revoked' THEN 0 ELSE consent END,
             status=CASE WHEN ?='unsubscribe' THEN 'unsubscribed' ELSE status END,
             acquisition_stage=CASE WHEN ? IN ('unsubscribe','suppressed','consent.revoked') THEN 'suppressed' ELSE acquisition_stage END,
             acquisition_suppressed=1,
             updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [eventType, eventType, eventType, leadId]
      );
    }
    return res.json({ ok: true, event_id: eventId });
  });

  app.post('/api/n8n/acquisition/campaigns/upsert', async (req: Request, res: Response) => {
    if (!secretOk(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = (await import('../lib/db.js')).getDb();
    await ensureAcquisitionSchema(db);
    const body = jsonBody(req.body);
    const id = String(body.id || '').trim().slice(0, 160);
    const name = String(body.name || '').trim().slice(0, 300);
    if (!id || !name) return res.status(400).json({ error: 'id e name são obrigatórios.' });
    await db.run(
      `INSERT INTO acquisition_campaigns
        (id,name,platform,status,utm_source,utm_medium,utm_campaign,updated_at)
       VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name,platform=excluded.platform,status=excluded.status,
         utm_source=excluded.utm_source,utm_medium=excluded.utm_medium,
         utm_campaign=excluded.utm_campaign,updated_at=CURRENT_TIMESTAMP`,
      [id,name,String(body.platform||'').slice(0,120),String(body.status||'draft').slice(0,40),String(body.utm_source||'').slice(0,120),String(body.utm_medium||'').slice(0,120),String(body.utm_campaign||'').slice(0,160)]
    );
    return res.json({ ok: true, campaign_id: id });
  });

  app.post('/api/n8n/acquisition/content/upsert', async (req: Request, res: Response) => {
    if (!secretOk(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = (await import('../lib/db.js')).getDb();
    await ensureAcquisitionSchema(db);
    const body = jsonBody(req.body);
    const campaignId = String(body.campaign_id || '').trim().slice(0, 160);
    const platform = String(body.platform || '').trim().slice(0, 80);
    const title = String(body.title || '').trim().slice(0, 500);
    const bodyText = String(body.body || '').trim().slice(0, 50000);
    if (!campaignId || !platform || !bodyText) return res.status(400).json({ error: 'campaign_id, platform e body são obrigatórios.' });
    const id = crypto.createHash('sha256').update(JSON.stringify({ campaignId,platform,title,bodyText })).digest('hex').slice(0, 64);
    await db.run(
      `INSERT INTO acquisition_content
        (id,campaign_id,platform,title,body,status,utm_content,metadata_json,updated_at)
       VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title,body=excluded.body,status=excluded.status,
         utm_content=excluded.utm_content,metadata_json=excluded.metadata_json,
         updated_at=CURRENT_TIMESTAMP`,
      [id,campaignId,platform,title,bodyText,String(body.status||'draft').slice(0,40),String(body.utm_content||'').slice(0,120),JSON.stringify(body.metadata||{}).slice(0,20000)]
    );
    return res.json({ ok: true, persisted: true, content_id: id, duplicate: false });
  });

  app.get('/api/n8n/acquisition/health', async (req: Request, res: Response) => {
    if (!secretOk(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = (await import('../lib/db.js')).getDb();
    await ensureAcquisitionSchema(db);
    const row = await db.get(
      `SELECT
        (SELECT COUNT(*) FROM acquisition_leads) AS total_leads,
        (SELECT COUNT(*) FROM acquisition_leads WHERE consent=1 AND acquisition_suppressed=0) AS eligible_leads,
        (SELECT COUNT(*) FROM acquisition_events) AS events,
        (SELECT COUNT(*) FROM acquisition_content) AS content_items`
    );
    return res.json({ ok: true, ...row });
  });
}
