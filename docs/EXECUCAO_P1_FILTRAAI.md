# Execução P1 — Links internos contextuais para o Índice Filtra.AI

**PR:** #201 — `seo/p1-links-contextuais-2026-11-08`
**Repositório:** `LU9DI/saas-reputacao-ia`
**SHA final:** `pending` (será preenchido após o commit e push)
**Base:** `origin/main` = `9be7edaba9a4af2107a480a476247ff9f5cacf32` (Merge PR #200)
**Data:** 08/11/2026

---

## 1. Estado inicial

- Branch anterior: `auditoria/seo-aeo-geo-filtra-ai` (em `61e0df5b`, preservada)
- Branch de trabalho: `seo/p1-links-contextuais-2026-11-08`, criada a partir de `9be7edab` (origin/main)
- O branch remoto `origin/seo/p1-links-contextuais-2026-11-08` já existia em `c26c903b` (HEAD de referência informado na tarefa)
- Working tree: limpo antes e depois das alterações
- Não houve reset, clean, rebase destrutivo ou force push
- Merge do remoto no branch local para preservar todos os commits (não é merge para main)

## 2. Alterações implementadas (7 arquivos de código + 2 novos)

| # | Arquivo | Alteração | Destino |
|---|---------|-----------|---------|
| 1 | `frontend/src/app/components/SeoPageHeader.tsx` | Link do header para o Índice | `/indice` |
| 2 | `frontend/src/app/preview/page.tsx` | Link contextual da home para o ranking nacional | `/indice/rankings/ativos` |
| 3 | `frontend/src/app/blog/reputacao-online-hoteis/page.tsx` | Link contextual no artigo de hotéis | `/indice/rankings/ativos/hoteis` |
| 4 | `frontend/src/app/blog/reputacao-online-clinicas/page.tsx` | Link contextual no artigo de clínicas | `/indice/rankings/ativos/clinicas` |
| 5 | `frontend/src/app/blog/reputacao-franquias-multilocal/page.tsx` | Link contextual no artigo de franquias | `/indice/rankings/ativos/franquias` |
| 6 | `frontend/src/app/blog/avaliacoes-google-restaurantes/page.tsx` | Link contextual no artigo de restaurantes | `/indice/rankings/ativos/restaurantes` |
| 7 | `frontend/package.json` | Scripts `test:seo:p1-links` e `test:p1-internal-links` | — |

**Arquivos novos:**
- `frontend/scripts/test-seo-p1-links.mjs` — suite de testes da rodada P1 (11 testes)
- `frontend/scripts/test-p1-internal-links.mjs` (do remoto) — verificações P1-1 a P1-6
- `docs/EXECUCAO_P1_FILTRAAI.md` — este documento

**Preservação dos links do PR #199:** confirmada via teste (4 links mantidos):
- `/blog/gestao-reputacao-online-guia` → `/blog/como-responder-avaliacoes-negativas`
- `/blog/gestao-reputacao-online-guia` → `/blog/qr-code-balcao-reviews`
- `/blog/qr-code-balcao-reviews` → `/feedback-de-clientes`
- `/blog/review-1-estrela-primeiras-24-horas` → `/feedback-de-clientes`

**Restrições respeitadas:**
- Nenhum self-link nos artigos alterados
- Nenhum link para páginas noindex/teste (`/preview/teste`, `/teste`)
- Nenhum novo link `/zh/`
- Textos PT/EN/ES/ZH consistentes (home usa ternários de idioma; header e artigos usam português, consistente com o padrão existente)
- Não houve alteração de metadados, canonical, schema ou sitemap
- Não houve alteração de DNS, Cloudflare, Render, Supabase ou billing

## 3. Testes executados

### `npm run test:seo:p1-links` (script local)

```
✔ SeoPageHeader contém link para /indice
✔ Homepage (preview) contém link para /indice/rankings/ativos
✔ Artigo hoteis contém link para /indice/rankings/ativos/hoteis
✔ Artigo clinicas contém link para /indice/rankings/ativos/clinicas
✔ Artigo franquias contém link para /indice/rankings/ativos/franquias
✔ Artigo restaurantes contém link para /indice/rankings/ativos/restaurantes
✔ Links do PR #199 estão preservados
✔ Ausência de self-links nos artigos alterados
✔ Ausência de links para páginas noindex/de teste
✔ Destinos /indice existem nos hrefs dos arquivos alterados
✔ Hreflang/idioma não afetado (sem novos links /zh/)
```

**Resultado:** 11/11 aprovados, 0 falhas.

### `npm run test:p1-internal-links` (script do remoto)

Adicionado ao `frontend/package.json`. Verificações para P1-1 a P1-6 e regressão dos quatro links do PR #199.

### ESLint (arquivos modificados)

```
0 errors, 0 warnings
```

### Build de produção (`npm run build`)

O Next.js build foi concluído com sucesso. Todas as 158 páginas estáticas foram geradas, o guardrail de idioma passou, e os 106 markdown twins foram gerados.

**Observação (pré-existente, não causada por esta PR):** o passo `audit-meta-descriptions.mjs` reportou 5 falhas de "escopo não suportado" na homepage (`/`) e em `/turismo`. Esses problemas são **pré-existentes** — confirmado via `git diff` que nenhum desses arquivos foi alterado nesta PR.

## 4. Validação dos 4 destinos do Índice (produção)

| URL | HTTP | Tempo |
|-----|------|-------|
| `https://filtraai.com/indice` | 200 | ~2.1s |
| `https://filtraai.com/indice/rankings/ativos/restaurantes` | 200 | ~0.5s |
| `https://filtraai.com/indice/sp/sao-paulo/restaurantes` | 200 | ~0.25s |
| `https://filtraai.com/indice/rankings/ativos/restaurantes/rj` | 200 | ~0.2s |

Todos os 4 destinos estão acessíveis em produção com HTTP 200, canonical correto e indexação permitida.

## 5. Deploy de preview Vercel

**Pendente** — depende do push para o branch `seo/p1-links-contextuais-2026-11-08`, que disparará o preview do Vercel. Após o push, verificar:
- Estado do deployment no painel do Vercel
- HTML renderizado das páginas alteradas
- Autorização para acessar o preview (se houver bloqueio, registrar)

## 6. Checks do GitHub

**Pendente** — depende do push para disparar o CI do PR #201. Os checks relevantes:
- `seo-brand` (SEO + brand guardrail)
- `frontend` (static export + auditoria de indexabilidade)
- `frontend-vercel` (Vercel build)
- `backend` (test + typecheck)
- `indice` (testes + build do Índice)

## 7. PR #201

**Pendente** — após o push, o PR precisa ser atualizado/revisado. O estado draft deve ser retirado somente quando todos os checks obrigatórios estiverem verdes.

## 8. Pendências

| Item | Status | Observação |
|------|--------|------------|
| SHA final do commit | pendente | Será preenchido após o commit e push |
| Push para `origin` | pendente | Aguardando execução |
| Preview Vercel | pendente | Depende do push |
| Checks GitHub CI | pendente | Depende do push |
| Retirar draft do PR #201 | pendente | Depende de checks verdes |
| Meta audit (`/`, `/turismo`) | preexistente | Não causado por esta PR; documentado como risco residual |

---

*Este documento será atualizado com o SHA final e o status dos checks após o commit e push.*
