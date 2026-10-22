
import { enviarEmail } from '../lib/mailer.js';
import { syncConsentedAcquisitionLead } from '../services/crmAcquisitionSync.js';
import { sanitizeAcquisitionAttribution, summarizeAcquisitionEvents } from '../services/acquisitionAttribution.js';

function outreachEnabled(): boolean {
  return process.env.ACQUISITION_OUTREACH_ENABLED === 'true';
}

function acquisitionDailyLimit(): number {
  const configured = Number(process.env.ACQUISITION_DAILY_LIMIT || 80);
  return Math.min(80, Math.max(1, Number.isFinite(configured) ? Math.floor(configured) : 80));
}

function acquisitionDelayDays(stage: string): number {
  if (stage === 'consented' || stage === 'diagnosed') return 3;
  if (stage === 'followup_1') return 4;
  return 0;
}

export function acquisitionMessage(stage: string, company: string, appUrl: string) {
  const nome = company || 'sua empresa';
  if (stage === 'followup_1') {
    return {
      subject: 'Filtra.AI — conseguiu testar o diagnóstico de reputação?',
      text: [
        'Olá,',
        '',
        `Passando para saber se você conseguiu testar o Filtra.AI para ${nome}.`,
        'O objetivo é transformar avaliações e feedbacks em sinais práticos para melhorar reputação, visibilidade e aquisição de clientes.',
        '',
        `Teste por 7 dias: ${appUrl}/auditoria-gratuita`,
        '',
        'Se não fizer sentido para você, basta responder este e-mail e não enviaremos novas mensagens.',
        '',
        'Filtra.AI',
      ].join('\n'),
    };
  }
  if (stage === 'followup_2') {
    return {
      subject: 'Filtra.AI — último contato sobre o teste de 7 dias',
      text: [
        'Olá,',
        '',
        `Este é nosso último contato automático sobre o Filtra.AI para ${nome}.`,
        'Se quiser avaliar como seus clientes percebem a empresa e encontrar oportunidades nas avaliações, o teste de 7 dias continua disponível.',
        '',
        `Acessar: ${appUrl}/auditoria-gratuita`,
        '',
        'Depois deste contato, não enviaremos novas mensagens automáticas.',
        '',
        'Filtra.AI',
      ].join('\n'),
    };
  }
  return {
    subject: 'Filtra.AI — transforme feedback em crescimento',
    text: [
      'Olá,',
      '',
      `Você demonstrou interesse em avaliar a reputação de ${nome} com o Filtra.AI.`,
      'A plataforma organiza avaliações e feedbacks para ajudar a identificar oportunidades de melhoria, reputação e aquisição.',
      '',
      `Teste grátis por 7 dias: ${appUrl}/auditoria-gratuita`,
      '',
      'Se não quiser receber novas mensagens, basta responder este e-mail.',
      '',
      'Filtra.AI',
    ].join('\n'),
  };
}

export async function processAcquisitionBatch(options: { limit: number; source: string }) {
  // Fail closed before loading the database or touching the queue/mailer.
  if (!outreachEnabled()) {
    return { enabled: false, reason: 'ACQUISITION_OUTREACH_ENABLED is not true', attempted: 0, sent: 0, failed: 0, skipped: 0, daily_limit: acquisitionDailyLimit(), sent_today: 0 };
  }
  const db = (await import('../lib/db.js')).getDb();
  await ensureAcquisitionSchema(db);

  const dailyLimit = acquisitionDailyLimit();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const sentRow = await db.get(
    `SELECT COUNT(*) AS count
     FROM acquisition_events
     WHERE event_type='outreach.sent' AND occurred_at >= ?`,
    [startOfDay.toISOString()]
  );
  const alreadySent = Number(sentRow?.count || 0);
  const remaining = Math.max(0, dailyLimit - alreadySent);
  const target = Math.min(Math.max(1, options.limit), remaining);
  if (target <= 0) {
    return { attempted: 0, sent: 0, failed: 0, skipped: 0, daily_limit: dailyLimit, sent_today: alreadySent };
  }

  const nowIso = new Date().toISOString();
  const queue = await db.all(
    `SELECT id,email,company,source,acquisition_stage
     FROM acquisition_leads
     WHERE consent=1 AND acquisition_suppressed=0 AND status='eligible'
       AND (
         acquisition_stage IN ('consented','diagnosed','followup_1','followup_2')
         OR (acquisition_stage='sending' AND (acquisition_locked_until IS NULL OR acquisition_locked_until <= ?))
       )
       AND (acquisition_next_at IS NULL OR acquisition_next_at <= ?)
     ORDER BY created_at ASC
     LIMIT ${target}`,
    [nowIso, nowIso]
  );

  const appUrl = (process.env.APP_URL || process.env.FRONTEND_URL || 'https://filtraai.com').replace(/\/$/, '');
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const lead of queue || []) {
    const token = crypto.randomUUID();
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const claimed = await db.run(
      `UPDATE acquisition_leads
       SET acquisition_stage='sending', acquisition_lock_token=?, acquisition_locked_until=?,
           acquisition_last_error=NULL, updated_at=CURRENT_TIMESTAMP
       WHERE id=? AND consent=1 AND acquisition_suppressed=0 AND status='eligible'
         AND (
           acquisition_stage IN ('consented','diagnosed','followup_1','followup_2')
           OR (acquisition_stage='sending' AND (acquisition_locked_until IS NULL OR acquisition_locked_until <= ?))
         )
         AND (acquisition_next_at IS NULL OR acquisition_next_at <= ?)`,
      [token, lockedUntil, lead.id, nowIso, nowIso]
    );
    if (!claimed || Number(claimed.changes || 0) < 1) {
      skipped++;
      continue;
    }

    const stage = String(lead.acquisition_stage || 'consented');
    const message = acquisitionMessage(stage, String(lead.company || ''), appUrl);
    const result = await enviarEmail({ to: lead.email, subject: message.subject, text: message.text });

    if (result.ok) {
      const nextDays = acquisitionDelayDays(stage);
      const nextAt = nextDays > 0 ? new Date(Date.now() + nextDays * 86400000).toISOString() : null;
      const nextStage = stage === 'consented' || stage === 'diagnosed'
        ? 'followup_1'
        : stage === 'followup_1'
          ? 'followup_2'
          : 'completed';

      await db.run(
        `UPDATE acquisition_leads
         SET acquisition_stage=?, acquisition_next_at=?, acquisition_sent_at=?, acquisition_lock_token=NULL,
             acquisition_locked_until=NULL, acquisition_last_error=NULL, updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND acquisition_lock_token=?`,
        [nextStage, nextAt, new Date().toISOString(), lead.id, token]
      );
      await db.run(
        `INSERT INTO acquisition_events (id,lead_id,event_type,source,occurred_at,metadata_json)
         VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`,
        [crypto.randomUUID(), lead.id, 'outreach.sent', options.source, new Date().toISOString(),
          JSON.stringify({ stage, message_id: result.messageId || null, mode: result.mode })]
      );
      sent++;
    } else {
      const retryAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      await db.run(
        `UPDATE acquisition_leads
         SET acquisition_stage=?, acquisition_next_at=?, acquisition_lock_token=NULL,
             acquisition_locked_until=NULL, acquisition_last_error=?, updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND acquisition_lock_token=?`,
        [stage, retryAt, String(result.error || 'Falha no envio').slice(0, 500), lead.id, token]
      );
      await db.run(
        `INSERT INTO acquisition_events (id,lead_id,event_type,source,occurred_at,metadata_json)
         VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`,
        [crypto.randomUUID(), lead.id, 'outreach.failed', options.source, new Date().toISOString(),
          JSON.stringify({ stage, error: result.error || 'Falha no envio', mode: result.mode })]
      );
      failed++;
    }
  }

  return { attempted: (queue || []).length, sent, failed, skipped, daily_limit: dailyLimit, sent_today: alreadySent + sent };
}

export function startAcquisitionScheduler() {
  if (!outreachEnabled()) {
    console.log('📨 Acquisition scheduler: OFF (defina ACQUISITION_OUTREACH_ENABLED=true para habilitar envios)');
    return;
  }
  if (process.env.ACQUISITION_SCHEDULER !== '1') {
    console.log('📨 Acquisition scheduler: OFF (defina ACQUISITION_SCHEDULER=1 para ligar)');
    return;
  }
  const intervalMs = Math.max(5, Number(process.env.ACQUISITION_INTERVAL_MINUTES || 15)) * 60_000;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await processAcquisitionBatch({ limit: 80, source: 'acquisition-scheduler' });
      console.log(`📨 Acquisition scheduler: attempted=${result.attempted} sent=${result.sent} failed=${result.failed} sent_today=${result.sent_today}/${result.daily_limit}`);
    } catch (e: any) {
      console.warn('📨 Acquisition scheduler:', e?.message || e);
    } finally {
      running = false;
    }
  };
  setTimeout(run, 30_000).unref();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  console.log(`📨 Acquisition scheduler: ON a cada ${Math.round(intervalMs / 60000)} min, limite diário ${acquisitionDailyLimit()}`);
}

import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import type { Database } from 'sqlite';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function secretOk(req: Request) {
  const supplied = String(req.headers['x-filtra-secret'] || req.headers['x-n8n-secret'] || '').trim();
  const expected = String(process.env.N8N_INBOUND_SECRET || process.env.N8N_WEBHOOK_SECRET || '').trim();
  if (!expected || !supplied) return false;
  const suppliedBytes = Buffer.from(supplied, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  if (suppliedBytes.length !== expectedBytes.length) return false;
  return crypto.timingSafeEqual(suppliedBytes, expectedBytes);
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
      acquisition_lock_token TEXT,
      acquisition_locked_until TIMESTAMPTZ,
      acquisition_sent_at TIMESTAMPTZ,
      acquisition_last_error TEXT,
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
  await safeAlter(db, 'ALTER TABLE acquisition_leads ADD COLUMN acquisition_lock_token TEXT');
  await safeAlter(db, 'ALTER TABLE acquisition_leads ADD COLUMN acquisition_locked_until TIMESTAMPTZ');
  await safeAlter(db, 'ALTER TABLE acquisition_leads ADD COLUMN acquisition_sent_at TIMESTAMPTZ');
  await safeAlter(db, 'ALTER TABLE acquisition_leads ADD COLUMN acquisition_last_error TEXT');
  await safeAlter(db, 'CREATE INDEX IF NOT EXISTS idx_acq_leads_eligible ON acquisition_leads(consent, acquisition_suppressed, acquisition_stage)');
  await safeAlter(db, 'CREATE INDEX IF NOT EXISTS idx_acq_leads_lock ON acquisition_leads(acquisition_locked_until)');
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
      const attribution = sanitizeAcquisitionAttribution(body.attribution);
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
           consent=CASE
             WHEN acquisition_leads.acquisition_stage IN ('suppressed','unsubscribed') THEN acquisition_leads.consent
             ELSE 1
           END,
           consent_at=CASE
             WHEN acquisition_leads.acquisition_stage IN ('suppressed','unsubscribed') THEN acquisition_leads.consent_at
             ELSE CURRENT_TIMESTAMP
           END,
           source=excluded.source,
           status=CASE
             WHEN acquisition_leads.acquisition_stage IN ('suppressed','unsubscribed') THEN acquisition_leads.status
             ELSE 'eligible'
           END,
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
      const row = await db.get('SELECT id,email,company,consent,consent_at,source,acquisition_stage,acquisition_suppressed FROM acquisition_leads WHERE email = ?', [email]);
      const suppressed = Number(row?.acquisition_suppressed || 0) === 1
        || ['suppressed', 'unsubscribed'].includes(String(row?.acquisition_stage || ''));

      // A generic form submission must not silently reverse an unsubscribe or
      // re-enroll a suppressed contact in a marketing provider.
      if (suppressed) {
        await db.run(
          'INSERT INTO acquisition_events (id,lead_id,event_type,source,occurred_at,metadata_json) VALUES (?,?,?, ?,CURRENT_TIMESTAMP,?)',
          [crypto.randomUUID(), leadId, 'consent.received_suppressed', source, JSON.stringify({ attribution, crm_sync_skipped: true }).slice(0, 20000)]
        );
        return res.status(200).json({
          ok: true,
          lead_id: row.id,
          lead: row,
          acquisition: { eligible_for_followup: false },
          crm_sync: { ok: true, skipped: true, reason: 'suppressed_contact' },
        });
      }

      await db.run(
        'INSERT INTO acquisition_events (id,lead_id,event_type,source,occurred_at,metadata_json) VALUES (?,?,?, ?,CURRENT_TIMESTAMP,?)',
        [crypto.randomUUID(), leadId, 'consent.granted', source, JSON.stringify({ attribution }).slice(0, 20000)]
      );
      const crmSync = await syncConsentedAcquisitionLead(row);
      await db.run(
        'INSERT INTO acquisition_events (id,lead_id,event_type,source,occurred_at,metadata_json) VALUES (?,?,?, ?,CURRENT_TIMESTAMP,?)',
        [crypto.randomUUID(), leadId, crmSync.ok ? 'crm.sync.completed' : 'crm.sync.partial', source, JSON.stringify(crmSync).slice(0, 20000)]
      );
      return res.status(existing ? 200 : 201).json({ ok: true, lead_id: row.id, lead: row, acquisition: { eligible_for_followup: true }, crm_sync: crmSync });
    } catch (error: any) {
      console.error('[acquisition] consent:', error?.message || error);
      return res.status(503).json({ error: 'Não foi possível registrar o consentimento agora.' });
    }
  });

  app.get('/api/n8n/acquisition/queue', async (req: Request, res: Response) => {
    if (!secretOk(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = (await import('../lib/db.js')).getDb();
    await ensureAcquisitionSchema(db);
    const requestedLimit = Number(req.query.limit || 100);
    const limit = Math.min(100, Math.max(1, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 100));
    const nowIso = new Date().toISOString();
    const rows = await db.all(
      `SELECT id,email,company,source,consent_at,acquisition_stage,acquisition_next_at
       FROM acquisition_leads
       WHERE consent=1 AND acquisition_suppressed=0
         AND status='eligible'
         AND (
           acquisition_stage IN ('consented','diagnosed','followup_1','followup_2')
           OR (acquisition_stage='sending' AND (acquisition_locked_until IS NULL OR acquisition_locked_until <= ?))
         )
         AND (acquisition_next_at IS NULL OR acquisition_next_at <= ?)
       ORDER BY created_at ASC
       LIMIT ${limit}`,
      [nowIso, nowIso]
    );
    return res.json({ ok: true, count: rows.length, leads: rows });
  });

  app.post('/api/n8n/acquisition/report', async (req: Request, res: Response) => {
    if (!secretOk(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const { getDb, dbEngine } = await import('../lib/db.js');
      const db = getDb();
      await ensureAcquisitionSchema(db);
      const requestedDays = Number(req.body?.days || req.query.days || 30);
      const days = Math.min(90, Math.max(1, Number.isFinite(requestedDays) ? Math.floor(requestedDays) : 30));
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      // SQLite needs datetime() normalization for mixed timestamp formats.
      // Production Postgres compares native TIMESTAMPTZ values directly.
      const isPostgres = dbEngine() === 'postgres';
      const rows = await db.all(
        isPostgres
          ? `SELECT lead_id,event_type,source,occurred_at,metadata_json
             FROM acquisition_events
             WHERE event_type IN ('consent.granted','diagnostic.completed')
               AND occurred_at >= ?
             ORDER BY occurred_at DESC
             LIMIT 10001`
          : `SELECT lead_id,event_type,source,occurred_at,metadata_json
             FROM acquisition_events
             WHERE event_type IN ('consent.granted','diagnostic.completed')
               AND datetime(occurred_at) >= datetime(?)
             ORDER BY datetime(occurred_at) DESC
             LIMIT 10001`,
        [cutoff]
      );
      if ((rows || []).length > 10000) {
        return res.status(422).json({
          error: 'O período contém mais de 10.000 eventos. Reduza o intervalo para obter um relatório completo.',
          max_events: 10000,
        });
      }
      return res.json({
        ok: true,
        period_days: days,
        generated_at: new Date().toISOString(),
        ...summarizeAcquisitionEvents(rows || []),
      });
    } catch (error: any) {
      console.error('[acquisition] report:', error?.message || error);
      return res.status(500).json({ error: 'Não foi possível gerar o relatório de aquisição.' });
    }
  });

  app.post('/api/n8n/acquisition/send', async (req: Request, res: Response) => {
    if (!secretOk(req)) return res.status(401).json({ error: 'Unauthorized' });
    if (!outreachEnabled()) {
      return res.status(200).json({ ok: true, enabled: false, reason: 'ACQUISITION_OUTREACH_ENABLED is not true', attempted: 0, sent: 0, failed: 0, skipped: 0 });
    }
    try {
      const result = await processAcquisitionBatch({
        limit: Math.min(80, Math.max(1, Number(req.body?.limit || req.query.limit || 80))),
        source: String(req.body?.source || 'acquisition-worker').slice(0, 120),
      });
      return res.json({ ok: true, ...result });
    } catch (error: any) {
      console.error('[acquisition] send:', error?.message || error);
      return res.status(500).json({ error: 'Não foi possível processar a aquisição agora.' });
    }
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
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const row = await db.get(
      `SELECT
        (SELECT COUNT(*) FROM acquisition_leads) AS total_leads,
        (SELECT COUNT(*) FROM acquisition_leads WHERE consent=1 AND acquisition_suppressed=0) AS eligible_leads,
        (SELECT COUNT(*) FROM acquisition_events) AS events,
        (SELECT COUNT(*) FROM acquisition_events WHERE event_type='outreach.sent' AND occurred_at >= ?) AS sent_today,
        (SELECT COUNT(*) FROM acquisition_content) AS content_items`,
      [startOfDay.toISOString()]
    );
    return res.json({ ok: true, daily_limit: acquisitionDailyLimit(), ...row });
  });
}


