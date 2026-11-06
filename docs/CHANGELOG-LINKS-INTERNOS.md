# Changelog — Links internos

## 2026-11-05 — Rodada P1 da auditoria de links internos

- **Branch:** `seo/links-internos-p1-2026-11-05`
- **Base:** `fix/dot-plan-identification` (`5fddbff6b7bdacb58db539d268973f8e0dbe4c49`)
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

### Validação

| Verificação | Resultado |
|---|---|
| `npm run lint` | **Falhou por problema pré-existente**: o script usa `next lint`, que não é um comando válido no Next.js 16.3.8; o Next interpretou `lint` como diretório do projeto. |
| `npx --no-install eslint ...` | **Falhou por dependência ausente**: `eslint-config-next` não está instalado no `frontend`, embora seja importado por `eslint.config.mjs`. |
| `npm run build` | **Passou**: `✓ Compiled successfully in 27.7s`; 152/152 páginas estáticas geradas. O build valida a compilação, mas a validação de tipos é pulada por `typescript.ignoreBuildErrors: true` no `next.config.mjs`. |
| `git diff --check` | Passou, sem erros de whitespace. |
| Destinos HTTP | `200` + canonical correto para `/blog/como-responder-avaliacoes-negativas`, `/blog/qr-code-balcao-reviews` e `/feedback-de-clientes`. |
| Duplicidade e self-link | Passou: cada novo destino aparece uma única vez no corpo da respectiva origem; nenhuma origem aponta para si mesma. |
| Rotas locais | Os três destinos existem em `frontend/src/app`: `feedback-de-clientes/page.tsx`, `blog/qr-code-balcao-reviews/page.tsx` e `blog/como-responder-avaliacoes-negativas/page.tsx`. |

### Observações

- O lint do projeto já estava quebrado antes desta mudança. Corrigir o script ou instalar `eslint-config-next` seria uma alteração separada, fora do escopo deste PR.
- O `frontend/next.config.mjs` usa `typescript.ignoreBuildErrors: true`; o build valida a compilação, mas não substitui um lint/typecheck dedicado.
- A janela do GSC usada na auditoria foi de 36 dias (29/09/2026–03/11/2026), com 583 impressões e 4 cliques. Esta rodada é uma melhoria estrutural, sem garantia de aumento imediato de tráfego.
