# Deploy backend no Railway

## Se o build falhar com `npm ci` / package-lock

O `package-lock.json` foi removido de propósito para o Railpack não usar `npm ci`.

**Root Directory:** `backend`  
**Build Command (se pedir):** `npm install`  
**Start Command:** `npm start`

Ou use o **Dockerfile** em `backend/Dockerfile` (Settings → Builder → Dockerfile).

## Variables obrigatórias

| Nome | Valor |
|------|--------|
| `JWT_SECRET` | ≥ 32 caracteres |
| `NODE_ENV` | `production` |
| `APP_URL` | URL do front Vercel |
| `FRONTEND_URL` | mesma do front |

## Healthcheck

`GET https://sua-api.up.railway.app/api/health`

## Regenerar lock localmente (opcional)

```bash
cd backend
npm install
git add package-lock.json
git commit -m "chore: package-lock"
git push
```
