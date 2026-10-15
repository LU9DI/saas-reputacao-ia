# Atividades para a próxima publicação conjunta

**Regra de publicação:** não fazer deploy individual no Render para esta tarefa. Acumular com as demais alterações e validar antes da publicação final.

## Filtra.AI — Painel do cliente / Relatório Inteligente

- [x] Identificado o componente ativo: `frontend/src/app/components/RelatorioInteligentePanel.tsx`.
- [x] Removido desse componente o botão **Exportar PDF** e a lógica de geração/download.
- [x] Removidos controles e avisos exclusivos de PDF (idioma, bloqueio por plano e mensagens de download).
- [x] Preservados seletor de período, indicadores, evolução, sentimento, pontos positivos/críticos e recomendações.
- [x] Confirmado por inspeção do código que o componente ativo não contém botão, handler ou gate de exportação PDF.
- [ ] Executar build/testes do frontend antes da publicação.
- [ ] Confirmar a interface no ambiente de validação e publicar junto das demais atividades aprovadas.
- [x] Cards de planos e demais benefícios não foram alterados nesta correção.

## Observação de implementação

A primeira alteração foi feita por engano em `frontend/src/components/RelatorioInteligentePanel.tsx`, um componente legado que não é importado pela página atual do painel. Essa alteração foi revertida nesta branch. A correção efetiva está preparada em `fix/remove-pdf-export-batch` e **não foi publicada em produção por esta branch**.
