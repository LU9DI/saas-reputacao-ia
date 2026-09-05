# GitHub Actions — Filtra.IA

## Workflows

| Arquivo | Quando roda | O que faz |
|---------|-------------|----------|
| `ci.yml` | push/PR em `main` | Testes backend (unit + integration), typecheck, build do frontend |
| `deploy.yml` | após CI verde em `main`, ou manual | Template de deploy (Railway / Vercel / VPS) |

## CI (já ativo)

### Backend
- `npm run test:unit`
- `npm run test:integration` (banco SQLite temporário)
- `tsc --noEmit`

### Frontend
- `tsc --noEmit`
- `next build` (com `NEXT_PUBLIC_API_URL` de CI)

## Ativar CD

1. Escolha onde vai hospedar:
   - **API:** Railway, Render, Fly.io ou VPS
   - **Frontend:** Vercel (recomendado para Next.js) ou mesmo host da API

2. No GitHub: **Settings → Secrets and variables → Actions**

   Exemplos de secrets:
   - `RAILWAY_TOKEN`
   - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
   - `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

3. Edite `.github/workflows/deploy.yml` e **descomente** o job do provedor escolhido.

4. Variáveis de produção necessárias no host:
   - `JWT_SECRET` (forte, único)
   - `SQLITE_DB_PATH` ou migrate para Postgres
   - `APP_URL` / `FRONTEND_URL`
   - `NEXT_PUBLIC_API_URL` (URL pública da API)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (se usar billing)
   - SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) para e-mails

## Rodar localmente o que o CI faz

```bash
# Backend
cd backend
npm ci
npm run test:unit
npm run test:integration
npx tsc --noEmit

# Frontend
cd frontend
npm ci
npx tsc --noEmit
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000 npm run build
```
