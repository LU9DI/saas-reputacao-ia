/**
 * ============================================================================
 * 🚀 GITHUB SPEC KIT - METADADOS DE ESPECIFICAÇÃO E CONSTITUIÇÃO DO MICRO-SAAS
 * ============================================================================
 *
 * @meta github-spec-kit: true
 * @version 1.2.0
 * @framework Next.js 14 (Frontend) | Node 24 + Express + SQLite (Backend)
 *
 * /constitution (Regras e Padrões de Arquitetura Imutáveis)
 * -------------------------------------------------------------
 * 1. SEGURANÇA: Isolamento estrito de dados por ID da empresa (Tenant Isolation).
 *    Cada funcionário tem **senha própria** (hash bcrypt) porém a **autenticação do
 *    painel usa o mesmo CNPJ da empresa** como identificador de tenant.
 * 2. AUTENTICAÇÃO: Stateless via JWT (24h). O payload do token contém
 *    `nome_funcionario` e `empresa_id` de forma isolada (sem e‑mail).
 * 3. IDIOMAS: Suporte nativo a PT, EN, ES via dicionários estáticos puros de
 *    tradução.
 * 4. CANAL UNIVERSAL: Rastreamento omnicanal via parâmetro `origin` no banco de dados.
 *
 * /plan (Tabela de Precificação, Limites Globais e Regras de IA)
 * --------------------------------------------------
 * - INICIAL (R$ 69,90/mês | R$ 49,90/mês no anual): 150 feedbacks/mês.
 * - PRO (R$ 109,90/mês | R$ 99,90/mês no anual): 400 feedbacks/mês.
 * - ULTRA (R$ 199,90/mês | R$ 149,90/mês no anual): 800 feedbacks/mês. IA + 1 relatório PDF/mês.
 * - CORPORATIVO (R$ 499,90/mês | R$ 429,90/mês no anual): 3.500 feedbacks/mês. Dashboard multi-unidades.
 * - REI (R$ 999,90/mês | R$ 899,90/mês no anual): 10.000 feedbacks/mês. IA prioritária e relatórios avançados.
 *
 * /specify (O Comportamento Desejado do Fluxo Atual)
 * -----------------------------------------------------
 * - TELA DE ATIVAÇÃO (`/ativar` ou `/`): Cadastro (Nome, CNPJ, E-mail, Senha) para iniciar 7 dias grátis.
 *   Grade de planos exibida abaixo. Cliques nos planos redirecionam para inserção de cartão no Stripe.
 * - TELA DE LOGIN (`/login`): Rota isolada para o uso diário de clientes ativos.
 * - RECUPERAÇÃO DE SENHA: via e-mail (`/api/auth/forgot-password` + `/api/auth/reset-password`).
 *
 * /tasks
 * -------------------------------------------------
 * [x] Task 1: Centralizar e unificar o motor de IA no arquivo `server.ts`.
 * [x] Task 2: Atualizar o ID do modelo da Groq para `openai/gpt-oss-120b`.
 * [x] Task wire: Stripe + recuperação de senha + trial com e-mail/senha.
 * ============================================================================
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import type { Database } from 'sqlite';
import 'dotenv/config';
import { mountPasswordResetRoutes, createUsuarioForEmpresa, ensureAuthColumns } from './passwordResetRoutes.js';
import { mountStripeRoutes } from './stripeRoutes.js';
import { stripeConfigured } from './stripeBilling.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cookieParser());
// JSON em todas as rotas, exceto webhook Stripe (precisa do body cru)
app.use((req, res, next) => {
  if (req.originalUrl?.startsWith('/api/webhook/stripe')) return next();
  return express.json({ limit: '20kb' })(req, res, next);
});

const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000'].filter(Boolean) as string[];
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

export let db!: Database;

const COOKIE_NAME = 'saas_auth_token';
const isProd = process.env.NODE_ENV === 'production';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

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

function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'empresa';
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

function linksEmpresa(slugOrId: string, plan: string = 'trial') {
  const key = slugOrId;
  return {
    avaliacao: `${APP_URL}/avaliacao/${key}`,
    painel: `${APP_URL}/painel/${key}`,
    widget: `${APP_URL}/widget/${key}`,
    embed: `<iframe src="${APP_URL}/widget/${key}" width="100%" height="420" frameborder="0" style="border:0;border-radius:12px;" title="Avaliações"></iframe>`,
    whatsapp: montarWhatsAppLink(plan, key),
  };
}

// SEE ARTIFACT server_full.ts — content continues via multi-part restore
export const PLAN_LIMITS: Record<string, number> = {
  trial: 30,
  inicial: 150,
  pro: 400,
  ultra: 800,
  corporate: 3500,
  corporativo: 3500,
  rei: 10000,
};
