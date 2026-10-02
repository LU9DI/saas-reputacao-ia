import crypto from 'crypto';
import type { Database } from 'sqlite';
import { getDb } from '../lib/db.js';
import { notifyN8n } from '../lib/n8n.js';
import { ativarTrial, type TrialResult } from './trialService.js';

export type LeadInput = {
  nome_empresa: string;
  email: string;
  senha: string;
  google_review_url?: string;
  whatsapp?: string;
  locale?: string;
  signup_ip: string;
  consent: boolean;
  source?: string;
};

export type LeadResult = TrialResult & {
  lead_id: string;
  lead_captured: true;
};

export async function ensureLeadSchema(db: Database = getDb()): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      nome_empresa TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      google_review_url TEXT,
      whatsapp TEXT,
      source TEXT NOT NULL DEFAULT 'website',
      consent INTEGER NOT NULL DEFAULT 0,
      consent_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'captured',
      trial_empresa_id TEXT,
      trial_slug TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_leads_trial_empresa ON leads(trial_empresa_id)');
}

export async function createLead(
  input: LeadInput,
  db: Database = getDb(),
  res?: import('express').Response,
): Promise<LeadResult> {
  const email = input.email.trim().toLowerCase();
  if (!input.consent) throw new Error('Consentimento explícito é necessário.');

  await ensureLeadSchema(db);

  const existing = await db.get('SELECT * FROM leads WHERE lower(email) = lower(?) LIMIT 1', [email]);
  const leadId = String(existing?.id || crypto.randomUUID());

  await db.run(
    `INSERT INTO leads
      (id,nome_empresa,email,google_review_url,whatsapp,source,consent,consent_at,status,updated_at)
     VALUES (?,?,?,?,?,?,1,CURRENT_TIMESTAMP,'captured',CURRENT_TIMESTAMP)
     ON CONFLICT(email) DO UPDATE SET
       nome_empresa=excluded.nome_empresa,
       google_review_url=excluded.google_review_url,
       whatsapp=excluded.whatsapp,
       source=excluded.source,
       consent=1,
       consent_at=CURRENT_TIMESTAMP,
       status='captured',
       updated_at=CURRENT_TIMESTAMP`,
    [
      leadId,
      input.nome_empresa.trim(),
      email,
      input.google_review_url || null,
      input.whatsapp || null,
      (input.source || 'website').slice(0, 120),
    ],
  );

  notifyN8n('lead.capturado', {
    lead_id: leadId,
    nome_empresa: input.nome_empresa.trim(),
    email,
    source: input.source || 'website',
    consent: true,
  });

  try {
    const trial = await ativarTrial(
      {
        nome_empresa: input.nome_empresa,
        email,
        senha: input.senha,
        google_review_url: input.google_review_url,
        whatsapp: input.whatsapp,
        locale: input.locale,
        signup_ip: input.signup_ip,
      },
      db,
      res,
    );

    await db.run(
      `UPDATE leads
          SET status=?, trial_empresa_id=?, trial_slug=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?`,
      [
        trial.verification_required ? 'trial_pending' : 'trial_activated',
        trial.empresa_id || null,
        trial.slug || null,
        leadId,
      ],
    );

    return { ...trial, lead_id: leadId, lead_captured: true };
  } catch (error) {
    await db.run(
      `UPDATE leads SET status='trial_failed', updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [leadId],
    ).catch(() => undefined);
    throw error;
  }
}
