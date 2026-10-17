# Limpeza e organização no VS Code

## 1. Abrir a pasta certa

Abra **somente a raiz** do repositório:

```text
saas-reputacao-ia/     ← File → Open Folder aqui
  backend/
  frontend/
  docs/
  .vscode/
```

Não abra `backend/` ou `frontend/` isolados.

## 2. Atualizar e remover cópia aninhada

```bash
git pull origin main

rm -rf backend/saas-reputacao-ia
git submodule deinit -f backend/saas-reputacao-ia 2>/dev/null || true
git rm -f backend/saas-reputacao-ia 2>/dev/null || true
```

## 3. Limpar lixo local

```bash
rm -rf frontend/.next backend/dist
# se precisar reinstalar:
# rm -rf frontend/node_modules backend/node_modules
# cd backend && npm install && cd ../frontend && npm install
```

Não commitar: `.env`, `*.sqlite`, `.aider*`, `node_modules/`.

## 4. Explorer

`.vscode/settings.json` oculta `node_modules`, `.next`, `*.sqlite`.

Extensões: ESLint + Prettier (`.vscode/extensions.json`).

## 5. Onde editar

| Objetivo | Arquivo |
|----------|---------|
| Nova rota API | `backend/routes/*.ts` + montar em `server.ts` |
| UI do painel | `frontend/src/app/painel/[id]/page.tsx` |
| Relatório (canais) | `frontend/src/app/components/RelatorioInteligentePanel.tsx` |
| Textos / idiomas | `frontend/src/app/dictionaries/*.json` |
| Login | `frontend/src/app/login/page.tsx` |

## 6. Legado (não expandir)

- Re-exports: `backend/mailer.ts`, `authMiddleware.ts` → use `lib/` e `middleware/`

## 7. Marca

Sempre **Filtra.AI**.

## Feito nesta limpeza

- [x] README / STRUCTURE / docs com Filtra.AI
- [x] `.vscode` settings + extensions
- [x] `next.config` rewrite só em dev
- [x] Dicionários PT/EN/ES/ZH com chaves do painel
- [x] Geradores PDF removidos; endpoints legados respondem HTTP 410
