/**
 * Login do painel administrativo (e-mail + senha [+ MFA se ativo]).
 *
 * POST /api/admin/login { email, senha }
 *   → sem MFA: cookie JWT + success
 *   → com MFA: { mfa_required: true, mfa_token }  (validar em /api/admin/mfa/verify)
 *
 * Credenciais padrão:
 *   e-mail: admin@seusaas.com
 *   senha:  ADMIN_PASSWORD no .env  OU  MudeEstaSenha123!
 */
import type { Express, Request, Response } from 'express';
import type { Database } from 'sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ensureMfaColumns, issueMfaChallenge } from './mfa.js';

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
});

function isAdminUser(usuario: any): boolean {
  const adminMail = (process.env.ADMIN_EMAIL || 'admin@seusaas.com').trim().toLowerCase();
  return (
    usuario.empresa_id === 'admin' ||
    String(usuario.email || '').toLowerCase() === adminMail
  );
}

export function mountAdminLoginRoute(
  app: Express,
  getDb: () => Database,
  opts: {
    setAuthCookie: (res: Response, token: string) => void;
    JWT_SECRET: string;
  }
) {
  app.post('/api/admin/login', adminLoginLimiter, async (req: Request, res: Response) => {
    try {
      const email = String(req.body.email || '')
        .trim()
        .toLowerCase();
      const senha = String(req.body.senha || '');

      if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const db = getDb();
      await ensureMfaColumns(db);
      const usuario = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);

      if (!usuario || !usuario.senha_hash) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      if (!isAdminUser(usuario)) {
        return res.status(403).json({
          error:
            'Acesso restrito ao painel administrativo. Use /login com CNPJ para o painel da empresa.',
        });
      }

      const ok = await bcrypt.compare(senha, usuario.senha_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // MFA ativo → não emite sessão ainda
      if (usuario.mfa_enabled) {
        const challenge = issueMfaChallenge(usuario, opts.JWT_SECRET);
        return res.json({
          success: true,
          ...challenge,
          message: 'Informe o código do autenticador.',
        });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          nome_funcionario: usuario.nome_funcionario,
          empresa_id: usuario.empresa_id,
          role: 'admin',
          mfa: false,
        },
        opts.JWT_SECRET,
        { expiresIn: '1d' }
      );

      opts.setAuthCookie(res, token);

      return res.json({
        success: true,
        mfa_required: false,
        tokenPayload: {
          id: usuario.id,
          nome_funcionario: usuario.nome_funcionario,
          empresa_id: usuario.empresa_id,
          role: 'admin',
        },
      });
    } catch (e) {
      console.error('Erro no admin login:', e);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });
}
