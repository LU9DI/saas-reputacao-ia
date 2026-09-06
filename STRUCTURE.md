# Estrutura do projeto — Filtra.IA

```text
saas-reputacao-ia/
├── backend/                 # API Express (porta 5000)
│   ├── server.ts            # Bootstrap: middlewares, health, monta rotas
│   ├── routes/              # Rotas HTTP (uma área por arquivo)
│   ├── services/            # Regras de negócio (trial, auth, review, billing)
│   ├── lib/                 # Utilitários (db, auth, mailer, planos, IA…)
│   ├── middleware/          # validate, security, errorHandler
│   ├── tests/               # Unit + integration
│   ├── scripts/             # Jobs manuais (backfill etc.)
│   ├── *.md                 # Guias pontuais (Stripe, Pix, MFA…)
│   └── .env.example
├── frontend/                # Next.js (porta 3000)
│   └── src/app/
│       ├── page.tsx         # Landing + trial
│       ├── login/           # Login empresa
│       ├── admin/           # Painel admin
│       ├── painel/[id]/    # Painel do cliente
│       ├── avaliacao/[id]/ # Formulário público
│       ├── components/      # UI reutilizável
│       └── utils/
├── docs/                    # Índice da documentação
├── DEPLOY.md / GO_LIVE.md   # Produção
└── STRUCTURE.md             # Este arquivo
```

## Onde colocar código novo

| Tipo | Pasta |
|------|--------|
| Endpoint HTTP | `backend/routes/` |
| Regra de negócio | `backend/services/` |
| Helper compartilhado | `backend/lib/` |
| Página Next | `frontend/src/app/...` |
| Componente React | `frontend/src/app/components/` |

## Não usar

- Subpasta `backend/saas-reputacao-ia/` (cópia aninhada — ver `LIMPEZA_ESTRUTURA.md`)
- Arquivos `finishBootstrap.ts` / stubs `@deprecated` na raiz do backend (legado)
- Commitar `.env`, `*.sqlite`, `.aider*`

## Docs rápidos

Veja `docs/README.md`.
