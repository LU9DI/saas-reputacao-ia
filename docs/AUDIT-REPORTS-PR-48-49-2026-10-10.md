# DOT / Filtra.AI — auditoria das PRs #48 e #49

Data: 2026-10-10

- PR #48: https://github.com/LU9DI/saas-reputacao-ia/pull/48 — aberta, CI falha no backend, guardrail SEO/marca e frontend.
- PR #49: https://github.com/LU9DI/saas-reputacao-ia/pull/49 — aberta, CI falha no frontend, guardrail SEO/marca e backend.

## Risco de regressão PDF
A PR #49 remove o antigo `backend/relatorioPdf.ts` (713 linhas) e substitui o painel de download PDF por distribuição JSON-first. Isso conflita com a orientação prévia de não alterar o conteúdo/fluxo do PDF sem autorização. Não mesclar a PR #49 antes de rever essa decisão e restaurar o comportamento PDF necessário.

O `frontend/src/app/components/PlanCards.tsx` em `main` mapeia ranking e links de unidades para Corporativo/REI e relatório executivo para REI; a presença das chaves de tradução não comprova funcionamento end-to-end.

## Limite
Este relatório documenta o estado remoto observado e não declara as funcionalidades das PRs como operacionais em produção.
