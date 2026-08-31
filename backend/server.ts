import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import type { Database } from 'sqlite';
import 'dotenv/config';
import { gerarRespostaReview, gerarTagsSemanticas } from './groqService.js';

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000'].filter(Boolean) as string[];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

let db: Database;

const COOKIE_NAME = 'saas_auth_token';
const isProd = process.env.NODE_ENV === 'production';

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
}

async function initDB() {
  db = await open({ filename: './database.sqlite', driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      cnpj TEXT UNIQUE NOT NULL,
      nome_empresa TEXT NOT NULL,
      status TEXT DEFAULT 'trial',
      criado_em DATETIME NOT NULL,
      expira_em DATETIME NOT NULL,
      google_review_url TEXT
    );
  `);

  const colunasEmpresas = await db.all(`PRAGMA table_info(empresas)`);
  if (!colunasEmpresas.some((col: any) => col.name === 'google_review_url')) {
    await db.exec(`ALTER TABLE empresas ADD COLUMN google_review_url TEXT`);
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL
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

  const colunasReviews = await db.all(`PRAGMA table_info(reviews)`);
  if (!colunasReviews.some((col: any) => col.name === 'ai_reply')) {
    await db.exec(`ALTER TABLE reviews ADD COLUMN ai_reply TEXT`);
  }
  if (!colunasReviews.some((col: any) => col.name === 'ai_tags')) {
    await db.exec(`ALTER TABLE reviews ADD COLUMN ai_tags TEXT`);
  }

  const adminExiste = await db.get('SELECT * FROM usuarios WHERE email = ?', ['admin@seusaas.com']);
  if (!adminExiste) {
    const senhaPadrao = process.env.ADMIN_PASSWORD || 'MudeEstaSenha123!';
    const hash = await bcrypt.hash(senhaPadrao, 10);
    await db.run('INSERT INTO usuarios (id, email, senha_hash) VALUES (?, ?, ?)', [
      crypto.randomUUID(),
      'admin@seusaas.com',
      hash,
    ]);
    console.log('🔑 Admin padrão criado. Altere a senha após o primeiro login.');
  }
}

function normalizarCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function cnpjValido(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0;
    let peso = pesoInicial;
    for (let i = 0; i < base.length; i++) {
      soma += parseInt(base[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const digito1 = calcularDigito(cnpj.slice(0, 12), 5);
  const digito2 = calcularDigito(cnpj.slice(0, 12) + digito1, 6);
  return parseInt(cnpj[12]) === digito1 && parseInt(cnpj[13]) === digito2;
}

function validarReview(body: any): { name: string; rating: number; comment: string; empresa_id?: string } | { error: string } {
  const name = String(body.name ?? '').trim().slice(0, 100);
  const comment = String(body.comment ?? '').trim().slice(0, 500);
  const rating = Number(body.rating);
  const empresa_id = body.empresa_id ? String(body.empresa_id).slice(0, 100) : undefined;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating deve ser um número inteiro entre 1 e 5.' };
  }
  if (rating <= 3 && comment.length === 0) {
    return { error: 'Comentário é obrigatório para avaliações negativas.' };
  }
  return { name, rating, comment, empresa_id };
}

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-dev';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não definido! Usando segredo temporário.');
}

function extrairToken(req: Request): string | null {
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

function autenticarToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extrairToken(req);
  if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
});

const trialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Limite de ativações excedido. Tente novamente mais tarde.' },
});

const reviewsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Muitas avaliações enviadas. Tente novamente mais tarde.' },
});

// ---- Trial ----
app.post('/api/trial/ativar', trialLimiter, async (req: Request, res: Response) => {
  try {
    const cnpj = normalizarCnpj(req.body.cnpj ?? '');
    const nome = String(req.body.nome_empresa ?? '').trim().slice(0, 120);
    const googleReviewUrl = String(req.body.google_review_url ?? '').trim().slice(0, 500);

    if (!cnpjValido(cnpj)) return res.status(400).json({ error: 'CNPJ inválido.' });
    if (nome.length < 2 || nome.length > 120) return res.status(400).json({ error: 'Nome da empresa inválido.' });
    if (googleReviewUrl && !/^https?:\/\//i.test(googleReviewUrl)) {
      return res.status(400).json({ error: 'URL do Google Reviews inválida. Use um link completo (https://...).' });
    }

    const id = crypto.randomUUID();
    const criadoEm = new Date();
    const expiraEm = new Date(criadoEm.getTime() + 7 * 24 * 60 * 60 * 1000);

    try {
      await db.run(
        `INSERT INTO empresas (id, cnpj, nome_empresa, google_review_url, criado_em, expira_em)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, cnpj, nome, googleReviewUrl || null, criadoEm.toISOString(), expiraEm.toISOString()]
      );
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: 'Este CNPJ já ativou o período de testes.' });
      }
      throw e;
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    res.status(201).json({
      success: true,
      empresa_id: id,
      link_acesso: `${appUrl}/avaliacao/${id}`,
      link_painel: `${appUrl}/painel/${id}`,
      expira_em: expiraEm.toISOString(),
    });
  } catch (error) {
    console.error('Erro ao ativar trial:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.get('/api/empresa/:id/validar', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const empresa = await db.get('SELECT * FROM empresas WHERE id = ?', [id]);
    if (!empresa) return res.status(404).json({ valido: false, motivo: 'not_found' });

    const agora = new Date();
    const dataExpiracao = new Date(empresa.expira_em);

    if (empresa.status === 'trial' && agora > dataExpiracao) {
      return res.json({
        valido: false,
        motivo: 'expired',
        nome: empresa.nome_empresa,
        google_review_url: empresa.google_review_url || null,
      });
    }

    if (empresa.status === 'ativo' || empresa.status === 'trial') {
      return res.json({
        valido: true,
        nome: empresa.nome_empresa,
        google_review_url: empresa.google_review_url || null,
      });
    }

    return res.json({
      valido: false,
      motivo: 'inactive',
      nome: empresa.nome_empresa,
      google_review_url: empresa.google_review_url || null,
    });
  } catch (error) {
    console.error('Erro ao validar acesso:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ---- Painel do empresário (acesso via ID do trial — MVP) ----
app.get('/api/empresa/:id/painel', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const empresa = await db.get(
      'SELECT id, nome_empresa, status, cnpj, google_review_url, criado_em, expira_em FROM empresas WHERE id = ?',
      [id]
    );
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

    const reviews = await db.all(
      'SELECT * FROM reviews WHERE empresa_id = ? ORDER BY createdAt DESC LIMIT 200',
      [id]
    );

    const parsed = reviews.map((r: any) => ({
      ...r,
      ai_tags: r.ai_tags ? safeParseTags(r.ai_tags) : [],
    }));

    // Métricas
    const total = parsed.length;
    const media =
      total > 0 ? parsed.reduce((s: number, r: any) => s + r.rating, 0) / total : 0;
    const negativas = parsed.filter((r: any) => r.rating <= 3).length;
    const positivas = parsed.filter((r: any) => r.rating >= 4).length;

    // Alerta de crise: ≥3 reviews ≤2 estrelas nas últimas 24h
    const ha24h = Date.now() - 24 * 60 * 60 * 1000;
    const crisesRecentes = parsed.filter(
      (r: any) => r.rating <= 2 && new Date(r.createdAt).getTime() >= ha24h
    ).length;
    const alertaCrise = crisesRecentes >= 3;

    // Contagem de tags
    const tagCount: Record<string, number> = {};
    for (const r of parsed) {
      for (const tag of r.ai_tags as string[]) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      empresa,
      reviews: parsed,
      metricas: {
        total,
        media: Math.round(media * 10) / 10,
        negativas,
        positivas,
        alerta_crise: alertaCrise,
        crises_24h: crisesRecentes,
      },
      top_tags: topTags,
    });
  } catch (error) {
    console.error('Erro no painel:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

function safeParseTags(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

// ---- Reviews ----
app.post('/api/reviews', reviewsLimiter, async (req: Request, res: Response) => {
  const resultado = validarReview(req.body);
  if ('error' in resultado) return res.status(400).json({ error: resultado.error });

  const { name, rating, comment, empresa_id } = resultado;

  try {
    let aiReply: string | null = null;
    let aiTags: string[] = [];

    if (process.env.GROQ_API_KEY) {
      let nomeEmpresa: string | undefined;
      if (empresa_id) {
        const empresa = await db.get('SELECT nome_empresa FROM empresas WHERE id = ?', [empresa_id]);
        nomeEmpresa = empresa?.nome_empresa;
      }

      // Tags (qualquer rating com comentário, ou fallback por nota)
      try {
        aiTags = await gerarTagsSemanticas(rating, comment || '');
      } catch (e) {
        console.error('Falha ao gerar tags:', e);
      }

      // Resposta IA só para negativas
      if (rating <= 3 && comment) {
        try {
          aiReply = await gerarRespostaReview(name, rating, comment, nomeEmpresa);
        } catch (e) {
          console.error('Falha ao gerar resposta IA:', e);
        }
      }
    }

    await db.run(
      'INSERT INTO reviews (empresa_id, name, rating, comment, ai_reply, ai_tags) VALUES (?, ?, ?, ?, ?, ?)',
      [empresa_id || null, name, rating, comment, aiReply, JSON.stringify(aiTags)]
    );

    console.log('📥 Review salvo:', { name, rating, empresa_id, tags: aiTags.length, temAiReply: !!aiReply });
    res.status(201).json({ success: true, ai_reply: aiReply, ai_tags: aiTags });
  } catch (error) {
    console.error('Erro ao salvar review:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ---- Admin auth ----
app.post('/api/admin/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  try {
    const usuario = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!usuario) return res.status(401).json({ error: 'Credenciais inválidas.' });
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '1d' });
    setAuthCookie(res, token);
    res.json({ success: true, user: { id: usuario.id, email: usuario.email } });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/api/admin/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

app.get('/api/admin/me', autenticarToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

app.get('/api/admin/empresas', autenticarToken, async (_req: AuthRequest, res: Response) => {
  try {
    const empresas = await db.all(
      'SELECT id, cnpj, nome_empresa, status, google_review_url, criado_em, expira_em FROM empresas ORDER BY criado_em DESC'
    );
    res.json(empresas);
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.get('/api/admin/reviews', autenticarToken, async (_req: AuthRequest, res: Response) => {
  try {
    const reviews = await db.all('SELECT * FROM reviews ORDER BY createdAt DESC LIMIT 100');
    res.json(
      reviews.map((r: any) => ({
        ...r,
        ai_tags: r.ai_tags ? safeParseTags(r.ai_tags) : [],
      }))
    );
  } catch (error) {
    console.error('Erro ao listar reviews:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/api/admin/trocar-senha', autenticarToken, async (req: AuthRequest, res: Response) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha) return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  if (novaSenha.length < 8) return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
  if (!/\d/.test(novaSenha)) return res.status(400).json({ error: 'A nova senha deve conter pelo menos um número.' });

  try {
    const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', [req.user?.id]);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha_hash);
    if (!senhaCorreta) return res.status(401).json({ error: 'Senha atual incorreta.' });
    const novoHash = await bcrypt.hash(novaSenha, 10);
    await db.run('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [novoHash, req.user?.id]);
    res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao trocar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    await initDB();
    app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
  } catch (error) {
    console.error('❌ Falha ao inicializar o banco de dados:', error);
    process.exit(1);
  }
}

main();
