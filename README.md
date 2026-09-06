# Filtra.IA — SaaS de reputação

Micro-SaaS: trial 7 dias → planos (Stripe / Pix / PayPal) → avaliações filtradas → IA (Groq + Gemini) → painel cliente e admin.

## Subir em 3 minutos

```bash
git pull origin main

# Backend
cd backend
cp .env.example .env
# Obrigatório: JWT_SECRET (>=32 chars)
# Pagamentos: STRIPE_SECRET_KEY e/ou MP_ACCESS_TOKEN
npm install
npm run dev
# → http://localhost:5000/api/health

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
# → http://127.0.0.1:3000
```

## Estrutura (resumo)

```text
backend/     API Express + SQLite (server.ts só faz bootstrap)
  routes/    Endpoints
  services/  Regras de negócio
  lib/       Helpers (auth, db, IA, mail…)
frontend/    Next.js — landing, login, painel, admin, avaliação
docs/        Índice da documentação
```

Detalhes: **[STRUCTURE.md](STRUCTURE.md)** · Índice de docs: **[docs/README.md](docs/README.md)**

## Admin

- <http://localhost:3000/admin/login>
- E-mail: `admin@seusaas.com` (ou `ADMIN_EMAIL`)
- Senha: `ADMIN_PASSWORD` no `.env`

## Empresa

- Trial: http://localhost:3000/
- Login: http://localhost:3000/login (CNPJ + senha)

## Testes

```bash
cd backend && npm test
```

## Deploy

backend/          API Express + SQLite
  server.ts       bootstrap + trial/login/reviews
  stripeRoutes.ts checkout + webhook
  adminLoginRoute.ts / mfa.ts / passwordReset*
frontend/         Next.js 14
Veja [DEPLOY.md](DEPLOY.md) e [GO_LIVE.md](GO_LIVE.md).

## Limpeza local (se ainda existir pasta duplicada)

```bash
# ver LIMPEZA_ESTRUTURA.md
rm -rf backend/saas-reputacao-ia
git pull origin main
```
