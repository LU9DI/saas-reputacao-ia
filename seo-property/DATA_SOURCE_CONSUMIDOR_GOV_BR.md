# Avaliação de fonte pública: Consumidor.gov.br

## Resultado da pesquisa

O conjunto oficial **Dados Consumidor.gov.br**, mantido pela Secretaria Nacional do Consumidor (Senacon/MJ), disponibiliza arquivos CSV mensais e informa licença Creative Commons Atribuição (CC BY). Catálogo: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br

Referências públicas:
- Descrição oficial e acesso aos dados: https://www.gov.br/mj/pt-br/assuntos/seus-direitos/consumidor/consumidor-gov.br
- Indicadores e metodologia oficial: https://www.consumidor.gov.br/pages/indicador/geral/abrir
- Dicionário de dados publicado pela Senacon: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br/resource/90aedbfe-3c91-4c18-86a5-f408d07e7210

## Adequação

A fonte é uma candidata para um **índice de desempenho no Consumidor.gov.br**: índice de solução, satisfação com atendimento, percentual de reclamações respondidas e prazo médio de resposta. Esses indicadores são definidos pelo próprio portal e descrevem somente as reclamações registradas nele.

Ela **não é automaticamente uma fonte para o atual índice de reputação geral**. Não devemos renomear satisfação com o atendimento como nota geral de reputação, nem inferir o estado de localização da empresa a partir do estado do consumidor. Também não devemos inferir que as empresas participantes representam todo o mercado.

## Próximo passo técnico obrigatório

Antes de gerar páginas, baixar uma versão mensal recente, conferir cabeçalhos contra o dicionário oficial e construir um perfil local da estrutura sem imprimir ou guardar textos de reclamação. O pipeline deve:
1. fixar o URL, mês, licença e data de obtenção do arquivo;
2. reconhecer a versão do esquema explicitamente e falhar em cabeçalhos desconhecidos;
3. agregar apenas os campos necessários, descartando textos livres e identificadores de consumidores;
4. calcular os indicadores segundo a metodologia oficial, com período e denominadores explícitos;
5. aplicar limites mínimos de amostra e proteção contra reidentificação;
6. validar totais agregados contra os indicadores oficiais para uma amostra de períodos/segmentos;
7. guardar atribuição e trilha de auditoria e publicar só agregados revisados.

## Decisão

Fonte **promissora para um produto de dados separado e claramente rotulado**, condicionada à validação do esquema CSV e à revisão de privacidade. Não preencher `data/benchmarks.json` do índice geral com esses indicadores sem uma mudança explícita de modelo e rótulos.
