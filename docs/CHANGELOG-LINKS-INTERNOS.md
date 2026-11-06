# Changelog — Links internos

## 2026-11-06 — Rodada P1 da auditoria de links internos (base: main)

- **Branch:** `seo/links-internos-p1-main-2026-11-06`
- **Base:** `main` (`d22a41337d417802ea1bae33596ab41cc4b22005`)
- **Origem:** cherry-pick de `65b20b3456838f23d42a727dd00721b2828e41a0`
- **Status:** PR para revisão; sem merge e sem deploy.

### Alterações aplicadas

| # | Origem | Destino | Âncora | Prioridade |
|---:|---|---|---|---|
| 1 | `/blog/gestao-reputacao-online-guia` | `/blog/como-responder-avaliacoes-negativas` | `Respostas públicas` | P1 |
| 2 | `/blog/gestao-reputacao-online-guia` | `/blog/qr-code-balcao-reviews` | `link ou QR Code` | P1 |
| 3 | `/blog/qr-code-balcao-reviews` | `/feedback-de-clientes` | `registrar feedback` | P1 |
| 4 | `/blog/review-1-estrela-primeiras-24-horas` | `/feedback-de-clientes` | `feedback privado` | P1 |

### Escopo preservado

- Apenas os 4 links P1 aprovados foram adicionados.
- Nenhum link existente foi alterado, removido ou teve a âncora modificada.
- Todos os novos links estão em parágrafos do corpo do artigo; não há link em heading, introdução, CTA ou rodapé.
- No artigo de 1★, o link usa a ocorrência de `feedback privado` no parágrafo, não o H2.
- Nenhuma página `/indice/*` foi alterada.
- Nenhum metadado, título, description, canonical, schema ou configuração de produção foi modificado.
- O commit contém exclusivamente os três artigos e este changelog; nenhum commit do Filtra DOT foi transportado.

### Validação

| Verificação | Resultado |
|---|---|
| `npm run build` | **Passou** com Next.js 16.4.2: cadeia completa do script `build` concluída; 158 arquivos HTML gerados; `fix-static-html-lang` corrigiu 88; `validate-html-language` passou; 106 markdown twins de runtime gerados. |
| `tsc --noEmit` | **Passou**, sem erros. |
| `eslint .` (lint completo) | **Falhou por problemas pré-existentes**: 301 erros e 2.528 avisos em arquivos não tocados por esta mudança. |
| ESLint escopado nos 3 artigos | **Passou**, exit 0, sem erros ou avisos. |
| `git diff --check` | Passou, sem erros de whitespace. |
| Destinos HTTP | `200` + canonical correto para `/blog/como-responder-avaliacoes-negativas`, `/blog/qr-code-balcao-reviews` e `/feedback-de-clientes`. |
| Duplicidade e self-link | Passou: 4 hrefs adicionados, 0 removidos; cada novo destino aparece uma vez no corpo; o único self-link é o seletor de idioma PT pré-existente (`aria-current="page"`). |
| Rotas locais | Os três destinos existem em `frontend/src/app`: `feedback-de-clientes/page.tsx`, `blog/qr-code-balcao-reviews/page.tsx` e `blog/como-responder-avaliacoes-negativas/page.tsx`. |
| HTML gerado | Os três artigos foram gerados e contêm os novos hrefs. |

### Observações

- O lint completo do `main` já falha antes desta mudança. O script atual é `eslint .` e `eslint-config-next` 16.4.3 está instalado; portanto, a falha histórica de `next lint`/dependência ausente da branch antiga não se aplica a esta base. A falha atual é de dívida de lint em outros arquivos, fora do escopo deste PR.
- O `frontend/next.config.mjs` usa `typescript.ignoreBuildErrors: true`; por isso o typecheck foi executado separadamente com `tsc --noEmit`.
- A janela do GSC usada na auditoria foi de 36 dias (29/09/2026–03/11/2026), com 583 impressões e 4 cliques. Esta rodada é uma melhoria estrutural, sem garantia de aumento imediato de tráfego.
