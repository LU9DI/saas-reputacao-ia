/**
 * Filtra.IA — API principal (Express + SQLite)
 * Monta rotas de trial, auth empresa, admin, MFA, reset de senha e Stripe.
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import type { Database } from 'sqlite';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { mountPasswordResetRoutes, createUsuarioForEmpresa, ensureAuthColumns } from './passwordResetRoutes.js';
import { mountAdminLoginRoute } from './adminLoginRoute.js';
import { mountAdminPasswordResetRoutes } from './adminPasswordReset.js';
import { mountMfaRoutes, ensureMfaColumns } from './mfa.js';
import { validarSenhaEmpresa } from './passwordPolicy.js';
import { mountStripeRoutes } from './stripeRoutes.js';
import { stripeConfigured } from './stripeBilling.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.originalUrl?.startsWith('/api/webhook/stripe')) return next();
  return express.json({ limit: '20kb' })(req, res, next);
});
app.use(cors({ origin: true, credentials: true }));

export let db!: Database;

const COOKIE_NAME = 'saas_auth_token';
const isProd = process.env.NODE_ENV === 'production';
const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET: string = process.env.JWT_SECRET ?? '';
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET não definido. Defina no backend/.env');
  process.exit(1);
}

function setAuthCookie(res: Response, token: string) {
  const opts = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  };
  res.cookie(COOKIE_NAME, token, opts);
  res.cookie('auth_token', token, opts);
}

function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.clearCookie('auth_token', { path: '/' });
}

function normalizarCnpj(cnpj: string): string {
  return String(cnpj || '').replace(/\D/g, '');
}

function cnpjValido(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (base: string, pesoInicial: number) => {
    let soma = 0,
      peso = pesoInicial;
    for (let i = 0; i < base.length; i++) {
      soma += parseInt(base[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calc(cnpj.slice(0, 12), 5);
  const d2 = calc(cnpj.slice(0, 12) + d1, 6);
  return parseInt(cnpj[12]) === d1 && parseInt(cnpj[13]) === d2;
}

function slugify(texto: string): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'empresa'
  );
}

async function slugUnico(base: string): Promise<string> {
  let slug = base;
  let n = 0;
  while (true) {
    const existe = await db.get('SELECT id FROM empresas WHERE slug = ?', [slug]);
    if (!existe) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

async function findEmpresa(ref: string) {
  if (!ref) return null;
  const porId = await db.get('SELECT * FROM empresas WHERE id = ?', [ref]);
  if (porId) return porId;
  return db.get('SELECT * FROM empresas WHERE slug = ?', [ref]);
}

interface AuthRequest extends Request {
  user?: { id: string; nome_funcionario: string; empresa_id: string; role?: string };
}

function extrairToken(req: Request): string | null {
  const fromCookie = req.cookies?.[COOKIE_NAME] || req.cookies?.auth_token;
  if (fromCookie) return fromCookie;
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

function autenticarToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extrairToken(req);
  if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: payload.id,
      nome_funcionario: payload.nome_funcionario,
      empresa_id: payload.empresa_id,
      role: payload.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login.' },
});
const trialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Limite de ativações excedido.' },
});
const reviewsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: { error: 'Muitas avaliações. Tente mais tarde.' },
});

async function initDB() {
  const dbPath =
    process.env.SQLITE_DB_PATH ||
    (isProd ? '/data/database.sqlite' : path.resolve(__dirname, '..', 'data', 'database.sqlite'));
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = await open({ filename: dbPath, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      cnpj TEXT UNIQUE NOT NULL,
      nome_empresa TEXT NOT NULL,
      slug TEXT UNIQUE,
      status TEXT DEFAULT 'trial',
      plan TEXT DEFAULT 'trial',
      criado_em DATETIME NOT NULL,
      expira_em DATETIME NOT NULL,
      google_review_url TEXT,
      voice_style TEXT,
      empresa_pai_id TEXT,
      whatsapp_suporte TEXT
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      cnpj TEXT NOT NULL,
      nome_funcionario TEXT NOT NULL,
      empresa_id TEXT NOT NULL,
      senha_hash TEXT NOT NULL,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT,
      name TEXT,
      rating INTEGER,
      comment TEXT,
      ai_reply TEXT,
      ai_tags TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT,
      tipo TEXT NOT NULL,
      tokens INTEGER NOT NULL DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await ensureAuthColumns(db);
  await ensureMfaColumns(db);

  const adminMail = (process.env.ADMIN_EMAIL || 'admin@seusaas.com').trim().toLowerCase();
  const adminExiste = await db.get('SELECT * FROM usuarios WHERE email = ?', [adminMail]);
  if (!adminExiste) {
    const senhaPadrao = process.env.ADMIN_PASSWORD || 'MudeEstaSenha123!';
    const hash = await bcrypt.hash(senhaPadrao, 12);
    await db.run(
      'INSERT INTO usuarios (id, cnpj, nome_funcionario, empresa_id, senha_hash, email) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), '00000000000000', 'Admin', 'admin', hash, adminMail]
    );
    console.log(`🔑 Admin criado: ${adminMail}`);
  }
}

// —— Health ——
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    stripe: stripeConfigured(),
    time: new Date().toISOString(),
  });
});

// —— Trial ——
app.post('/api/trial/ativar', trialLimiter, async (req: Request, res: Response) => {
  try {
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

// —— Login empresa (CNPJ + senha) ——
app.post('/api/auth/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const cnpj = normalizarCnpj(req.body.cnpj ?? '');
    const senha = String(req.body.senha ?? '');
    if (cnpj.length !== 14 || !senha) {
      return res.status(400).json({ error: 'CNPJ e senha são obrigatórios.' });
    }
    const usuario = await db.get('SELECT * FROM usuarios WHERE cnpj = ?', [cnpj]);
    if (!usuario?.senha_hash) return res.status(401).json({ error: 'Credenciais inválidas.' });
    const ok = await bcrypt.compare(senha, usuario.senha_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign(
      {
        id: usuario.id,
        nome_funcionario: usuario.nome_funcionario,
        empresa_id: usuario.empresa_id,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    setAuthCookie(res, token);
    res.json({
      success: true,
      token,
      tokenPayload: {
        id: usuario.id,
        nome_funcionario: usuario.nome_funcionario,
        empresa_id: usuario.empresa_id,
      },
    });
  } catch (e) {
    console.error('login:', e);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

// —— Empresa validar ——
app.get('/api/empresa/:ref/validar', async (req: Request, res: Response) => {
  try {
    const empresa = await findEmpresa(req.params.ref);
    if (!empresa) return res.status(404).json({ valido: false, motivo: 'not_found' });
    const agora = new Date();
    const expira = new Date(empresa.expira_em);
    if ((empresa.status === 'trial' || empresa.status === 'teste') && agora > expira) {
      return res.json({
        valido: false,
        motivo: 'expired',
        nome: empresa.nome_empresa,
        empresa_id: empresa.id,
        slug: empresa.slug,
      });
    }
    if (empresa.status === 'bloqueado') {
      return res.json({ valido: false, motivo: 'inactive', nome: empresa.nome_empresa });
    }
    return res.json({
      valido: true,
      nome: empresa.nome_empresa,
      empresa_id: empresa.id,
      slug: empresa.slug,
      google_review_url: empresa.google_review_url || null,
      plan: empresa.plan,
    });
  } catch (e) {
    console.error('validar:', e);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// —— Reviews ——
app.post('/api/reviews', reviewsLimiter, async (req: Request, res: Response) => {
  try {
    const name = String(req.body.name ?? '').trim().slice(0, 100);
    const comment = String(req.body.comment ?? '').trim().slice(0, 500);
    const rating = Number(req.body.rating);
    const empresaRef = String(req.body.empresa_id || req.body.empresa_ref || '').slice(0, 100);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating deve ser inteiro entre 1 e 5.' });
    }
    if (rating <= 3 && !comment) {
      return res.status(400).json({ error: 'Comentário obrigatório para notas ≤ 3.' });
    }

    let empresaId: string | null = null;
    if (empresaRef) {
      const emp = await findEmpresa(empresaRef);
      if (!emp) return res.status(404).json({ error: 'Empresa não encontrada.' });
      empresaId = emp.id;
    }

    const result = await db.run(
      `INSERT INTO reviews (empresa_id, name, rating, comment) VALUES (?, ?, ?, ?)`,
      [empresaId, name || 'Anônimo', rating, comment || null]
    );

    res.status(201).json({ success: true, id: result.lastID });
  } catch (e) {
    console.error('reviews:', e);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

app.get('/api/reviews/:ref', async (req: Request, res: Response) => {
  try {
    const emp = await findEmpresa(req.params.ref);
    if (!emp) return res.status(404).json({ error: 'Empresa não encontrada.' });
    const rows = await db.all(
      `SELECT id, name, rating, comment, ai_reply, createdAt FROM reviews WHERE empresa_id = ? ORDER BY createdAt DESC LIMIT 100`,
      [emp.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// —— Admin listagens ——
app.get('/api/admin/empresas', autenticarToken, async (req: AuthRequest, res: Response) => {
  if (req.user?.empresa_id !== 'admin' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  const rows = await db.all('SELECT * FROM empresas ORDER BY criado_em DESC LIMIT 200');
  res.json(rows);
});

app.get('/api/admin/reviews', autenticarToken, async (req: AuthRequest, res: Response) => {
  if (req.user?.empresa_id !== 'admin' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  const rows = await db.all('SELECT * FROM reviews ORDER BY createdAt DESC LIMIT 100');
  res.json(rows);
});

const PORT = Number(process.env.PORT || 5000);

async function main() {
  await initDB();

  mountAdminLoginRoute(app, () => db, { setAuthCookie, JWT_SECRET });
  mountAdminPasswordResetRoutes(app, () => db);
  mountMfaRoutes(app, () => db, { JWT_SECRET, setAuthCookie, autenticarToken });
  mountPasswordResetRoutes(app, () => db);
  mountStripeRoutes(app, () => db);

  console.log(`💳 Stripe: ${stripeConfigured() ? 'ok' : 'OFF — defina STRIPE_SECRET_KEY no .env'}`);
  app.listen(PORT, () => {
    console.log(`🚀 API Filtra.IA em http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
