# Manutenção e organização do Filtra.AI

## Estrutura

- `backend/`: API Express, regras de negócio e testes.
- `frontend/`: aplicação Next.js, páginas públicas e painel do cliente.
- `docs/`: documentação funcional, técnica e operacional.
- `infra/`: configurações específicas de infraestrutura.

Abra a raiz do repositório no editor para manter os caminhos relativos e os scripts funcionando.

## Onde alterar

| Objetivo | Local canônico |
|---|---|
| Endpoint HTTP | `backend/routes/` e montagem em `backend/server.ts` |
| Regra de negócio | `backend/services/` ou `backend/lib/` |
| Middleware | `backend/middleware/` |
| Interface do painel | `frontend/src/app/painel/[id]/` e componentes compartilhados |
| Relatório Inteligente | componentes e dicionários usados pelo painel |
| Traduções | `frontend/src/app/dictionaries/` |

## Higiene do repositório

- Use os módulos canônicos em `backend/lib/` e `backend/middleware/`; os antigos re-exports internos foram removidos quando não havia referências no projeto.
- Não adicione dependências sem confirmar uso no código.
- Mantenha `package.json` e `package-lock.json` sincronizados em cada diretório de aplicação.
- Não versione `.env`, credenciais, bancos locais, logs, `node_modules`, `.next` ou artefatos de build.
- Antes de remover rotas ou componentes, procure referências em páginas, links, scripts, workflows e testes.
- Valide com `npm ci`, testes, typecheck e build aplicáveis antes de integrar uma limpeza.

## Marca

Use sempre **Filtra.AI**.
