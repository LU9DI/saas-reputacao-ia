# GitHub Actions — Filtra.AI

## Workflows

| Arquivo | Quando roda | O que faz |
| --- | --- | --- |
| `ci.yml` | push/PR em `main` | Testes backend, guardrails de SEO/marca, build e auditoria do export estático do frontend, build em modo Vercel |

Não há workflow de deploy no repositório: o deploy é automático, feito pelas integrações dos provedores a cada push na `main`.

## Produção

- **API:** Render
- **Frontend (site principal):** Render (runtime do frontend)
- **SEO metadata (`/robots.txt`, `/sitemap.xml`):** Vercel, servida pelo Worker `filtra-indexnow-key` do Cloudflare
- **Índice (`/indice`):** Render, serviço Node separado
- **Banco:** Supabase ou Neon

A Vercel faz deploy automático via integração GitHub (App da Vercel), sem secrets de repositório.

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
