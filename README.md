# Filtra.IA — SaaS de reputação

Micro-SaaS: trial 7 dias → planos Stripe → avaliações filtradas → IA (Groq) → painel admin.

## Subir em 3 minutos

```bash
git pull origin main

# Backend
cd backend
cp .env.example .env
# OBRIGATÓRIO no .env:
#   JWT_SECRET=troque-por-pelo-menos-32-caracteres
#   STRIPE_SECRET_KEY=sk_test_...   (senão o checkout não abre)
npm install
npm run dev
# → http://localhost:5000/api/health

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
# → http://127.0.0.1:3000
```

Ou na raiz (depois de `npm install` na raiz):

```bash
npm run dev
```

## Checkout não redireciona?

1. Backend deve responder: `curl http://127.0.0.1:5000/api/health`
2. `.env` com `STRIPE_SECRET_KEY=sk_test_...`
3. Reinicie o backend após editar o `.env`
4. Clique em **Assinar plano** — se faltar Stripe, a tela mostra o erro

Teste direto:

```bash
curl -s -X POST http://127.0.0.1:5000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"plano":"pro"}'
```

Deve retornar `checkout_url`.

## Admin

- <http://localhost:3000/admin/login>
- E-mail: `admin@seusaas.com` (ou `ADMIN_EMAIL`)
- Senha: `ADMIN_PASSWORD` no `.env` (padrão `MudeEstaSenha123!`)

## Testes

```bash
cd backend && npm test
```

## Estrutura

backend/          API Express + SQLite
  server.ts       bootstrap + trial/login/reviews
  stripeRoutes.ts checkout + webhook
  adminLoginRoute.ts / mfa.ts / passwordReset*
frontend/         Next.js 14

Veja também `SETUP.md`.
