/**
 * Trial 7 dias — identificação só por e-mail; trava por IP.
 * Sem CNPJ / Tax ID no fluxo de ativação.
 */
import crypto from 'crypto';
import type { Database } from 'sqlite';
import type { Response } from 'express';
import { getDb, slugify, slugUnico } from '../lib/db.js';
import { createUsuarioForEmpresa } from '../passwordResetRoutes.js';
import { normalizarWhatsapp } from '../lib/whatsapp.js';
import { notificarTrialAtivado, notificarTrialVerificacao } from '../lib/notifications.js';
import { setAuthCookie, signAccessToken } from '../lib/auth.js';
import { notifyN8n } from '../lib/n8n.js';

const APP_URL = (process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(
  /\/$/,
  ''
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type TrialInput = {
  nome_empresa: string;
  email: string;
  senha: string;
  google_review_url?: string;
  whatsapp?: string;
  locale?: string;
  /** IP do cliente (obrigatório para a trava de 1 trial por IP). */
  signup_ip?: string;
};

export type TrialResult = {
  success: true;
  empresa_id: string;
  slug: string;
  link_acesso?: string;
  link_painel?: string;
  expira_em?: string;
  verification_required?: boolean;
  message?: string;
  token?: string;
  tokenPayload?: {
    id: string;
    nome_funcionario: string;
    empresa_id: string;
  };
};

export class TrialConflictError extends Error {
  status = 409;
  constructor(message = 'Este e-mail ou este IP já utilizou o período de testes.') {
    super(message);
    this.name = 'TrialConflictError';
  }
}

export class TrialValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'TrialValidationError';
  }
}

function isUniqueViolation(e: any): boolean {
  const code = String(e?.code || '');
  const msg = String(e?.message || e || '');
  return (
    code === '23505' ||
    code === 'SQLITE_CONSTRAINT' ||
    /unique|duplicate|constraint/i.test(msg)
  );
}

/** Identificador interno único derivado do e-mail (coluna cnpj no banco). */
function syntheticIdFromEmail(email: string): string {
  const h = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 14);
  return `em${h}`;
}

function normalizeIp(raw: string | undefined | null): string {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (!s || s === '::1' || s === '127.0.0.1' || s === 'unknown') return s;
  // IPv6 mapped IPv4
  if (s.startsWith('::ffff:')) return s.slice(7);
  return s.slice(0, 64);
}

async function ensureSignupIpColumn(db: Database): Promise<void> {
  try {
    const cols = (await db.all(`PRAGMA table_info(empresas)`)).map((c: any) => String(c.name));
    if (!cols.includes('signup_ip')) {
      await db.exec(`ALTER TABLE empresas ADD COLUMN signup_ip TEXT`);
    }
  } catch {
    try {
      await db.exec(`ALTER TABLE empresas ADD COLUMN signup_ip TEXT`);
    } catch {
      /* coluna já existe ou Postgres sem pragma */
    }
  }
  try {
    await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_signup_ip_unique ON empresas(signup_ip)`);
  } catch {
    try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_empresas_signup_ip ON empresas(signup_ip)`); } catch {}
  }
  try {
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_empresas_signup_ip ON empresas(signup_ip)`);
  } catch {
    /* ok */
  }
}

export async function ativarTrial(
  input: TrialInput,
  db: Database = getDb(),
  res?: Response
): Promise<TrialResult> {
  const nome = String(input.nome_empresa || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const senha = String(input.senha || '');
  const googleReviewUrl = input.google_review_url ? String(input.google_review_url) : '';
  const wpp = normalizarWhatsapp(input.whatsapp || null);
  const signupIp = normalizeIp(input.signup_ip);

  if (!nome || nome.length < 2) {
    throw new TrialValidationError('Nome da empresa inválido.');
  }
  if (!EMAIL_RE.test(email)) {
    throw new TrialValidationError('E-mail inválido.');
  }
  if (!signupIp || signupIp === 'unknown') {
    throw new TrialValidationError('Não foi possível identificar a conexão. Tente novamente.');
  }

  if (input.whatsapp && String(input.whatsapp).trim() && !wpp) {
    throw new TrialValidationError(
      'WhatsApp inválido. Use DDD + número (ex: 11999998888) ou código do país.'
    );
  }

  await ensureSignupIpColumn(db);

  // 1 trial por e-mail
  const emailUser = await db.get(`SELECT id FROM usuarios WHERE lower(email) = lower(?) LIMIT 1`, [
    email,
  ]);
  if (emailUser) {
    throw new TrialConflictError('Este e-mail já utilizou o período de testes.');
  }

  // 1 trial por IP
  const ipUsed = await db.get(
    `SELECT id FROM empresas WHERE signup_ip = ? LIMIT 1`,
    [signupIp]
  );
  if (ipUsed) {
    throw new TrialConflictError('Este dispositivo/rede já utilizou o período de testes.');
  }

  const syntheticId = syntheticIdFromEmail(email);
  const existente = await db.get(`SELECT id FROM empresas WHERE cnpj = ?`, [syntheticId]);
  if (existente) {
    throw new TrialConflictError('Este e-mail já utilizou o período de testes.');
  }

  const id = crypto.randomUUID();
  const slug = await slugUnico(slugify(nome) || 'empresa');
  const criadoEm = new Date().toISOString();
  // O relógio dos 7 dias só começa após a confirmação do e-mail.
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
  const verificationExpira = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  try {
    await db.run(
      `INSERT INTO empresas (
         id, cnpj, nome_empresa, slug, google_review_url, whatsapp_suporte,
         status, plan, criado_em, expira_em, signup_ip
       ) VALUES (?, ?, ?, ?, ?, ?, 'trial_pending', 'trial', ?, ?, ?)`,
      [id, syntheticId, nome, slug, googleReviewUrl || null, wpp, criadoEm, expiraEm, signupIp]
    );
  } catch (e: any) {
    console.error('[trial] insert empresa:', e?.code, e?.message || e);
    if (isUniqueViolation(e)) throw new TrialConflictError();
    // Fallback sem coluna signup_ip (schema antigo)
    try {
      await db.run(
        `INSERT INTO empresas (id, cnpj, nome_empresa, slug, status, plan, criado_em, expira_em)
         VALUES (?, ?, ?, ?, 'trial', 'trial', ?, ?)`,
        [id, syntheticId, nome, slug, criadoEm, expiraEm]
      );
      try {
        await db.run(`UPDATE empresas SET signup_ip = ? WHERE id = ?`, [signupIp, id]);
      } catch {
        /* */
      }
    } catch (e2: any) {
      if (isUniqueViolation(e2)) throw new TrialConflictError();
      throw new TrialValidationError(
        `Falha ao criar empresa: ${String(e2?.message || e?.message || e2).slice(0, 200)}`
      );
    }
  }

  let usuarioId: string;
  try {
    const u = await createUsuarioForEmpresa(db, {
      empresaId: id,
      cnpj: syntheticId,
      nome,
      email,
      senha,
    });
    usuarioId = u.id;
  } catch (e: any) {
    console.error('[trial] create usuario:', e?.message || e);
    try {
      await db.run('DELETE FROM empresas WHERE id = ?', [id]);
    } catch {
      /* */
    }
    throw new TrialValidationError(e?.message || 'Falha ao criar usuário.');
  }

  const usuario =
    (await db.get(
      `SELECT id, nome_funcionario, empresa_id FROM usuarios WHERE email = ? LIMIT 1`,
      [email]
    )) ||
    (await db.get(
      `SELECT id, nome_funcionario, empresa_id FROM usuarios WHERE empresa_id = ? LIMIT 1`,
      [id]
    )) ||
    (await db.get(`SELECT id, nome_funcionario, empresa_id FROM usuarios WHERE id = ?`, [
      usuarioId,
    ]));

  await db.exec(`CREATE TABLE IF NOT EXISTS trial_email_verifications (id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL, token_hash TEXT NOT NULL, expira_em TIMESTAMPTZ NOT NULL, usado INTEGER DEFAULT 0, criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)`);
  try { await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_verification_token ON trial_email_verifications(token_hash)`); } catch {}
  await db.run(
    `INSERT INTO trial_email_verifications (id, empresa_id, token_hash, expira_em, usado) VALUES (?, ?, ?, ?, 0)`,
    [crypto.randomUUID(), id, verificationHash, verificationExpira]
  );
  const verificationUrl = `${APP_URL}/teste/verificar?token=${encodeURIComponent(verificationToken)}`;
  await notificarTrialVerificacao({
    email,
    nomeEmpresa: nome,
    verificationUrl,
    locale: input.locale,
  }).catch((e) => console.warn('[trial] e-mail verificação:', e?.message || e));

  notifyN8n('trial.verificacao_pendente', {
    empresa_id: id,
    slug,
    nome_empresa: nome,
    email,
    locale: input.locale || 'pt-BR',
    signup_ip: signupIp,
  });

  return {
    success: true,
    empresa_id: id,
    slug,
    verification_required: true,
    message: 'Enviamos um link de confirmação para o seu e-mail. Confirme o endereço para ativar os 7 dias grátis.',
  };
}

export async function verificarTrialEmail(
  token: string,
  db: Database = getDb(),
  res?: Response
): Promise<TrialResult> {
  const raw = String(token || '').trim();
  if (raw.length < 40) throw new TrialValidationError('Link de confirmação inválido.');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const row = await db.get(
    `SELECT v.id AS verification_id, v.empresa_id, v.expira_em AS verification_expira, v.usado,
            e.slug, e.nome_empresa, u.id AS usuario_id, u.nome_funcionario, u.email
       FROM trial_email_verifications v
       JOIN empresas e ON e.id = v.empresa_id
       JOIN usuarios u ON u.empresa_id = e.id
      WHERE v.token_hash = ? AND v.usado = 0
      LIMIT 1`,
    [hash]
  );
  if (!row) throw new TrialValidationError('Link inválido ou já utilizado.');
  if (new Date(row.verification_expira).getTime() < Date.now()) {
    await db.run('UPDATE trial_email_verifications SET usado = 1 WHERE id = ?', [row.verification_id]);
    throw new TrialValidationError('Link expirado. Solicite um novo teste.');
  }

  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.run('UPDATE empresas SET status = ?, expira_em = ? WHERE id = ?', ['trial', expiraEm, row.empresa_id]);
  await db.run('UPDATE trial_email_verifications SET usado = 1 WHERE id = ?', [row.verification_id]);

  // A conta permanece pendente até o e-mail ser confirmado.
  return {
    success: true,
    empresa_id: id,
    slug,
    verification_required: true,
    message: 'Enviamos um link de confirmação para o seu e-mail. Confirme o endereço para ativar os 7 dias grátis.',
  };
}


  const tokenPayload = {
    id: String(usuario?.id || usuarioId),
    nome_funcionario: String(usuario?.nome_funcionario || nome),
    empresa_id: id,
  };

  let token: string;
  try {
    token = signAccessToken(tokenPayload);
    if (res) {
      try {
        setAuthCookie(res, token);
      } catch (ce: any) {
        console.warn('[trial] cookie:', ce?.message || ce);
      }
    }
  } catch (e: any) {
    console.error('[trial] JWT:', e?.message || e);
    throw new TrialValidationError('Falha ao gerar token. Verifique JWT_SECRET no servidor.');
  }

  notificarTrialAtivado({
    email,
    nomeEmpresa: nome,
    slug,
    empresaId: id,
    expiraEm,
    locale: input.locale,
  }).catch((e) => console.warn('e-mail trial:', e?.message || e));

  notifyN8n('trial.ativado', {
    empresa_id: id,
    slug,
    nome_empresa: nome,
    email,
    whatsapp: wpp,
    google_review_url: googleReviewUrl || null,
    locale: input.locale || 'pt-BR',
    expira_em: expiraEm,
    signup_ip: signupIp,
    link_painel: `${APP_URL}/painel/${slug}`,
    link_avaliacao: `${APP_URL}/avaliacao/${slug}`,
  });

  return {
    success: true,
    empresa_id: id,
    slug,
    link_acesso: `${APP_URL}/avaliacao/${slug}`,
    link_painel: `${APP_URL}/painel/${slug}`,
    expira_em: expiraEm,
    token,
    tokenPayload,
  };
}
