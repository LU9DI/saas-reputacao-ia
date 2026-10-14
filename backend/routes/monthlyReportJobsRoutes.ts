import type { Express, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { getDb } from '../lib/db.js';
import { planTemRelatorioMensal } from '../lib/plans.js';
import { n8nConfigured, notifyN8nAsync } from '../lib/n8n.js';
import { buildRelatorioProfissional, normalizeDestinatarios } from '../services/relatorioProfissional.js';

function authorized(req: Request): boolean {
  const secret = process.env.JOBS_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = String(req.headers.authorization || '');
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const supplied = String(req.headers['x-jobs-secret'] || req.query.secret || '');
  return bearer === secret || supplied === secret;
}

function currentMonthUtc(): string { return new Date().toISOString().slice(0, 7); }
function previousMonthUtc(): string {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}
function isMonth(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  return value < currentMonthUtc();
}
function parseDestinations(raw: unknown) {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try { return normalizeDestinatarios({ destinatarios: JSON.parse(raw) }); } catch { return []; }
}

async function ensureMonthlyReportSchema(db: any) {
  try { await db.exec('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS relatorio_destinatarios TEXT'); }
  catch { try { await db.exec('ALTER TABLE empresas ADD COLUMN relatorio_destinatarios TEXT'); } catch { /* coluna já existe ou engine não permite */ } }
  await db.exec(`CREATE TABLE IF NOT EXISTS relatorio_envios_mensais (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    periodo TEXT NOT NULL,
    status TEXT NOT NULL,
    destinatarios_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    enviado_em TEXT,
    erro TEXT,
    tentativas INTEGER NOT NULL DEFAULT 0,
    UNIQUE (empresa_id, periodo)
  )`);
}

export function mountMonthlyReportJobsRoutes(app: Express) {
  app.post('/api/jobs/monthly-reports', async (req: Request, res: Response) => {
    if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });
    if (!n8nConfigured()) return res.status(503).json({ error: 'Distribuição mensal indisponível: webhook n8n não configurado.', code: 'N8N_OFF' });
    const requested = String(req.query.mes || req.body?.mes || '');
    const periodo = requested ? requested : previousMonthUtc();
    if (!isMonth(periodo)) return res.status(400).json({ error: 'Informe um mês encerrado no formato YYYY-MM.', code: 'INVALID_REPORT_MONTH' });
    const db = getDb();
    try {
      await ensureMonthlyReportSchema(db);
      const companies = await db.all(
        `SELECT e.id, e.nome_empresa, e.slug, e.plan, e.status, e.relatorio_destinatarios
         FROM empresas e
         WHERE lower(COALESCE(e.plan, '')) IN ('pro','ultra','corporativo','corp','rei')
           AND lower(COALESCE(e.status, '')) IN ('ativo','active')
         ORDER BY e.id`
      ) as any[];
      const stats = { periodo, candidatos: companies.length, enviados: 0, pulados: 0, falhas: 0, sem_destinatario: 0 };
      for (const empresa of companies) {
        const plan = String(empresa.plan || '').toLowerCase();
        if (!planTemRelatorioMensal(plan)) { stats.pulados++; continue; }
        let destinatarios = parseDestinations(empresa.relatorio_destinatarios);
        if (!destinatarios.length) {
          try {
            const user = await db.get('SELECT email FROM usuarios WHERE empresa_id = ? AND email IS NOT NULL LIMIT 1', [empresa.id]);
            if (user?.email) destinatarios = [{ canal: 'email', destino: String(user.email).trim() }];
          } catch { /* sem e-mail primário */ }
        }
        if (!destinatarios.length) { stats.sem_destinatario++; continue; }
        const now = new Date().toISOString();
        const id = randomUUID();
        try {
          await db.run(
            `INSERT INTO relatorio_envios_mensais (id, empresa_id, periodo, status, destinatarios_json, created_at, updated_at, tentativas)
             VALUES (?, ?, ?, 'processing', ?, ?, ?, 1)
             ON CONFLICT (empresa_id, periodo) DO NOTHING`,
            [id, empresa.id, periodo, JSON.stringify(destinatarios), now, now]
          );
        } catch (error: any) {
          console.warn('[monthly-report] reserva falhou:', error?.message || error);
          stats.falhas++;
          continue;
        }
        let reservation = await db.get('SELECT status, updated_at FROM relatorio_envios_mensais WHERE empresa_id = ? AND periodo = ?', [empresa.id, periodo]) as any;
        if (reservation?.status === 'sent') { stats.pulados++; continue; }
        if (reservation?.status === 'processing' && reservation.updated_at !== now) {
          const updatedAt = new Date(String(reservation.updated_at || 0)).getTime();
          if (Number.isFinite(updatedAt) && Date.now() - updatedAt < 30 * 60 * 1000) { stats.pulados++; continue; }
        }
        if (reservation?.status !== 'processing' || reservation.updated_at !== now) {
          const retry = await db.run(
            `UPDATE relatorio_envios_mensais SET status = 'processing', updated_at = ?, erro = NULL, tentativas = tentativas + 1, destinatarios_json = ?
             WHERE empresa_id = ? AND periodo = ? AND status <> 'sent' AND (status <> 'processing' OR updated_at = ?)`,
            [now, JSON.stringify(destinatarios), empresa.id, periodo, reservation?.updated_at]
          );
          if (!retry.changes) { stats.pulados++; continue; }
        }
        try {
          const report = await buildRelatorioProfissional(db, empresa, periodo);
          const channels = [...new Set(destinatarios.map((d: any) => d.canal))];
          const accepted = await notifyN8nAsync('report.generated', {
            tipo: 'relatorio_profissional_mensal',
            schema_version: report.schema_version,
            empresa_id: String(empresa.id),
            slug: empresa.slug || null,
            nome_empresa: empresa.nome_empresa || 'Empresa',
            plan: empresa.plan,
            periodo,
            report,
            relatorio: report,
            channels,
            destinatarios,
            email: destinatarios.find((d: any) => d.canal === 'email')?.destino || null,
            idempotency_key: 'monthly-professional-report:' + empresa.id + ':' + periodo,
            entrega: 'mensal',
            modelo_ia: report.geracao?.modelo_ia || null,
            tokens: report.geracao?.tokens || 0,
          });
          if (!accepted) throw new Error('Webhook de distribuição não confirmou o recebimento.');
          await db.run(`UPDATE relatorio_envios_mensais SET status = 'sent', updated_at = ?, enviado_em = ?, erro = NULL WHERE empresa_id = ? AND periodo = ?`, [new Date().toISOString(), new Date().toISOString(), empresa.id, periodo]);
          stats.enviados++;
        } catch (error: any) {
          const message = String(error?.message || error).slice(0, 500);
          await db.run(`UPDATE relatorio_envios_mensais SET status = 'failed', updated_at = ?, erro = ? WHERE empresa_id = ? AND periodo = ? AND status <> 'sent'`, [new Date().toISOString(), message, empresa.id, periodo]);
          stats.falhas++;
          console.warn('[monthly-report] falha empresa=' + empresa.id + ':', message);
        }
      }
      return res.json({ success: true, ...stats, distribuicao_configurada: true, idempotencia: 'uma entrega confirmada por empresa e mês' });
    } catch (error: any) {
      console.error('[monthly-report] job falhou:', error?.message || error);
      return res.status(500).json({ error: 'Falha ao processar relatórios mensais.', code: 'MONTHLY_REPORT_JOB_FAILED' });
    }
  });
}
