import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { getDb, slugify, slugUnico } from '../lib/db.js';
import { normalizarCnpj, cnpjValido } from '../lib/cnpj.js';
import { validarSenhaEmpresa } from '../passwordPolicy.js';
import { createUsuarioForEmpresa } from '../passwordResetRoutes.js';

const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

const trialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Limite de ativações excedido.' },
});

export function mountTrialRoutes(app: Express) {
  app.post('/api/trial/ativar', trialLimiter, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const cnpj = normalizarCnpj(req.body.cnpj ?? '');
      const nome = String(req.body.nome_empresa ?? '').trim().slice(0, 120);
      const googleReviewUrl = String(req.body.google_review_url ?? '').trim().slice(0, 500);
      const email = String(req.body.email ?? '').trim().toLowerCase();
      const senha = String(req.body.senha ?? '');

      if (!cnpjValido(cnpj)) return res.status(400).json({ error: 'CNPJ inválido.' });
      if (nome.length < 2) return res.status(400).json({ error: 'Nome da empresa inválido.' });
      if (!email.includes('@')) return res.status(400).json({ error: 'E-mail inválido.' });
      const pol = validarSenhaEmpresa(senha);
      if (!pol.ok) return res.status(400).json({ error: pol.error });

      const id = crypto.randomUUID();
      const slug = await slugUnico(slugify(nome));
      const criadoEm = new Date();
      const expiraEm = new Date(criadoEm.getTime() + 7 * 24 * 60 * 60 * 1000);

      try {
        await db.run(
          `INSERT INTO empresas (id, cnpj, nome_empresa, slug, google_review_url, status, plan, criado_em, expira_em)
           VALUES (?, ?, ?, ?, ?, 'trial', 'trial', ?, ?)`,
          [id, cnpj, nome, slug, googleReviewUrl || null, criadoEm.toISOString(), expiraEm.toISOString()]
        );
      } catch (e: any) {
        if (String(e.code) === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'Este CNPJ já ativou o período de testes.' });
        }
        throw e;
      }

      try {
        await createUsuarioForEmpresa(db, { empresaId: id, cnpj, nome, email, senha });
      } catch (e: any) {
        await db.run('DELETE FROM empresas WHERE id = ?', [id]);
        return res.status(400).json({ error: e.message || 'Falha ao criar usuário.' });
      }

      res.status(201).json({
        success: true,
        empresa_id: id,
        slug,
        link_acesso: `${APP_URL}/avaliacao/${slug}`,
        link_painel: `${APP_URL}/painel/${slug}`,
        expira_em: expiraEm.toISOString(),
      });
    } catch (error) {
      console.error('trial:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });
}
