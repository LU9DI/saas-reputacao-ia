# Deploy no Render (API)

## Erro TS2688 (`Cannot find type definition file for 'node'`)

**Causa:** Build com `npm run build` → `tsc`, e em `NODE_ENV=production` o npm **não instala** `devDependencies` (`@types/node`, `typescript`).

**Correção no repo (já aplicada):**
- `npm run build` **não** roda mais `tsc` — a API sobe com `tsx server.ts`
- `tsx` está em **dependencies** (não em devDependencies)

## Configuração do Web Service

| Campo | Valor |
|--------|--------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check | `/api/health` |

Se o painel ainda tiver `npm install && npm run build`, pode deixar — o `build` agora é no-op seguro.

**Alternativa** (se quiser typecheck no build):
```text
npm install --include=dev && npm run typecheck && npm prune --omit=dev
```
Não é necessário para subir a API.

## Variáveis de ambiente (mínimo)

```env
NODE_ENV=production
JWT_SECRET=segredo-com-pelo-menos-32-caracteres
APP_URL=https://seu-front.vercel.app
FRONTEND_URL=https://seu-front.vercel.app
CORS_ORIGINS=https://seu-front.vercel.app
DATABASE_URL=postgresql://...   # Postgres do Render (recomendado)
```

Sem `DATABASE_URL`, a API usa SQLite e avisa no log — em free tier o disco pode sumir no redeploy.

## Postgres no Render

1. **New → PostgreSQL** (free)
2. Copie a **Internal Database URL** (ou External)
3. Cole em `DATABASE_URL` no Web Service
4. Redeploy

Health: `https://SEU-SERVICO.onrender.com/api/health` → `"db":"postgres"` quando conectado.

## Front (Vercel)

```env
NEXT_PUBLIC_API_URL=https://SEU-SERVICO.onrender.com
```

## Failover Render → Oracle

Não é automático. Precisa de URL backup no front e/ou DNS + **mesmo** Postgres. Ver conversa / STRUCTURE.
