# Deploy — Filtra.IA

Arquitetura recomendada:

| Parte              | Host       | Motivo                                         |
| ------------------ | ---------- | ---------------------------------------------- |
| Frontend (Next.js) | **Vercel** | Nativo para Next, HTTPS, CDN                   |
| API (Express)      | **Railway**| Docker fácil, volume para SQLite, healthcheck  |

---

## 1. API no Railway (5–10 min)

1. Crie conta em [railway.app](https://railway.app) e um **New Project**.
2. **Add Service → GitHub Repo** → selecione `saas-reputacao-ia`.
3. Em **Settings → Build**:
   - Builder: **Dockerfile**
   - Dockerfile path: `backend/Dockerfile`
4. **Variables** (Settings → Variables) — mínimo:

```env
JWT_SECRET=gere-um-segredo-longo-aleatorio-32+
NODE_ENV=production
PORT=5000
APP_URL=https://SEU-FRONTEND.vercel.app
FRONTEND_URL=https://SEU-FRONTEND.vercel.app
SQLITE_DB_PATH=/data/database.sqlite
ADMIN_EMAIL=seu@email.com
ADMIN_PASSWORD=SenhaForte@123
```

Opcionais depois: `GROQ_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, SMTP.

. **Volume**: Add Volume montado em `/data` (persistência do SQLite).
. **Networking**: Generate Domain → anote a URL da API (`https://xxx.up.railway.app`).
. Healthcheck: path `/api/health` (já no `railway.toml`).

### Token para GitHub Actions

1. Railway → Account → Tokens → Create
2. GitHub repo → **Settings → Secrets and variables → Actions**:
   - `RAILWAY_TOKEN` = token criado

Deploy manual no Railway já funciona pelo GitHub connect. O workflow só reforça o `railway up` após CI.

---

## 2. Frontend na Vercel (5 min)

1. [vercel.com](https://vercel.com) → **Add New Project** → importe `saas-reputacao-ia`.
2. **Root Directory**: `frontend`
3. Framework: Next.js (detecta sozinho)
4. **Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://SUA-API.up.railway.app
NEXT_PUBLIC_APP_URL=https://SEU-PROJETO.vercel.app
```

. Deploy.

### Secrets para GitHub Actions (deploy automático)

No Vercel: Project → Settings → General → Project ID  
Account/Team → Settings → Tokens

No GitHub (**Settings → Secrets**):

| Secret | Onde pegar |
| `VERCEL_TOKEN` | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | `vercel link` local ou Team ID nas settings |
| `VERCEL_PROJECT_ID` | Project Settings → General |

Atalho local (gera os IDs):

```bash
cd frontend
npx vercel link
# cria .vercel/project.json com orgId e projectId
```

---

## 3. CORS e cookies em produção

No backend, o CORS já está com `origin: true` e `credentials: true`.  
Garanta que:

- `APP_URL` / `FRONTEND_URL` apontam para o domínio Vercel
- Cookie JWT: se for cross-domain (Vercel ≠ Railway), em produção use `SameSite=None; Secure` no `setAuthCookie`

Se o login falhar só em produção, ajuste `backend/lib/auth.ts` para cookies cross-site.

---

## 4. Stripe webhook (quando ativar billing)

1. Stripe Dashboard → Webhooks → Add endpoint  
   URL: `https://SUA-API.up.railway.app/api/webhook/stripe`
2. Copie o signing secret → `STRIPE_WEBHOOK_SECRET` no Railway

---

## 5. Checklist pós-deploy

- [ ] `GET https://API/api/health` → `{ ok: true }`
- [ ] Frontend abre e o formulário de trial responde
- [ ] Login cliente funciona
- [ ] Página `/avaliacao/[slug]` carrega
- [ ] Volume `/data` existe no Railway (banco não zera a cada redeploy)

---

## 6. Fluxo automático

push main → CI (testes + build) → se verde → Deploy workflow
                                      ├─ Railway API (se RAILWAY_TOKEN)
                                      └─ Vercel web (se secrets Vercel)

Sem secrets, o job **pula** com aviso (não quebra o pipeline).
