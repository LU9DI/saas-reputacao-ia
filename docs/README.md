# Documentação — Filtra.IA

## Começar

| Doc | Conteúdo |
|------|----------|
| [../README.md](../README.md) | Subir local em 3 min |
| [../SETUP.md](../SETUP.md) | Setup detalhado |
| [../STRUCTURE.md](../STRUCTURE.md) | Onde fica cada coisa |
| [../GO_LIVE.md](../GO_LIVE.md) | Checklist de produção |
| [../DEPLOY.md](../DEPLOY.md) | Railway + Vercel |

## Backend (guias na pasta `backend/`)

| Doc | Conteúdo |
|------|----------|
| `ADMIN_LOGIN.md` | Login admin |
| `STRIPE_WIRE.md` | Stripe |
| `PIX_WIRE.md` | Mercado Pago / Pix |
| `MFA.md` | MFA admin |
| `SECURITY.md` | Headers, JWT |
| `SECURITY_JWT_WEBAUTHN.md` | WebAuthn |
| `RELATORIO_PDF.md` | PDFs |
| `DEPLOY.md` | Env + webhooks + cron |
| `PASSWORD_WIRE.md` | Reset de senha |
| `RESET_ADMIN.md` | Resetar admin no SQLite |

## Limpeza

| Doc | Conteúdo |
|------|----------|
| [../LIMPEZA_ESTRUTURA.md](../LIMPEZA_ESTRUTURA.md) | Pasta duplicada / submódulo |
| [../LIMPEZA_GIT.md](../LIMPEZA_GIT.md) | Bancos no Git |

## Convenções de código

1. Rotas finas → lógica em `services/` ou `lib/`
2. Validação via `middleware/validate.ts`
3. Erros via `asyncHandler` + `errorHandler`
4. Auth: cookie `saas_auth_token` + `Authorization: Bearer` + `filtra_token` no front
5. Não editar `server.ts` para regra de negócio — só montar rotas
