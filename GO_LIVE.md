# Checklist de go-live — Filtra.IA

Siga na ordem. Marque cada item.

## 0. Pré-requisitos locais

- [ ] `git pull origin main`
- [ ] Backend sobe: `cd backend && npm run dev` → `http://localhost:5000/api/health`
- [ ] Frontend sobe: `cd frontend && npm run dev`
- [ ] Trial local funciona (CNPJ válido → QR → painel)

## 1. Railway (API)

- [ ] Projeto criado + repo conectado
- [ ] Dockerfile path: `backend/Dockerfile`
- [ ] Volume em `/data`
- [ ] Variáveis:
  - `NODE_ENV=production`
  - `JWT_SECRET` (≥ 32 chars, único)
  - `SQLITE_DB_PATH=/data/database.sqlite`
  - `APP_URL=https://SEU-FRONT.vercel.app`
  - `FRONTEND_URL=https://SEU-FRONT.vercel.app`
  - `CORS_ORIGINS=https://SEU-FRONT.vercel.app`
  - `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Domain gerado → anote `https://xxx.up.railway.app`
- [ ] `GET /api/health` retorna `{ ok: true }`

## 2. Vercel (frontend)

- [ ] Root Directory: `frontend`
- [ ] Env: `NEXT_PUBLIC_API_URL=https://xxx.up.railway.app`
- [ ] Env: `NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app`
- [ ] Deploy concluído
- [ ] Página inicial carrega sem erro de API

## 3. Cookies / login cross-domain

Já configurado no código (`SameSite=None` + `Secure` em prod + `trust proxy`).

- [ ] Login no front de produção autentica e o painel carrega dados
- [ ] Se falhar: confira HTTPS nos dois lados e `CORS_ORIGINS`
- [ ] (Opcional) domínio próprio + `COOKIE_DOMAIN=.seudominio.com`

## 4. Stripe

- [ ] `STRIPE_SECRET_KEY` (modo test primeiro) no Railway
- [ ] Webhook no Stripe Dashboard:
  - URL: `https://xxx.up.railway.app/api/webhook/stripe`
  - Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `charge.refunded`
- [ ] `STRIPE_WEBHOOK_SECRET` no Railway
- [ ] Teste: assinar plano Inicial com cartão de teste `4242…`
- [ ] Empresa muda para `status=ativo` e `plan=inicial`
- [ ] E-mail de ativação chega (se SMTP configurado)

## 5. E-mail

- [ ] SMTP no Railway (Resend / SES / etc.)
- [ ] Teste: “esqueci a senha” e ativação de plano

## 6. Segurança final

- [ ] Admin password trocada
- [ ] JWT_SECRET não é o de desenvolvimento
- [ ] Banco `*.db` / `*.sqlite` fora do Git (`git ls-files | findstr db`)
- [ ] CI verde na última commit da `main`

## 7. Smoke test produção (15 min)

1. Ativar trial no site público  
2. Abrir link de avaliação e enviar nota 2 com comentário  
3. Login no painel → ver crítica  
4. Checkout plano Pro (test mode)  
5. Confirmar plano ativo na API `/api/empresa/{id}/assinatura`  
6. Logout / login de novo  

## Se algo falhar

| Sintoma | Causa comum |
| CORS no browser | `CORS_ORIGINS` sem a URL exata do Vercel |
| Login não gruda | Cookie sem HTTPS ou `SameSite` |
| Checkout 503 | `STRIPE_SECRET_KEY` ausente |
| Webhook 400 | `STRIPE_WEBHOOK_SECRET` errado ou body parseado como JSON |
| Banco zera no redeploy | Volume `/data` não montado |
