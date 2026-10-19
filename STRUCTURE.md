# Estrutura do projeto — Filtra.AI

```text
saas-reputacao-ia/
├── backend/                 # API Express (porta 5000)
│   ├── server.ts            # Bootstrap: middlewares, health, monta rotas
│   ├── routes/              # Rotas HTTP (uma área por arquivo)
│   ├── services/            # Regras de negócio
│   ├── lib/                 # Utilitários (db, auth, mailer, planos, IA…)
│   ├── middleware/          # validate, security, errorHandler
│   ├── tests/
│   └── .env.example
├── frontend/                # Next.js (porta 3000)
│   └── src/app/
│       ├── page.tsx         # Landing + trial
│       ├── login/
│       ├── admin/
│       ├── painel/[id]/    # Painel do cliente
│       ├── avaliacao/[id]/ # Formulário público
│       ├── components/
│       ├── dictionaries/    # pt / en / es / zh
│       ├── Contexts/
│       └── utils/
├── docs/
├── .vscode/
├── DEPLOY.md / GO_LIVE.md
└── STRUCTURE.md
```

## Onde colocar código novo

| Tipo | Pasta |
|------|--------|
| Endpoint HTTP | `backend/routes/` |
| Regra de negócio | `backend/services/` |
| Helper compartilhado | `backend/lib/` |
| Página Next | `frontend/src/app/...` |
| Componente React | `frontend/src/app/components/` |
| Textos i18n | `frontend/src/app/dictionaries/` |

## Não usar

- Manter `backend/` e `frontend/` como diretórios irmãos na raiz.
- Editar regra de negócio em `server.ts` — só bootstrap
- Commitar `.env`, `*.sqlite`, `.aider*`

## Legado (ainda no repo, evitar expandir)

- Relatórios: conteúdo inteligente em texto; endpoints PDF legados respondem HTTP 410
- Os módulos canônicos ficam em `backend/lib/` e `backend/middleware/`; re-exports internos sem uso foram removidos.
