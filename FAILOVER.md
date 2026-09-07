# Failover automático de API (Render → Oracle / backup)

Funciona **no frontend**, como Groq → Gemini: se a API principal cair, tenta a de backup.

## Variáveis na Vercel (Frontend)

```env
# Principal (Render)
NEXT_PUBLIC_API_URL=https://filtra-api.onrender.com

# Stand-by (Oracle, segundo Render, Fly, etc.)
NEXT_PUBLIC_API_URL_BACKUP=https://api.seudominio-oracle.com

# Opcional: mais bases, separadas por vírgula
# NEXT_PUBLIC_API_URLS=https://extra1.com,https://extra2.com
```

Redeploy o front depois de salvar.

## Como o código decide

Arquivo: `frontend/src/app/utils/apiFailover.ts`

1. Tenta a base **sticky** (última que funcionou, 5 min)
2. Depois `NEXT_PUBLIC_API_URL`
3. Depois `NEXT_PUBLIC_API_URL_BACKUP`
4. Depois lista `NEXT_PUBLIC_API_URLS`

Troca se:
- erro de rede / timeout (~12s)
- HTTP **502, 503, 504, 521, 522**

Uso recomendado:

```ts
import { apiFetch } from './utils/apiFailover';

const res = await apiFetch('/api/trial/ativar', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

`getEnv('NEXT_PUBLIC_API_URL')` já devolve a base sticky/primary (compatível com código antigo).

## Dados iguais nos dois servidores (obrigatório de verdade)

Se cada host tiver **SQLite próprio**, o failover sobe a API, mas o **login/trial do outro some**.

Solução:

| Host | `DATABASE_URL` |
|------|----------------|
| Render | mesma URL Postgres |
| Oracle | **a mesma** URL Postgres (ex.: Neon free, Supabase, Render Postgres external) |

Ambos também com o **mesmo** `JWT_SECRET`.

## CORS

Nos **dois** backends:

```env
CORS_ORIGINS=https://seu-app.vercel.app
FRONTEND_URL=https://seu-app.vercel.app
APP_URL=https://seu-app.vercel.app
```

## Checklist rápido

1. [ ] API principal no ar (`/api/health`)
2. [ ] API backup no ar (`/api/health`)
3. [ ] Mesmo `DATABASE_URL` + `JWT_SECRET` nos dois
4. [ ] Vercel com `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_API_URL_BACKUP`
5. [ ] Redeploy front
6. [ ] Teste: desligue a principal e faça login / trial — deve cair na backup

## Limitação

Cookies `HttpOnly` são **por domínio**. Token em `localStorage` (`filtra_token`) + header `Authorization` continua válido em qualquer base. Cookie de sessão de um host **não** vale no outro — por isso o front já grava `filtra_token`.
