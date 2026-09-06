# Deploy backend no Railway

## Configuração correta

1. **New Project** → Deploy from GitHub → `saas-reputacao-ia`
2. **Root Directory**: `backend` (Settings → Root Directory)
3. **Custom Start Command**: deixe **vazio** (usa `npm start` do package.json)
   - Se precisar forçar: `npm start`
   - **Errado**: `node server.js`, `npm run build && node dist/...`, caminhos da raiz do monorepo

## Variables obrigatórias

| Nome | Exemplo |
|------|--------|
| `JWT_SECRET` | string **≥ 32 caracteres** (sem isso o processo morre na subida) |
| `NODE_ENV` | `production` |
| `APP_URL` | URL do frontend Vercel |
| `FRONTEND_URL` | mesma URL do front |

Opcional: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ALLOW_PLAN_SWITCH=0`

> **PORT**: não fixe `5000` se o Railway injetar `PORT`. O código já usa `process.env.PORT`.

## Crash mais comum

```
JWT_SECRET é obrigatório
```
ou
```
tsx: not found
```

Solução:
1. `JWT_SECRET` com 32+ caracteres nas Variables
2. Root Directory = `backend`
3. Redeploy após o fix do `package.json` (tsx em dependencies)

## Healthcheck

Após subir: `GET https://sua-api.up.railway.app/api/health`
