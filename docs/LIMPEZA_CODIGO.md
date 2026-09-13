# Limpeza e organização no VS Code

## 1. Abrir a pasta certa

Abra **somente a raiz** do repositório:

```text
saas-reputacao-ia/     ← File → Open Folder aqui
  backend/
  frontend/
  docs/
```

Não abra `backend/` ou `frontend/` isolados (quebra imports e paths).

## 2. Atualizar e remover cópia aninhada

No terminal integrado (raiz):

```bash
git pull origin main

# se ainda existir submódulo/cópia:
rm -rf backend/saas-reputacao-ia
git submodule deinit -f backend/saas-reputacao-ia 2>/dev/null || true
git rm -f backend/saas-reputacao-ia 2>/dev/null || true
```

## 3. Limpar lixo local (não versionado)

```bash
# caches e builds
rm -rf frontend/.next backend/dist node_modules frontend/node_modules backend/node_modules

# reinstalar
cd backend && npm install && cd ../frontend && npm install
```

Não commitar: `.env`, `*.sqlite`, `.aider*`, `node_modules/`.

## 4. Explorer do VS Code

Com `.vscode/settings.json` o explorer exclui ruído (`node_modules`, `.next`, `*.sqlite`).

Recomendado: extensão **ESLint** + **Prettier** (ver `.vscode/extensions.json`).

## 5. Onde editar o quê

| Objetivo | Arquivo |
|----------|---------|
| Nova rota API | `backend/routes/*.ts` + montar em `server.ts` |
| UI do painel | `frontend/src/app/painel/[id]/page.tsx` |
| Relatório (canais) | `frontend/src/app/components/RelatorioInteligentePanel.tsx` |
| Textos / idiomas | `frontend/src/app/dictionaries/*.json` |
| Login | `frontend/src/app/login/page.tsx` |

## 6. Marca

Sempre **Filtra.AI** (ponto + AI maiúsculo).
