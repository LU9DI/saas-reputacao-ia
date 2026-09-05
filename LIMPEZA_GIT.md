# Limpeza Git — banco e artefatos

## 1. Parar de trackear bancos (obrigatório no seu PC)

```bash
cd C:\Projetos\saas-reputacao-ia

git rm --cached backend/prisma/dev.db 2>nul
git rm --cached -r data 2>nul
git rm --cached *.sqlite 2>nul
git rm --cached **/*.db 2>nul

git add .gitignore backend/.gitignore
git commit -m "chore: stop tracking database files"
git push origin main
```

## 2. Remover do histórico (recomendado se o repo já foi compartilhado)

```bash
npx git-filter-repo --path backend/prisma/dev.db --invert-paths
npx git-filter-repo --path-glob "*.sqlite" --invert-paths
npx git-filter-repo --path-glob "*.db" --invert-paths

git push origin main --force
```

> **Atenção:** `--force` reescreve o histórico. Avise qualquer colaborador.

## 3. Conferir

```bash
git ls-files | findstr /i "sqlite .db"
```

Não deve listar arquivos de banco.

## 4. O que já foi feito neste commit

- `.gitignore` reforçado (`*.db`, `*.sqlite`, `backend/prisma/*.db`, `data/`)
- Camada `backend/services/` (trial, review, auth)
- Routes finas com `asyncHandler`
- Layout dos planos: grid até 5 colunas + texto abaixo sempre visível
- Testes de integração HTTP em `backend/tests/integration.trial.test.ts`
