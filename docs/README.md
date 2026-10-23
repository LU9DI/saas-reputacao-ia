# Documentação — Filtra.AI

## Começar

| Doc | Conteúdo |
|------|----------|
| [../README.md](../README.md) | Subir local em 3 min |
| [../SETUP.md](../SETUP.md) | Setup detalhado |
| [../STRUCTURE.md](../STRUCTURE.md) | Onde fica cada coisa |
| [../GO_LIVE.md](../GO_LIVE.md) | Checklist de produção |
| [../DEPLOY.md](../DEPLOY.md) | Render + Vercel |

## Crescimento orgânico

| Doc | Conteúdo |
|------|----------|
| [ESTRATEGIA_EXPANSAO_SEO_PROGRAMATICO.md](ESTRATEGIA_EXPANSAO_SEO_PROGRAMATICO.md) | Estratégia para expandir cobertura orgânica em escala com critérios de qualidade, pesquisa, medição e publicação por lotes |
| [MATRIZ_OPORTUNIDADES_SEO_FILTRA.md](MATRIZ_OPORTUNIDADES_SEO_FILTRA.md) | Hipóteses de expansão específicas do Filtra, comparação com cobertura atual e evidências necessárias antes de criar URLs |

## Backend (guias em `backend/`)

| Doc | Conteúdo |
|------|----------|
| `ADMIN_LOGIN.md` | Login admin |
| `STRIPE_WIRE.md` | Stripe |
| `PIX_WIRE.md` | Mercado Pago / Pix |
| `MFA.md` | MFA admin |
| `SECURITY.md` | Headers, JWT |
| `SECURITY_JWT_WEBAUTHN.md` | WebAuthn |
| `DEPLOY.md` | Env + webhooks + cron |
| `PASSWORD_WIRE.md` | Reset de senha |
| `RESET_ADMIN.md` | Resetar admin |

> Os geradores PDF foram removidos. O painel disponibiliza o relatório inteligente em tela; endpoints PDF legados respondem HTTP 410.

## Limpeza

| Doc | Conteúdo |
|------|----------|
| [../LIMPEZA_ESTRUTURA.md](../LIMPEZA_ESTRUTURA.md) | Pasta duplicada / submódulo |
| [../LIMPEZA_GIT.md](../LIMPEZA_GIT.md) | Bancos no Git |
| [LIMPEZA_CODIGO.md](LIMPEZA_CODIGO.md) | Organização no VS Code |

## Convenções

1. Rotas finas → lógica em `services/` ou `lib/`
2. Validação via `middleware/validate.ts`
3. Erros via `asyncHandler` + `errorHandler`
4. Auth: cookie + `Authorization: Bearer` + `filtra_token` no front
5. Não editar `server.ts` para regra de negócio — só montar rotas
6. Marca: **Filtra.AI** (não Filtra.IA)
