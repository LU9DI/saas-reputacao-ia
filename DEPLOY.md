# Deploy — Filtra.AI

Arquitetura de produção:

| Parte | Host | Motivo |
| --- | --- | --- |
| Frontend (Next.js) | **Vercel** | Next.js, HTTPS e CDN |
| API (Express) | **Render** | Serviço web com healthcheck |
| Banco | **Supabase ou Neon** | Postgres gerenciado, separado do app |

## 1. API no Render

1. Crie um **Web Service** apontando para o repositório.
2. Root do serviço: `backend`.
3. Build: `npm ci` ou o comando definido pelo projeto.
4. Start: `npm start`.
5. Configure as variáveis de produção:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=segredo-longo-e-aleatorio
APP_URL=https://filtraai.com
FRONTEND_URL=https://filtraai.com
```

Para produção, use Postgres via `DATABASE_URL`; não dependa de SQLite local.

Healthcheck: `GET /api/health`.

## 2. Frontend na Vercel

- Root Directory: `frontend`
- Framework: Next.js
- `NEXT_PUBLIC_API_URL`: URL pública da API Render
- `NEXT_PUBLIC_APP_URL`: `https://filtraai.com`

O deploy automático usa os secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`.

## 3. Banco

Use Supabase ou Neon como Postgres gerenciado. A URL deve ser configurada apenas no ambiente de produção da API.

Consulte `docs/POSTGRES.md` para o procedimento.

## 4. CORS e cookies

Garanta que `APP_URL`, `FRONTEND_URL` e `CORS_ORIGINS` apontem para o domínio de produção. Em domínio separado, cookies de autenticação devem usar HTTPS e as políticas SameSite adequadas.

## 5. Stripe

Quando billing estiver ativo, configure `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` no Render e aponte o webhook para a URL pública da API.

## 6. Checklist pós-deploy

- [ ] `GET /api/health` retorna `{ ok: true }`
- [ ] Frontend abre sem erro
- [ ] Trial funciona
- [ ] Login funciona
- [ ] Avaliação e painel funcionam
- [ ] Banco Postgres permanece íntegro após redeploy
- [ ] Sitemap público responde em `/sitemap.xml`

## 7. Fluxo

push em `main` → CI → deploy do backend no Render e frontend na Vercel conforme configuração dos provedores.
