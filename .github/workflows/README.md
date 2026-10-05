# GitHub Actions — Filtra.AI

## Workflows

| Arquivo | Quando roda | O que faz |
| --- | --- | --- |
| `ci.yml` | push/PR em `main` | Testes backend, typecheck e build frontend |
| `deploy.yml` | após CI / manual | Deploy do frontend na Vercel conforme secrets configurados |

## Produção

- **API:** Render
- **Frontend:** Vercel
- **Banco:** Supabase ou Neon

Secrets do frontend:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Segredos de banco, API e billing devem ficar no provedor correspondente e nunca no repositório.

## CI local

```bash
cd backend
npm ci
npm run test:unit
npm run test:integration
npx tsc --noEmit

cd ../frontend
npm ci
npx tsc --noEmit
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000 npm run build
```
