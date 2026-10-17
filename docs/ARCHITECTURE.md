# Arquitetura do repositório

## Visão geral

```
saas-reputacao-ia/
├── backend/                 # API Express + SQLite
│   ├── server.ts            # Entrypoint
│   ├── lib/                 # Utilitários (db, auth, cors, quota, mailer…)
│   ├── middleware/          # validate, errorHandler, authFactory
│   ├── routes/              # HTTP thin (trial, auth, empresa, review, relatório…)
│   ├── services/            # Regra de negócio (trial, review, billing, auth)
│   ├── tests/
│   ├── stripeRoutes.ts      # (legado na raiz — preferir routes/ no próximo passo)
│   ├── stripeBilling.ts
│   ├── groqService.ts
│   ├── mfa.ts
├── frontend/                # Next.js App Router
│   └── src/app/
├── docs/                    # Documentação
├── DEPLOY.md / GO_LIVE.md
└── .github/workflows/
```

## Camadas (backend)

| Camada | Responsabilidade |
|--------|------------------|
| `routes/` | HTTP, status codes, rate limit |
| `services/` | Regras de negócio |
| `lib/` | DB, JWT, CORS, quota, e-mail, CNPJ |
| `middleware/` | Validação e erros |

Arquivos ainda na **raiz do backend** (`stripe*`, `mfa`, `groqService`) são legados com comportamento estável. Imports antigos (`quota.ts`, `mailer.ts`) **re-exportam** de `lib/` para não quebrar nada.

## Frontend

```
frontend/src/
  app/           # páginas (App Router)
  components/    # UI reutilizável (PlanCards, DashboardCharts)
  publicas/      # telas públicas auxiliares (ex.: bloqueio)
  utils/
```

## O que não versionar

- `*.db`, `*.sqlite`, `data/`
- `node_modules/`, `.next/`, `dist/`
- `.env*`
- `.aider*`

Se `prisma/dev.db` ainda aparecer no Git:

```bash
git rm --cached backend/prisma/dev.db
git commit -m "chore: parar de versionar sqlite"
```
