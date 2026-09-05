# Limpeza da pasta duplicada

## Problema

Existia um **submódulo Git** em:

```text
backend/saas-reputacao-ia/
```

Isso criava uma cópia aninhada do projeto inteiro (outro `backend/`, outro `frontend/`) e gerava confusão sobre qual pasta editar.

No repositório remoto essa entrada foi **removida**.

## No seu PC (obrigatório)

Na **raiz** do projeto (não dentro de `backend/saas-reputacao-ia`):

```bash
cd caminho/para/saas-reputacao-ia
git pull origin main

# Remove referência do submódulo, se ainda existir
git submodule deinit -f backend/saas-reputacao-ia 2>/dev/null || true
git rm -f backend/saas-reputacao-ia 2>/dev/null || true
rm -rf backend/saas-reputacao-ia
rm -rf .git/modules/backend/saas-reputacao-ia 2>/dev/null || true

# Confirme a estrutura correta:
ls backend frontend
# deve listar pastas no MESMO nível, sem saas-reputacao-ia dentro de backend
```

## Estrutura correta

```text
saas-reputacao-ia/
  backend/          ← API (server.ts, rotas, etc.)
  frontend/         ← Next.js (:3000)
  …
```

**Errado:**

```text
saas-reputacao-ia/backend/saas-reputacao-ia/frontend  ← não use
```

## Depois da limpeza

```bash
cd backend && npm run dev
# outro terminal
cd frontend && npm run dev
```

Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)  
Empresa: [http://localhost:3000/login](http://localhost:3000/login)
