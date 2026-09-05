/**
 * Jobs internos (cron / Railway / GitHub Actions).
 * Protegido por JOBS_SECRET no header Authorization: Bearer <secret>
 * ou query ?secret=
 *
 * Endpoints:
 *   POST /api/jobs/trial-expiring   — trials que expiram em 1–2 dias
 *   POST /api/jobs/expirations      — lembretes + bloqueio + e-mail de acesso encerrado
 */
import type { Express, Request, Response } from 'express';
import { getDb } from '../lib/db.js';
import {
  notificarTrialExpirando,
  notificarAssinaturaExpirando,
  notificarAcessoExpirado,
  smtpConfigured,
} from '../lib/notifications.js';
import { enforcarExpiracoes } from '../services/billingService.js';

function authorized(req: Request): boolean {
  const secret = process.env.JOBS_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const header = String(req.headers.authorization || '');
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const q = String(req.query.secret || '');
  return bearer === secret || q === secret;
}

async function ensureJobColumns(db: any) {
  const cols = (await db.all(`PRAGMA table_info(empresas)`)).map((c: any) => c.name);
  if (!cols.includes('trial_remind_sent_at')) {
    await db.exec(`ALTER TABLE empresas ADD COLUMN trial_remind_sent_at TEXT`);
  }
  if (!cols.includes('expiry_remind_sent_at')) {
    await db.exec(`ALTER TABLE empresas ADD COLUMN expiry_remind_sent_at TEXT`);
  }
  if (!cols.includes('expired_notice_sent_at')) {
    await db.exec(`ALTER TABLE empresas ADD COLUMN expired_notice_sent_at TEXT`);
  }
}

function diasAte(iso: string, agora: number): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - agora) / 86400000));
}

function recentementeEnviado(iso: string | null | undefined, agora: number, horas = 20): boolean {
  if (!iso) return false;
  const last = new Date(iso).getTime();
  if (Number.isNaN(last)) return false;
  return agora - last < horas * 60 * 60 * 1000;
}

export function mountJobsRoutes(app: Express) {
  /**
   * POST /api/jobs/trial-expiring
   * E-mail para trials que expiram em até 2 dias.
   */
  app.post('/api/jobs/trial-expiring', async (req: Request, res: Response) => {
    if (!authorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = getDb();
      await ensureJobColumns(db);
      await enforcarExpiracoes(db);

      const agora = Date.now();
      const in2d = new Date(agora + 2 * 24 * 60 * 60 * 1000).toISOString();
      const agoraIso = new Date(agora).toISOString();

      const rows = await db.all(
        `SELECT e.id, e.nome_empresa, e.slug, e.expira_em, e.trial_remind_sent_at,
                u.email
         FROM empresas e
         LEFT JOIN usuarios u ON u.empresa_id = e.id AND u.email IS NOT NULL
         WHERE e.status = 'trial'
           AND e.expira_em IS NOT NULL
           AND e.expira_em > ?
           AND e.expira_em <= ?
         GROUP BY e.id`,
        [agoraIso, in2d]
      );

      let enviados = 0;
      let pulados = 0;

      for (const e of rows || []) {
        if (!e.email || recentementeEnviado(e.trial_remind_sent_at, agora)) {
          pulados++;
          continue;
        }

        const dias = diasAte(e.expira_em, agora);
        const ok = await notificarTrialExpirando({
          email: e.email,
          nomeEmpresa: e.nome_empresa,
          expiraEm: e.expira_em,
          dias,
          slug: e.slug,
          empresaId: e.id,
        });

        if (ok.ok) {
          await db.run(`UPDATE empresas SET trial_remind_sent_at = ? WHERE id = ?`, [
            new Date().toISOString(),
            e.id,
          ]);
          enviados++;
        } else {
          pulados++;
        }
      }

      res.json({
        success: true,
        enviados,
        pulados,
        candidatos: (rows || []).length,
        smtp: smtpConfigured(),
      });
    } catch (e: any) {
      console.error('jobs/trial-expiring:', e?.message || e);
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  });

  /**
   * POST /api/jobs/expirations
   * Job completo diário:
   *  1) Lembrete trial (1–2 dias)
   *  2) Lembrete assinatura ativa / cancelada (1–3 dias)
   *  3) Bloqueia quem já venceu
   *  4) E-mail "acesso encerrado" para quem acabou de ser bloqueado
   */
  app.post('/api/jobs/expirations', async (req: Request, res: Response) => {
    if (!authorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = getDb();
      await ensureJobColumns(db);

      const agora = Date.now();
      const agoraIso = new Date(agora).toISOString();
      const in3d = new Date(agora + 3 * 24 * 60 * 60 * 1000).toISOString();

      const stats = {
        trial_remind: 0,
        assinatura_remind: 0,
        acesso_expirado: 0,
        pulados: 0,
        bloqueados: 0,
      };

      // —— 1) Trial expirando (até 2 dias) ——
      const trials = await db.all(
        `SELECT e.id, e.nome_empresa, e.slug, e.expira_em, e.trial_remind_sent_at, u.email
         FROM empresas e
         LEFT JOIN usuarios u ON u.empresa_id = e.id AND u.email IS NOT NULL
         WHERE e.status = 'trial'
           AND e.expira_em IS NOT NULL
           AND e.expira_em > ?
           AND e.expira_em <= ?
         GROUP BY e.id`,
        [agoraIso, new Date(agora + 2 * 24 * 60 * 60 * 1000).toISOString()]
      );

      for (const e of trials || []) {
        if (!e.email || recentementeEnviado(e.trial_remind_sent_at, agora)) {
          stats.pulados++;
          continue;
        }
        const ok = await notificarTrialExpirando({
          email: e.email,
          nomeEmpresa: e.nome_empresa,
          expiraEm: e.expira_em,
          dias: diasAte(e.expira_em, agora),
          slug: e.slug,
          empresaId: e.id,
        });
        if (ok.ok) {
          await db.run(`UPDATE empresas SET trial_remind_sent_at = ? WHERE id = ?`, [
            agoraIso,
            e.id,
          ]);
          stats.trial_remind++;
        } else stats.pulados++;
      }

      // —— 2) Assinatura ativa ou cancelada expirando em até 3 dias ——
      const assinaturas = await db.all(
        `SELECT e.id, e.nome_empresa, e.slug, e.plan, e.expira_em, e.cancel_at_period_end,
                e.expiry_remind_sent_at, u.email
         FROM empresas e
         LEFT JOIN usuarios u ON u.empresa_id = e.id AND u.email IS NOT NULL
         WHERE e.status = 'ativo'
           AND e.expira_em IS NOT NULL
           AND e.expira_em > ?
           AND e.expira_em <= ?
         GROUP BY e.id`,
        [agoraIso, in3d]
      );

      for (const e of assinaturas || []) {
        if (!e.email || recentementeEnviado(e.expiry_remind_sent_at, agora)) {
          stats.pulados++;
          continue;
        }
        const cancelado = Number(e.cancel_at_period_end) === 1;
        const ok = await notificarAssinaturaExpirando({
          email: e.email,
          nomeEmpresa: e.nome_empresa,
          plano: e.plan,
          expiraEm: e.expira_em,
          dias: diasAte(e.expira_em, agora),
          motivo: cancelado ? 'cancelamento' : 'renovacao',
          slug: e.slug,
          empresaId: e.id,
        });
        if (ok.ok) {
          await db.run(`UPDATE empresas SET expiry_remind_sent_at = ? WHERE id = ?`, [
            agoraIso,
            e.id,
          ]);
          stats.assinatura_remind++;
        } else stats.pulados++;
      }

      // —— 3) Quem vai ser bloqueado agora (antes do UPDATE) ——
      const aBloquear = await db.all(
        `SELECT e.id, e.nome_empresa, e.slug, e.plan, e.status, e.expira_em,
                e.cancel_at_period_end, e.expired_notice_sent_at, u.email
         FROM empresas e
         LEFT JOIN usuarios u ON u.empresa_id = e.id AND u.email IS NOT NULL
         WHERE e.expira_em IS NOT NULL
           AND e.expira_em < ?
           AND (
             (e.status = 'ativo' AND IFNULL(e.cancel_at_period_end, 0) = 1)
             OR (e.status IN ('trial', 'ativo') AND IFNULL(e.cancel_at_period_end, 0) = 0)
           )
         GROUP BY e.id`,
        [agoraIso]
      );

      // —— 4) Bloqueio efetivo ——
      await enforcarExpiracoes(db);
      stats.bloqueados = (aBloquear || []).length;

      // —— 5) E-mail de acesso encerrado ——
      for (const e of aBloquear || []) {
        if (!e.email || recentementeEnviado(e.expired_notice_sent_at, agora, 72)) {
          stats.pulados++;
          continue;
        }
        const tipo =
          e.status === 'trial'
            ? 'trial'
            : Number(e.cancel_at_period_end) === 1
              ? 'cancelamento'
              : 'assinatura';

        const ok = await notificarAcessoExpirado({
          email: e.email,
          nomeEmpresa: e.nome_empresa,
          tipo,
          plano: e.plan,
          expiraEm: e.expira_em,
          slug: e.slug,
          empresaId: e.id,
        });

        if (ok.ok) {
          await db.run(`UPDATE empresas SET expired_notice_sent_at = ? WHERE id = ?`, [
            agoraIso,
            e.id,
          ]);
          stats.acesso_expirado++;
        } else stats.pulados++;
      }

      res.json({
        success: true,
        ...stats,
        smtp: smtpConfigured(),
      });
    } catch (e: any) {
      console.error('jobs/expirations:', e?.message || e);
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  });
}
