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


## Resultado de recuperação automatizada (GitHub Actions, 25/10/2026)

A verificação foi executada também em um runner externo ao ambiente desta conversa:

- Catálogo antigo e CSV legado em dados.mj.gov.br: falha de conexão (fetch failed) no runner.
- Página oficial atual https://www.consumidor.gov.br/pages/dadosabertos/externo/: HTTP 200, mas a resposta HTML não expôs um arquivo CSV diretamente; o próprio índice pesquisável do portal reportou erro de conexão e tabela sem dados.
- Internet Archive CDX: resposta HTTP 200 para as consultas de dezembro de 2025 e janeiro de 2026, mas zero capturas exatas para as quatro combinações testadas (HTTPS/HTTP para cada CSV).

Execuções:
- Diagnóstico das fontes oficiais: https://github.com/LU9DI/saas-reputacao-ia/actions/runs/40145201945
- Recuperação por arquivo histórico: https://github.com/LU9DI/saas-reputacao-ia/actions/runs/40145201980

As duas verificações terminaram com sucesso como diagnósticos; isso significa que executaram e reportaram o estado, não que o CSV foi recuperado. Próxima tentativa deve descobrir os links/API usados pela interface atual ou localizar um espelho histórico confiável, sem adivinhar esquema nem promover dados secundários a dados primários.


## Inspeção da interface atual (25/10/2026)

Uma execução adicional no runner buscou a página oficial e inspecionou 22 arquivos JavaScript públicos referenciados nela, sem registrar HTML bruto nem código-fonte. A página respondeu HTTP 200, mas a inspeção encontrou zero candidatos explícitos a CSV/ZIP/download/API ligados aos dados abertos. Isso é consistente com a página indexada mostrar erro de conexão na tabela; não fornece um endpoint de download seguro para usar.

Execução: https://github.com/LU9DI/saas-reputacao-ia/actions/runs/40145249920

Decisão: não criar endpoint adivinhado nem desbloquear ingestão. A alternativa prática imediata continua sendo usar o agregado setorial já documentado como produto separado, enquanto se procura uma cópia arquivada verificável ou se obtém do portal oficial o link real do recurso.


## Atualização da pesquisa pública (25/10/2026)

A indexação pública do catálogo oficial ainda lista recursos CSV `basecompletaAAAA-MM.csv` até junho de 2026. A página de recurso de janeiro de 2026 confirma formato CSV, licença Creative Commons Atribuição e URL de download; a de abril de 2026 confirma a mesma estrutura de catálogo/licença. Isso demonstra que os recursos existem no catálogo indexado, mas não resolve a falha DNS/conexão observada pelo runner e não equivale a baixar/validar os bytes.

- Catálogo oficial, com a lista mensal: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br
- Recurso janeiro de 2026: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba
- Recurso abril de 2026: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br/resource/a0ca4dfd-5a15-4577-a981-c60fe503c6fe
- Metodologia oficial dos indicadores: https://www.consumidor.gov.br/pages/conteudo/publico/1

A metodologia oficial define o Índice de Solução como (resolvidas + não avaliadas) / finalizadas; já a série mensal secundária de taxa de resolução divide resolvidas por avaliadas (resolvidas + não resolvidas), excluindo as não avaliadas. O site precisa nomear esses indicadores separadamente, nunca trocar seus rótulos ou compará-los como se fossem a mesma taxa.

Execuções de validação no commit anterior: CI completo passou em https://github.com/LU9DI/saas-reputacao-ia/actions/runs/40145291410; a verificação específica do contrato passou em https://github.com/LU9DI/saas-reputacao-ia/actions/runs/40145291321. Isso valida o código/contrato e as páginas geradas, não a recuperação dos CSVs oficiais.
