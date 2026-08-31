import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import type { Database } from 'sqlite';
import 'dotenv/config';

const app = express();
app.use(express.json({ limit: '10kb' }));

// CORS restrito
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000'].filter(Boolean) as string[];
app.use(cors({ origin: allowedOrigins }));

let db: Database;

// ============================================================
// 1. INICIALIZAÇÃO DO BANCO
// ============================================================
async function initDB() {
  db = await open({ filename: './database.sqlite', driver: sqlite3.Database });

  // Tabela de empresas (trial) com coluna de link do Google
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

  // Migração para bancos antigos
  const colunas = await db.all(`PRAGMA table_info(empresas)`);
  const temColunaGoogle = colunas.some((col: any) => col.name === 'google_review_url');
  if (!temColunaGoogle) {
    await db.exec(`ALTER TABLE empresas ADD COLUMN google_review_url TEXT`);
  }

  // Tabela de usuários admin
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL
    );
  `);

  // Tabela de reviews (avaliações dos clientes)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT,
      name TEXT,
      rating INTEGER,
      comment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Criação do admin padrão (apenas se não existir)
  const adminExiste = await db.get('SELECT * FROM usuarios WHERE email = ?', ['admin@seusaas.com']);
  if (!adminExiste) {
    const senhaPadrao = process.env.ADMIN_PASSWORD || 'MudeEstaSenha123!';
    const hash = await bcrypt.hash(senhaPadrao, 10);
    await db.run('INSERT INTO usuarios (id, email, senha_hash) VALUES (?, ?, ?)', [crypto.randomUUID(), 'admin@seusaas.com', hash]);
    console.log('🔑 Admin padrão criado. Altere a senha após o primeiro login.');
  }
}

// ============================================================
// 2. FUNÇÕES AUXILIARES (CNPJ)
// ============================================================
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

// Validação de review centralizada
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

// ============================================================
// 3. MIDDLEWARE DE AUTENTICAÇÃO JWT
// ============================================================
interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-dev';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não definido! Usando segredo temporário.');
}

function autenticarToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// ============================================================
// 4. RATE LIMITERS
// ============================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' }
});

const trialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Limite de ativações excedido. Tente novamente mais tarde.' }
});

const reviewsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Muitas avaliações enviadas. Tente novamente mais tarde.' }
});

// ============================================================
// 5. ROTA DE ATIVAÇÃO DE TRIAL
// ============================================================
app.post('/api/trial/ativar', trialLimiter, async (req: Request, res: Response) => {
  try {
    const cnpj = normalizarCnpj(req.body.cnpj ?? '');
    const nome = String(req.body.nome_empresa ?? '').trim().slice(0, 120);
    const googleReviewUrl = String(req.body.google_review_url ?? '').trim().slice(0, 200);

    if (!cnpjValido(cnpj)) return res.status(400).json({ error: 'CNPJ inválido.' });
    if (nome.length < 2 || nome.length > 120) return res.status(400).json({ error: 'Nome da empresa inválido.' });

    const id = crypto.randomUUID();
    const criadoEm = new Date();
    const expiraEm = new Date(criadoEm.getTime() + 7 * 24 * 60 * 60 * 1000);

    try {
      await db.run(
        `INSERT INTO empresas (id, cnpj, nome_empresa, google_review_url, criado_em, expira_em)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, cnpj, nome, googleReviewUrl, criadoEm.toISOString(), expiraEm.toISOString()]
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
      link_acesso: `${appUrl}/avaliacao/${id}`,
      expira_em: expiraEm.toISOString()
    });
  } catch (error) {
    console.error('Erro ao ativar trial:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ============================================================
// 6. ROTA DE VALIDAÇÃO DO TRIAL
// ============================================================
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
        google_review_url: empresa.google_review_url || null
      });
    }

    if (empresa.status === 'ativo' || empresa.status === 'trial') {
      return res.json({
        valido: true,
        nome: empresa.nome_empresa,
        google_review_url: empresa.google_review_url || null
      });
    }

    return res.json({
      valido: false,
      motivo: 'inactive',
      nome: empresa.nome_empresa,
      google_review_url: empresa.google_review_url || null
    });
  } catch (error) {
    console.error('Erro ao validar acesso:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ============================================================
// 7. ROTA DE REVIEWS (com validação e rate limit)
// ============================================================
app.post('/api/reviews', reviewsLimiter, async (req: Request, res: Response) => {
  const resultado = validarReview(req.body);
  if ('error' in resultado) return res.status(400).json({ error: resultado.error });

  const { name, rating, comment, empresa_id } = resultado;
  try {
    await db.run(
      'INSERT INTO reviews (empresa_id, name, rating, comment) VALUES (?, ?, ?, ?)',
      [empresa_id || null, name, rating, comment]
    );
    console.log('📥 Review salvo no banco:', { name, rating, comment, empresa_id });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar review:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ============================================================
// 8. LOGIN DE ADMIN
// ============================================================
app.post('/api/admin/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  try {
    const usuario = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!usuario) return res.status(401).json({ error: 'Credenciais inválidas.' });
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) return res.status(401).json({ error: 'Credenciais inválidas.' });
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, user: { id: usuario.id, email: usuario.email } });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ============================================================
// 9. ROTAS PROTEGIDAS
// ============================================================
app.get('/api/admin/empresas', autenticarToken, async (req: AuthRequest, res: Response) => {
  try {
    const empresas = await db.all('SELECT id, cnpj, nome_empresa, status, google_review_url, criado_em, expira_em FROM empresas');
    res.json(empresas);
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.get('/api/admin/reviews', autenticarToken, async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await db.all('SELECT * FROM reviews ORDER BY createdAt DESC LIMIT 100');
    res.json(reviews);
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

// ============================================================
// 10. INICIALIZAÇÃO DO SERVIDOR
// ============================================================
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










