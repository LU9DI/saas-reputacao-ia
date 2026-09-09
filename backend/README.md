# Filtra.IA — API

Backend Express + Postgres (produção) / SQLite (dev).

## Rodar local

```bash
cp .env.example .env   # preencha JWT_SECRET, etc.
npm install
npm run dev
```

## Produção (Render / Docker)

Obrigatório:

| Variável | Uso |
|----------|-----|
| `JWT_SECRET` | ≥ 32 chars |
| `DATABASE_URL` | Postgres (Supabase/Neon/Render) |
| `ADMIN_EMAIL` + `ADMIN_PASSWORD` | seed do admin (≥ 12 chars) |
| `APP_URL` / `FRONTEND_URL` | links de e-mail e CORS |

Pagamentos / IA (opcional conforme produto):

- Pix: `MP_ACCESS_TOKEN`
- PayPal: `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` + `PAYPAL_MODE=sandbox\|live`
- Stripe: `STRIPE_ENABLED=0` para desligar
- IA: `GROQ_API_KEY` e/ou `GEMINI_API_KEY`
- E-mail: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Start: `npm start` (tsx server.ts).

## Rotas críticas

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/trial/ativar` | Trial 7 dias |
| POST | `/api/auth/login` | Login cliente (CNPJ + senha) |
| POST | `/api/admin/login` | Login admin (e-mail + senha) |
| POST | `/api/pix/avulso` | Pix Mercado Pago |
| GET | `/api/health` | Saúde |

## Documentação extra

Detalhes pontuais ficam em `.env.example` e, se necessário, em `SUPABASE_SETUP.md` / `DEPLOY_CHECKLIST.md`.
