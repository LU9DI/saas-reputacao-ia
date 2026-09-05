-- Schema Postgres equivalente ao SQLite atual (Filtra.IA)
-- Uso: psql $DATABASE_URL -f docs/schema.postgres.sql

CREATE TABLE IF NOT EXISTS empresas (
  id TEXT PRIMARY KEY,
  cnpj TEXT UNIQUE NOT NULL,
  nome_empresa TEXT NOT NULL,
  slug TEXT UNIQUE,
  status TEXT DEFAULT 'trial',
  plan TEXT DEFAULT 'trial',
  criado_em TIMESTAMPTZ NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  google_review_url TEXT,
  voice_style TEXT,
  empresa_pai_id TEXT,
  whatsapp_suporte TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  cancel_at_period_end INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  cnpj TEXT NOT NULL,
  nome_funcionario TEXT NOT NULL,
  empresa_id TEXT NOT NULL REFERENCES empresas(id),
  senha_hash TEXT NOT NULL,
  email TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  empresa_id TEXT,
  name TEXT,
  rating INTEGER,
  comment TEXT,
  ai_reply TEXT,
  ai_tags TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id SERIAL PRIMARY KEY,
  empresa_id TEXT,
  tipo TEXT NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage (
  plan TEXT NOT NULL,
  month TEXT NOT NULL,
  tags INTEGER DEFAULT 0,
  respostas INTEGER DEFAULT 0,
  PRIMARY KEY (plan, month)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  token_hash TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  usado INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_empresa ON reviews(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cnpj ON usuarios(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_stripe_customer ON empresas(stripe_customer_id);
