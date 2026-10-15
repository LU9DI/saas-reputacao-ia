# Atividades para a próxima publicação conjunta

Não fazer deploy individual no Render para esta tarefa. Acumular com as demais alterações e validar antes da publicação final.

## Pendente de publicação

- [ ] **Filtra.AI — Painel do cliente / Relatório Inteligente:** remover o botão **Exportar PDF** do componente ativo `frontend/src/app/components/RelatorioInteligentePanel.tsx`.
- [ ] Remover também os controles e avisos específicos de PDF (idioma do PDF, bloqueio por plano e mensagens de download), mantendo o seletor de período e os indicadores do relatório.
- [ ] Não alterar os cards de planos nem outros benefícios.
- [ ] Antes do deploy conjunto, executar build/testes do frontend e confirmar que não existe botão de exportação no painel do cliente.
- [ ] Publicar junto das demais atividades aprovadas; não disparar deploy manual isolado no Render.

## Correção de implementação

A primeira alteração foi feita por engano em `frontend/src/components/RelatorioInteligentePanel.tsx`, que não é o componente importado pela página atual do painel. A implementação correta é `frontend/src/app/components/RelatorioInteligentePanel.tsx`. A correção está preparada na branch `fix/remove-pdf-export-batch` para revisão/publicação conjunta.
