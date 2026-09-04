/**
 * Login do painel administrativo (e-mail + senha).
 * O frontend em /admin/login chama POST /api/admin/login.
 *
 * Credenciais padrão (criadas no initDB do server.ts):
 *   e-mail: admin@seusaas.com
 *   senha:  valor de ADMIN_PASSWORD no .env  OU  MudeEstaSenha123!
 *
 * Uso no server.ts (depois de initDB e com app/db prontos):
 *   import { mountAdminLoginRoute } from './adminLoginRoute.js';
 *   mountAdminLoginRoute(app, () => db, { setAuthCookie, JWT_SECRET });
 */
import type { Express, Request, Response } from 'express';
import type { Database } from 'sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
});

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
      const usuario = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);

      if (!usuario || !usuario.senha_hash) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Painel /admin: apenas o usuário admin (empresa_id = 'admin') ou e-mail admin@seusaas.com
      const isAdmin =
        usuario.empresa_id === 'admin' ||
        String(usuario.email || '').toLowerCase() === 'admin@seusaas.com';

      if (!isAdmin) {
        return res.status(403).json({
          error: 'Acesso restrito ao painel administrativo. Use /login com CNPJ para o painel da empresa.',
        });
      }

      const ok = await bcrypt.compare(senha, usuario.senha_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          nome_funcionario: usuario.nome_funcionario,
          empresa_id: usuario.empresa_id,
          role: 'admin',
        },
        opts.JWT_SECRET,
        { expiresIn: '1d' }
      );

      opts.setAuthCookie(res, token);

      return res.json({
        success: true,
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
