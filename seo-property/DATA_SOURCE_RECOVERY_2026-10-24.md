# Recuperação de fonte — Consumidor.gov.br (24/10/2026)

## O que foi confirmado sem automação de navegador paga

A busca indexada do catálogo oficial do Ministério da Justiça continua expondo recursos CSV mensais de **Base Completa**. Foi possível confirmar uma página de recurso oficial e seu URL de download para dezembro de 2025:

- Recurso: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br/resource/a5e4db97-f2f4-4c96-aff0-209e18d3c8ff
- URL de download publicado no catálogo: https://dados.mj.gov.br/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/a5e4db97-f2f4-4c96-aff0-209e18d3c8ff/download/basecompleta2025-12.csv
- Metadados indexados: CSV; licença Creative Commons Atribuição; última atualização indicada em 6 de janeiro de 2026.

A página de catálogo pode ser lida pelo índice de busca, mas o acesso direto ao host `dados.mj.gov.br` retornou HTTP 502 nesta sessão, inclusive para o CSV de janeiro de 2026. A falha é uma limitação de acesso desta tentativa; não prova que o arquivo esteja universalmente indisponível.

## Publicação nova de reclamações finalizadas

A publicação do portal consumidor.gov.br usa arquivos mensais de reclamações finalizadas, distintos da antiga base completa. A fonte secundária DNACX documenta essa série para setembro de 2025 a agosto de 2026 e informa que os arquivos novos não incluem canceladas nem encerradas. Essa evidência serve para orientar a investigação, mas não confirma por si só o esquema nem substitui o arquivo primário.

- Portal oficial: https://www.consumidor.gov.br/pages/dadosabertos/externo/
- Metodologia oficial: https://www.consumidor.gov.br/pages/indicador/geral/abrir
- Fonte secundária e metodologia declarada: https://dnacx.online/reclamacao-por-cliente/tres-numeros-consumidor-gov

A extração textual automatizada do portal oficial não expôs links mensais concretos. Não se deve adivinhar endpoints internos, nomes de colunas, codificação ou delimitador.

## Decisão operacional

1. Manter `data/consumidor-gov-contract.json` bloqueado até obter bytes de um CSV primário e inspecionar seu cabeçalho.
2. Usar o inspector existente para registrar somente URL, mês, tamanho, hash e cabeçalho; não registrar linhas de reclamação.
3. Tratar a base completa antiga e os arquivos novos de finalizadas como fontes/formatos separados.
4. Manter os agregados setoriais DNACX/Kammers em seu contrato próprio, com atribuição e licença, sem promovê-los a pontuações por empresa.
5. Não preencher `data/benchmarks.json`, habilitar páginas de ranking por empresa ou fazer merge/deploy com base apenas na evidência secundária.

## Links de referência

- Catálogo oficial legado: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br
- Recurso oficial dezembro de 2025: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br/resource/a5e4db97-f2f4-4c96-aff0-209e18d3c8ff
- Dataset agregado secundário, CC BY 4.0: https://huggingface.co/datasets/dnacx/tres-numeros-de-resolucao-consumidor-gov
- Versão arquivada do agregado: https://doi.org/10.5281/zenodo.22982134
