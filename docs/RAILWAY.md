# Deploy backend no Railway

## Erro: `Cannot find module '/app/server.ts'`

O Railway está na **raiz** do repo (`/app`), e o `server.ts` fica em `/app/backend/server.ts`.

### Opção A (recomendada) — Root Directory = backend

1. Settings → **Root Directory** = `backend`
2. **Custom Start Command** = vazio (ou `npm start`)
3. Redeploy

### Opção B — raiz do monorepo

1. **Root Directory** = vazio
2. **Custom Start Command** =
   ```bash
   npm start --prefix backend
   ```
3. **Build Command** (se tiver campo):
   ```bash
   npm install --prefix backend
   ```

O arquivo `railway.toml` na raiz já define esses comandos.

## Variables obrigatórias

| Nome | Valor |
|------|--------|
| `JWT_SECRET` | **≥ 32 caracteres** |
| `NODE_ENV` | `production` |
| `APP_URL` | URL do front Vercel |
| `FRONTEND_URL` | mesma do front |

Opcional: `DATABASE_URL`, Stripe, etc.

## Healthcheck

`GET https://sua-api.up.railway.app/api/health`
