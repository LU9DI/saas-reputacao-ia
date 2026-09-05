# Checklist produção — Filtra.IA (meta nota ~4)

## Obrigatório antes de clientes reais

- [ ] `JWT_SECRET` ≥ 32 chars + plano de rotação (`JWT_SECRET_PREVIOUS`)
- [ ] `STRIPE_SECRET_KEY` + webhook testado (checkout → ativo)
- [ ] Pelo menos uma IA: `GROQ_API_KEY` e/ou `GEMINI_API_KEY`
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` fortes; MFA admin ligado
- [ ] HTTPS no front e na API
- [ ] `WEBAUTHN_RP_ID` + `WEBAUTHN_ORIGIN` = domínio real
- [ ] `ALLOW_PLAN_SWITCH=0` em produção
- [ ] Backup do SQLite **ou** migração Postgres (recomendado >50 empresas)
- [ ] `.env` fora do Git; `*.sqlite` ignorado

## Recomendado

- [ ] VAPID keys para push (`npx web-push generate-vapid-keys`)
- [ ] SMTP para reset de senha
- [ ] Ícones PWA reais (`node frontend/scripts/generate-pwa-icons.mjs` + logo)
- [ ] Monitoramento: `/api/health` + uptime (UptimeRobot etc.)
- [ ] Rate limit já nas rotas de login; revisar proxies (`trust proxy`)

## Comandos

```bash
cd backend && npm i && npm test && npm run dev
cd frontend && npm i && node scripts/generate-pwa-icons.mjs && npm run build
```

## O que ainda impede nota 5

Postgres multi-tenant, fila de jobs, cobertura E2E CI completa, design system documentado, SOC2/—compliance.
