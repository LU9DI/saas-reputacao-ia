import type { Express, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { getDb } from '../lib/db.js';
import { planTemRelatorioMensal } from '../lib/plans.js';
import { n8nConfigured, notifyN8nAsync } from '../lib/n8n.js';
import { adaptRelatorioProfissionalAoPlano, buildRelatorioProfissional, normalizeDestinatarios } from '../services/relatorioProfissional.js';

export function authorizedMonthlyReportJob(req: Pick<Request, 'headers'>): boolean {
  const secret = process.env.JOBS_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = String(req.headers.authorization || '');
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const supplied = String(req.headers['x-jobs-secret'] || '');
  return bearer === secret || supplied === secret;
}

function currentMonthUtc(): string { return new Date().toISOString().slice(0, 7); }
export function subscriptionReportDue(anchorDay: unknown, now = new Date()): boolean {
  const day = Number(anchorDay);
  if (!Number.isInteger(day) || day < 1 || day > 31) return false;
  const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  return now.getUTCDate() === Math.min(day, lastDay);
}
export function hasUnresolvedMonthlyReport(
  status: unknown,
  reportJson: unknown,
  updatedAt: unknown,
  now = new Date(),
): boolean {
  const state = String(status || '');
  if (state === 'failed' || state === 'generated') return true;
  if (state === 'accepted' && !reportJson) return true;
  if (state !== 'processing') return false;
  const updated = new Date(String(updatedAt || '')).getTime();
  return Number.isFinite(updated) && now.getTime() - updated >= 30 * 60 * 1000;
}
export function previousMonthUtc(): string {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

/**
 * Deriva o dia do aniversário a partir do fim do ciclo atual.
 * Usado apenas no backfill de assinaturas antigas (sem `relatorio_dia_assinatura`).
 */
export function subscriptionDayFromExpiry(expiraEm: unknown, now = new Date()): number {
  const expiry = new Date(String(expiraEm || ''));
  return Number.isFinite(expiry.getTime()) ? expiry.getUTCDate() : now.getUTCDate();
}

/**
 * Preenche `relatorio_dia_assinatura` de empresas ativas elegíveis que assinaram
 * antes da coluna existir. O UPDATE condicional preserva quem já tem o valor;
 * a partir daí o COALESCE das ativações/renovações mantém o aniversário estável.
 */
export async function backfillSubscriptionDays(db: any, now = new Date()): Promise<number> {
  const rows = await db.all(
    `SELECT id, expira_em FROM empresas
     WHERE relatorio_dia_assinatura IS NULL
       AND lower(COALESCE(plan, '')) IN ('pro','ultra','corporativo','corporate','corp','rei')
       AND lower(COALESCE(status, '')) IN ('ativo','active')`,
  ) as Array<{ id: string; expira_em?: string | null }>;
  let updated = 0;
  for (const row of rows || []) {
    const day = subscriptionDayFromExpiry(row.expira_em, now);
    const result = await db.run(
      'UPDATE empresas SET relatorio_dia_assinatura = ? WHERE id = ? AND relatorio_dia_assinatura IS NULL',
      [day, row.id],
    );
    if (Number(result?.changes || 0) > 0) updated += 1;
  }
  return updated;
}
function isMonth(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  return value < currentMonthUtc();
}
function parseDestinations(raw: unknown) {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try { return normalizeDestinatarios({ destinatarios: JSON.parse(raw) }); } catch { return []; }
}

/** Resolve destinatários sem mascarar falhas de banco como ausência de e-mail. */
export async function resolveMonthlyReportRecipients(db: any, empresaId: string, raw: unknown) {
  let destinatarios = parseDestinations(raw);
  if (!destinatarios.length) {
    const user = await db.get('SELECT email FROM usuarios WHERE empresa_id = ? AND email IS NOT NULL LIMIT 1', [empresaId]);
    if (user?.email) destinatarios = [{ canal: 'email', destino: String(user.email).trim() }];
  }
  return destinatarios;
}

const SNAPSHOT_STALE_MS = 30 * 60 * 1000;

export type MonthlyReportSnapshotResult = {
  state: 'cached' | 'generated' | 'generating';
  report?: any;
};

/**
 * Relatório mensal sob demanda com cache por ciclo (empresa + mês).
 * - Snapshot existente: devolvido sem novo consumo de IA (reaberturas/downloads ilimitados).
 * - Primeira leitura do ciclo: gera uma única vez e persiste para as próximas.
 * - Geração concorrente: devolve `generating` sem duplicar custo.
 */
export async function getOrGenerateMonthlyReportSnapshot(
  db: any,
  empresa: any,
  periodo: string,
  opts?: {
    locale?: string | null;
    build?: typeof buildRelatorioProfissional;
  },
): Promise<MonthlyReportSnapshotResult> {
  const build = opts?.build || buildRelatorioProfissional;
  const empresaId = String(empresa.id);
  const readRow = () => db.get(
    'SELECT status, report_json, updated_at FROM relatorio_envios_mensais WHERE empresa_id = ? AND periodo = ?',
    [empresaId, periodo],
  ) as Promise<any>;
  const parseReport = (row: any) => {
    if (!row?.report_json) return null;
    try {
      const report = JSON.parse(String(row.report_json));
      if (!report || report.empresa?.id !== empresaId || report.periodo !== periodo) return null;
      return adaptRelatorioProfissionalAoPlano(report, empresa.plan);
    } catch {
      return null;
    }
  };

  const existing = await readRow();
  const cached = parseReport(existing);
  if (cached) return { state: 'cached', report: cached };

  // Reserva antiga aceita pela distribuição mas sem snapshot: apenas completa o conteúdo,
  // preservando o estado de entrega.
  if (existing && String(existing.status) === 'accepted') {
    const report = await build(db, empresa, periodo, opts?.locale || null);
    const saved = await db.run(
      `UPDATE relatorio_envios_mensais SET report_json = ?, updated_at = ?
       WHERE empresa_id = ? AND periodo = ? AND status = 'accepted' AND report_json IS NULL`,
      [JSON.stringify(report), new Date().toISOString(), empresaId, periodo],
    );
    if (Number(saved?.changes || 0) > 0) return { state: 'generated', report: adaptRelatorioProfissionalAoPlano(report, empresa.plan) };
    const again = parseReport(await readRow());
    return again ? { state: 'cached', report: again } : { state: 'generating' };
  }

  const now = new Date().toISOString();
  let reservationCreated = false;
  try {
    const inserted = await db.run(
      `INSERT INTO relatorio_envios_mensais (id, empresa_id, periodo, status, destinatarios_json, created_at, updated_at, tentativas)
       VALUES (?, ?, ?, 'processing', '[]', ?, ?, 1)
       ON CONFLICT (empresa_id, periodo) DO NOTHING`,
      [randomUUID(), empresaId, periodo, now, now],
    );
    reservationCreated = Number(inserted?.changes || 0) > 0;
  } catch (error: any) {
    throw new Error('Falha ao reservar o ciclo do relatório mensal: ' + String(error?.message || error));
  }

  if (!reservationCreated) {
    const row = await readRow();
    const report = parseReport(row);
    if (report) return { state: 'cached', report };
    const updatedMs = Date.parse(String(row?.updated_at || ''));
    const stale = String(row?.status) === 'processing' && Number.isFinite(updatedMs) && Date.now() - updatedMs >= SNAPSHOT_STALE_MS;
    if (String(row?.status) === 'processing' && !stale) return { state: 'generating' };
    if (!['failed', 'generated'].includes(String(row?.status || '')) && !stale) return { state: 'generating' };
    const expectedStatus = stale ? 'processing' : String(row?.status);
    const retry = await db.run(
      `UPDATE relatorio_envios_mensais SET status = 'processing', updated_at = ?, erro = NULL, tentativas = tentativas + 1
       WHERE empresa_id = ? AND periodo = ? AND status = ? AND updated_at = ?`,
      [now, empresaId, periodo, expectedStatus, String(row?.updated_at || '')],
    );
    if (Number(retry?.changes || 0) <= 0) return { state: 'generating' };
  }

  let report: any;
  try {
    report = await build(db, empresa, periodo, opts?.locale || null);
  } catch (error: any) {
    await db.run(
      `UPDATE relatorio_envios_mensais SET status = 'failed', updated_at = ?, erro = ?
       WHERE empresa_id = ? AND periodo = ? AND status = 'processing'`,
      [new Date().toISOString(), String(error?.message || error).slice(0, 500), empresaId, periodo],
    ).catch(() => { /* preserva o erro original */ });
    throw error;
  }
  const saved = await db.run(
    `UPDATE relatorio_envios_mensais SET report_json = ?, status = 'generated', updated_at = ?, erro = NULL
     WHERE empresa_id = ? AND periodo = ? AND status = 'processing'`,
    [JSON.stringify(report), new Date().toISOString(), empresaId, periodo],
  );
  if (Number(saved?.changes || 0) > 0) return { state: 'generated', report: adaptRelatorioProfissionalAoPlano(report, empresa.plan) };
  const again = parseReport(await readRow());
  return again ? { state: 'cached', report: again } : { state: 'generating' };
}

export async function ensureMonthlyReportSchema(db: any) {
  try { await db.exec('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS relatorio_destinatarios TEXT'); }
  catch { try { await db.exec('ALTER TABLE empresas ADD COLUMN relatorio_destinatarios TEXT'); } catch { /* coluna já existe ou engine não permite */ } }
  try { await db.exec('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS relatorio_dia_assinatura INTEGER'); }
  catch { try { await db.exec('ALTER TABLE empresas ADD COLUMN relatorio_dia_assinatura INTEGER'); } catch { /* coluna já existe */ } }
  try { await db.exec('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS billing_cycle TEXT'); }
  catch { try { await db.exec('ALTER TABLE empresas ADD COLUMN billing_cycle TEXT'); } catch { /* coluna já existe */ } }
  try { await db.exec('ALTER TABLE relatorio_envios_mensais ADD COLUMN report_json TEXT'); } catch { /* coluna já existe ou tabela ainda não foi criada */ }
  await db.exec(`CREATE TABLE IF NOT EXISTS relatorio_envios_mensais (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    periodo TEXT NOT NULL,
    status TEXT NOT NULL,
    destinatarios_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    enviado_em TEXT,
    report_json TEXT,
    erro TEXT,
    tentativas INTEGER NOT NULL DEFAULT 0,
    UNIQUE (empresa_id, periodo)
  )`);
  try { await backfillSubscriptionDays(db); }
  catch { /* backfill é melhor esforço: não pode impedir o job de rodar */ }
}

export function mountMonthlyReportJobsRoutes(app: Express) {
  app.post('/api/jobs/monthly-reports', async (req: Request, res: Response) => {
    if (!authorizedMonthlyReportJob(req)) return res.status(401).json({ error: 'Unauthorized' });
    const requested = String(req.query.mes || req.body?.mes || '');
    const manualRecovery = Boolean(requested);
    const periodo = requested ? requested : previousMonthUtc();
    if (!isMonth(periodo)) return res.status(400).json({ error: 'Informe um mês encerrado no formato YYYY-MM.', code: 'INVALID_REPORT_MONTH' });
    const db = getDb();
    try {
      await ensureMonthlyReportSchema(db);
      const companies = await db.all(
        `SELECT e.id, e.nome_empresa, e.slug, e.plan, e.status, e.relatorio_destinatarios,
                e.relatorio_dia_assinatura, e.expira_em, e.billing_cycle
         FROM empresas e
         WHERE lower(COALESCE(e.plan, '')) IN ('pro','ultra','corporativo','corporate','corp','rei')
           AND lower(COALESCE(e.status, '')) IN ('ativo','active')
         ORDER BY e.id`
      ) as any[];
      const stats = { periodo, candidatos: companies.length, encaminhados: 0, pulados: 0, falhas: 0, sem_destinatario: 0, distribuicao_indisponivel: 0, sem_dia_assinatura: 0, snapshots_gerados: 0, snapshots_recuperados: 0 };
      for (const empresa of companies) {
        // Recupera primeiro a reserva pendente mais antiga, mesmo que o mês corrente tenha mudado.
        // Sem isso, uma falha atravessando a virada do mês ficaria órfã da cadência automática.
        let reportPeriod = periodo;
        let pendingReport: any = null;
        if (!manualRecovery) {
          const retryCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
          pendingReport = await db.get(
            `SELECT periodo FROM relatorio_envios_mensais
             WHERE empresa_id = ? AND (
               status IN ('failed', 'generated') OR
               (status = 'accepted' AND report_json IS NULL) OR
               (status = 'processing' AND updated_at <= ?)
             )
             ORDER BY periodo ASC LIMIT 1`,
            [empresa.id, retryCutoff],
          ) as any;
          if (pendingReport?.periodo && isMonth(pendingReport.periodo)) reportPeriod = String(pendingReport.periodo);
        }
        const plan = String(empresa.plan || '').toLowerCase();
        if (!planTemRelatorioMensal(plan)) { stats.pulados++; continue; }
        // O cron diário processa o relatório no aniversário mensal.
        // Reservas ainda não resolvidas podem ser retomadas em dias seguintes, sem esperar outro mês.
        // Não inferimos o aniversário de expira_em: em meses curtos, o dia original pode ser ambíguo.
        if (!manualRecovery) {
          const anchorDay = Number(empresa.relatorio_dia_assinatura);
          if ((!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31) && !pendingReport?.periodo) {
            stats.sem_dia_assinatura++;
            stats.pulados++;
            continue;
          }
          const existing = await db.get(
            'SELECT status, report_json, updated_at FROM relatorio_envios_mensais WHERE empresa_id = ? AND periodo = ?',
            [empresa.id, reportPeriod],
          ) as any;
          const unresolved = hasUnresolvedMonthlyReport(existing?.status, existing?.report_json, existing?.updated_at);
          if (!subscriptionReportDue(anchorDay) && !unresolved) { stats.pulados++; continue; }
        }
        // Destinatários não podem bloquear a criação do snapshot: a reserva começa com a configuração explícita, mesmo vazia.
        const configuredDestinatarios = parseDestinations(empresa.relatorio_destinatarios);
        const now = new Date().toISOString();
        const id = randomUUID();
        let reservationCreated = false;
        try {
          const inserted = await db.run(
            `INSERT INTO relatorio_envios_mensais (id, empresa_id, periodo, status, destinatarios_json, created_at, updated_at, tentativas)
             VALUES (?, ?, ?, 'processing', ?, ?, ?, 1)
             ON CONFLICT (empresa_id, periodo) DO NOTHING`,
            [id, empresa.id, reportPeriod, JSON.stringify(configuredDestinatarios), now, now]
          );
          reservationCreated = Number(inserted.changes || 0) > 0;
        } catch (error: any) {
          console.warn('[monthly-report] reserva falhou:', error?.message || error);
          stats.falhas++;
          continue;
        }
        const reservation = await db.get('SELECT status, updated_at, report_json FROM relatorio_envios_mensais WHERE empresa_id = ? AND periodo = ?', [empresa.id, reportPeriod]) as any;
        if (reservation?.status === 'accepted') {
          if (reservation.report_json) { stats.pulados++; continue; }
          try {
            const recoveredReport = await buildRelatorioProfissional(db, empresa, reportPeriod);
            const saved = await db.run(
              `UPDATE relatorio_envios_mensais SET report_json = ?, updated_at = ? WHERE empresa_id = ? AND periodo = ? AND status = 'accepted' AND report_json IS NULL`,
              [JSON.stringify(recoveredReport), new Date().toISOString(), empresa.id, reportPeriod]
            );
            if (saved.changes) stats.snapshots_recuperados++;
            else stats.pulados++;
          } catch (error: any) {
            stats.falhas++;
            console.warn('[monthly-report] recuperação de snapshot falhou empresa=' + empresa.id + ':', String(error?.message || error).slice(0, 500));
          }
          continue;
        }
        if (!reservationCreated) {
          const updatedAt = new Date(String(reservation?.updated_at || '')).getTime();
          const staleProcessing = reservation?.status === 'processing' && Number.isFinite(updatedAt) && Date.now() - updatedAt >= 30 * 60 * 1000;
          if (reservation?.status === 'processing' && !staleProcessing) { stats.pulados++; continue; }
          if (!['failed', 'generated'].includes(String(reservation?.status || '')) && !staleProcessing) { stats.pulados++; continue; }
          const expectedStatus = staleProcessing ? 'processing' : String(reservation.status);
          const retry = await db.run(
            `UPDATE relatorio_envios_mensais SET status = 'processing', updated_at = ?, erro = NULL, tentativas = tentativas + 1, destinatarios_json = ?
             WHERE empresa_id = ? AND periodo = ? AND status = ? AND updated_at = ?`,
            [now, JSON.stringify(configuredDestinatarios), empresa.id, reportPeriod, expectedStatus, reservation.updated_at]
          );
          if (!retry.changes) { stats.pulados++; continue; }
        }
        try {
          const report = reservation?.report_json ? JSON.parse(String(reservation.report_json)) : await buildRelatorioProfissional(db, empresa, reportPeriod);
          // Persist the generated snapshot before resolving recipients or attempting delivery.
          const snapshotSaved = await db.run(`UPDATE relatorio_envios_mensais SET report_json = ?, updated_at = ? WHERE empresa_id = ? AND periodo = ? AND status = 'processing'`, [JSON.stringify(report), new Date().toISOString(), empresa.id, reportPeriod]);
          if (snapshotSaved.changes && !reservation?.report_json) stats.snapshots_gerados++;
          const destinatarios = await resolveMonthlyReportRecipients(db, String(empresa.id), empresa.relatorio_destinatarios);
          await db.run(`UPDATE relatorio_envios_mensais SET destinatarios_json = ? WHERE empresa_id = ? AND periodo = ? AND status = 'processing'`, [JSON.stringify(destinatarios), empresa.id, reportPeriod]);
          if (!destinatarios.length) {
            await db.run(`UPDATE relatorio_envios_mensais SET status = 'generated', updated_at = ?, erro = NULL WHERE empresa_id = ? AND periodo = ? AND status = 'processing'`, [new Date().toISOString(), empresa.id, reportPeriod]);
            stats.sem_destinatario++;
            continue;
          }
          if (!n8nConfigured()) {
            await db.run(`UPDATE relatorio_envios_mensais SET status = 'generated', updated_at = ?, erro = NULL WHERE empresa_id = ? AND periodo = ? AND status = 'processing'`, [new Date().toISOString(), empresa.id, reportPeriod]);
            stats.distribuicao_indisponivel++;
            continue;
          }
          const channels = [...new Set(destinatarios.map((d: any) => d.canal))];
          const accepted = await notifyN8nAsync('report.generated', {
            tipo: 'relatorio_profissional_mensal',
            schema_version: report.schema_version,
            empresa_id: String(empresa.id),
            slug: empresa.slug || null,
            nome_empresa: empresa.nome_empresa || 'Empresa',
            plan: empresa.plan,
            periodo: reportPeriod,
            report,
            relatorio: report,
            channels,
            destinatarios,
            email: destinatarios.find((d: any) => d.canal === 'email')?.destino || null,
            idempotency_key: 'monthly-professional-report:' + empresa.id + ':' + reportPeriod,
            entrega: 'mensal',
            modelo_ia: report.geracao?.modelo_ia || null,
            tokens: report.geracao?.tokens || 0,
          });
          if (!accepted) throw new Error('Webhook de distribuição não confirmou o recebimento.');
          await db.run(`UPDATE relatorio_envios_mensais SET status = 'accepted', updated_at = ?, enviado_em = ?, erro = NULL WHERE empresa_id = ? AND periodo = ?`, [new Date().toISOString(), new Date().toISOString(), empresa.id, reportPeriod]);
          stats.encaminhados++;
        } catch (error: any) {
          const message = String(error?.message || error).slice(0, 500);
          await db.run(`UPDATE relatorio_envios_mensais SET status = 'failed', updated_at = ?, erro = ? WHERE empresa_id = ? AND periodo = ? AND status <> 'accepted'`, [new Date().toISOString(), message, empresa.id, reportPeriod]);
          stats.falhas++;
          console.warn('[monthly-report] falha empresa=' + empresa.id + ':', message);
        }
      }
      return res.status(stats.falhas || stats.sem_destinatario || stats.distribuicao_indisponivel ? 207 : 200).json({ success: stats.falhas === 0 && stats.sem_destinatario === 0 && stats.distribuicao_indisponivel === 0, partial: stats.falhas > 0 || stats.sem_destinatario > 0 || stats.distribuicao_indisponivel > 0, ...stats, distribuicao_configurada: n8nConfigured(), idempotencia: 'um encaminhamento aceito pelo webhook por empresa e mês; snapshots persistidos independentemente da distribuição' });
    } catch (error: any) {
      console.error('[monthly-report] job falhou:', error?.message || error);
      return res.status(500).json({ error: 'Falha ao processar relatórios mensais.', code: 'MONTHLY_REPORT_JOB_FAILED' });
    }
  });
}
