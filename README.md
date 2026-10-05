# Filtra.AI — SaaS de reputação

Micro-SaaS: trial 7 dias → planos (Stripe / Pix / PayPal) → avaliações filtradas → IA (Groq + Gemini) → painel cliente e admin.

## Subir em 3 minutos

```bash
git pull origin main

# Backend
cd backend
cp .env.example .env
# Obrigatório: JWT_SECRET (>=32 chars)
npm install
npm run dev
# → http://localhost:5000/api/health

# Frontend (outro terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
# → http://127.0.0.1:3000
```

## Estrutura

```text
saas-reputacao-ia/
├── backend/          # API Express (:5000)
│   ├── server.ts     # Bootstrap (só monta rotas)
│   ├── routes/       # Endpoints HTTP
│   ├── services/     # Regras de negócio
│   ├── lib/          # Helpers (db, auth, mail, IA…)
│   └── middleware/
├── frontend/         # Next.js (:3000)
│   └── src/app/      # Páginas + components + dictionaries
├── docs/             # Documentação
└── .vscode/          # Settings do editor (opcional)
```

Detalhes: [STRUCTURE.md](STRUCTURE.md) · Docs: [docs/README.md](docs/README.md)

## Acessos locais

| Quem | URL |
|------|-----|
| Trial / landing | http://localhost:3000/ |
| Login empresa | http://localhost:3000/login |
| Admin | http://localhost:3000/admin/login |

Admin: e-mail `ADMIN_EMAIL` / senha `ADMIN_PASSWORD` no `.env` do backend.

## Testes e deploy

```bash
cd backend && npm test
```

Produção: [DEPLOY.md](DEPLOY.md) · [GO_LIVE.md](GO_LIVE.md)

## Limpeza local

Se ainda existir pasta duplicada:

```bash
# ver LIMPEZA_ESTRUTURA.md
rm -rf backend/saas-reputacao-ia
git pull origin main
```

No VS Code: abra a **raiz** do repo (`saas-reputacao-ia`), não uma subpasta. Settings em `.vscode/`.


<!-- Vercel production deployment trigger: Filtra.AI SEO entity update -->
