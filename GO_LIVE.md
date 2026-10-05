# Checklist de go-live — Filtra.AI

## 0. Pré-requisitos

- [ ] `git pull origin main`
- [ ] Backend sobe localmente e `/api/health` responde
- [ ] Frontend sobe localmente
- [ ] Trial local funciona

## 1. Render (API)

- [ ] Web Service conectado ao repositório
- [ ] Root: `backend`
- [ ] Start: `npm start`
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` forte e exclusivo
- [ ] `DATABASE_URL` aponta para Supabase ou Neon
- [ ] `APP_URL`, `FRONTEND_URL` e `CORS_ORIGINS` configurados
- [ ] `GET /api/health` retorna `{ ok: true }`

## 2. Vercel (frontend)

- [ ] Root: `frontend`
- [ ] `NEXT_PUBLIC_API_URL` aponta para a API Render
- [ ] `NEXT_PUBLIC_APP_URL=https://filtraai.com`
- [ ] Deploy concluído
- [ ] Página inicial carrega sem erros

## 3. Banco

- [ ] Postgres em Supabase ou Neon
- [ ] Migrações/schema aplicados
- [ ] Backup e acesso administrativo protegidos
- [ ] Nenhum segredo commitado

## 4. Cookies / login

- [ ] Login em produção autentica
- [ ] Painel carrega os dados corretos
- [ ] HTTPS ativo nos domínios
- [ ] CORS restrito aos domínios necessários

## 5. Billing e e-mail

- [ ] Stripe configurado somente quando ativado
- [ ] SMTP/Resend configurado quando necessário
- [ ] Teste de recuperação de senha concluído

## 6. Segurança

- [ ] Segredos de desenvolvimento substituídos
- [ ] JWT_SECRET exclusivo
- [ ] Banco SQLite local não usado como produção
- [ ] CI verde na última commit

## 7. Smoke de produção

1. Abrir o site.
2. Iniciar trial.
3. Enviar uma avaliação de teste.
4. Conferir painel.
5. Testar logout/login.
6. Confirmar saúde da API e persistência do Postgres.
