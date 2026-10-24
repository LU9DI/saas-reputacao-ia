# Avaliação de fonte pública: Consumidor.gov.br

## Fonte e versão de referência

O conjunto oficial **Dados Consumidor.gov.br**, mantido pela Secretaria Nacional do Consumidor (Senacon/MJ), publica arquivos CSV mensais sob licença Creative Commons Atribuição (CC BY).

- Catálogo oficial: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br
- Base mensal de janeiro de 2026 (CSV): https://dados.mj.gov.br/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba/download/basecompleta2026-01.csv
- Base mensal de junho de 2026 (CSV): consultar o recurso mais recente no catálogo, pois os identificadores dos recursos são específicos por mês.
- Dicionário de dados disponível no catálogo: https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br/resource/90aedbfe-3c91-4c18-86a5-f408d07e7210
- Indicadores e metodologia oficial: https://www.consumidor.gov.br/pages/indicador/geral/abrir
- Definições oficiais dos indicadores: https://www.consumidor.gov.br/pages/conteudo/publico/1
- Página oficial de painel estatístico e dados abertos: https://consumidor.gov.br/pages/conteudo/publico/62
- Interface oficial de publicações de dados abertos: https://www.consumidor.gov.br/pages/dadosabertos/externo/

O catálogo lista recursos mensais até junho de 2026. O recurso de janeiro de 2026 identifica o formato como CSV e a licença como Creative Commons Atribuição. A existência do recurso no catálogo não significa que o conteúdo já tenha sido baixado, inspecionado ou validado pelo projeto.

## Adequação e limites

A fonte serve para um produto claramente rotulado como **desempenho no Consumidor.gov.br**, não como índice geral de reputação. A participação é formal e voluntária; os dados representam reclamações registradas na plataforma, não todas as empresas nem toda a experiência de consumidores brasileiros.

Não renomear satisfação com o atendimento como nota geral de reputação. Não inferir UF da empresa pela localização do consumidor, nem presumir que as empresas participantes representam o mercado inteiro. Não combinar esses indicadores com avaliações privadas do Filtra sem autorização e uma metodologia distinta, documentada.

## Definições oficiais a implementar

Considerando apenas reclamações finalizadas segundo a metodologia oficial:

1. **Índice de solução** = (finalizadas avaliadas como resolvidas + finalizadas não avaliadas) / total de finalizadas. A regra oficial contabiliza as finalizadas não avaliadas como resolvidas.
2. **Satisfação com o atendimento** = soma das notas de satisfação / número de reclamações avaliadas. Usar apenas avaliações com nota válida na escala de 1 a 5.
3. **Reclamações respondidas** = reclamações finalizadas respondidas / total de reclamações finalizadas.
4. **Prazo médio de resposta** = soma dos dias entre abertura e resposta nas reclamações finalizadas respondidas / número dessas reclamações respondidas.

Os denominadores devem ser apresentados junto aos resultados. Não calcular uma métrica quando os campos necessários estiverem ausentes ou quando o denominador for zero. Não presumir que as colunas e seus valores têm esses significados sem confirmar o esquema do CSV e o dicionário.

## Estado de validação em 2026-10-24

- Catálogo oficial e recurso de janeiro de 2026 localizados.
- Metodologia oficial dos quatro indicadores consultada.
- A tentativa de baixar o CSV diretamente nesta sessão falhou; portanto, **o esquema real do arquivo ainda não foi inspecionado**.
- Foi identificada a interface oficial alternativa do Consumidor.gov.br para Dados Abertos. Na consulta mais recente, a página de publicações carregou, mas a tabela de dados abertos exibiu erro de conexão e nenhum registro; isso não comprova indisponibilidade global nem disponibiliza um arquivo substituto.
- A página oficial de indicadores exibe a metodologia e as categorias dos indicadores, mas a tabela de ranking veio sem linhas nesta consulta. Não usar capturas incompletas como fonte de números.
- O dicionário publicado é versão 3.0, datado de 23/09/2020. Deve ser comparado com os cabeçalhos reais de uma amostra recente antes de ser considerado suficiente.
- Nenhum benchmark real foi produzido; `data/benchmarks.json` permanece vazio deliberadamente.

## Descoberta automatizada do catálogo

Foi adicionado um comando que consulta apenas o endpoint oficial CKAN `package_show`, valida a identidade do conjunto de dados e lista metadados de recursos mensais cujo nome, domínio, caminho, UUID e mês correspondem ao padrão esperado. Ele não baixa nem imprime linhas de reclamações.

Na pasta `seo-property`, execute:

```sh
npm run discover:source
```

O comando falha explicitamente em resposta HTTP inválida, conteúdo que não seja JSON, conjunto de dados inesperado ou ausência de recursos mensais que passem a validação. Os metadados encontrados são pistas para selecionar a URL oficial; **não** aprovam o esquema CSV nem liberam publicação. Acesso ao catálogo pelo ambiente desta sessão continuou bloqueado pela ferramenta de leitura, então ainda não há resultado real confirmado deste comando.

## Próximos passos técnicos obrigatórios

1. Para indicadores empresa-a-empresa, continuar tentando obter e validar o CSV oficial. Como trilha paralela separada, o projeto agora inclui agregados por setor publicados por um pesquisador independente, com atribuição, licença e limites documentados; isso não substitui nem desbloqueia a ingestão oficial.
2. Baixar um CSV mensal e registrar URL exata, mês de referência, data de obtenção, tamanho e SHA-256.
3. Ler apenas o cabeçalho e perfilar localmente a estrutura; não imprimir, registrar em logs ou manter cópias desnecessárias de textos de reclamação e identificadores de consumidores.
4. Implementar parser CSV que respeite o delimitador e a codificação observados; não presumir separador, aspas ou nomes de colunas.
5. Definir um contrato de esquema explícito e falhar em colunas desconhecidas/ausentes, em vez de adivinhar mapeamentos.
6. Mapear campos para os quatro indicadores e validar os cálculos em amostra contra os indicadores oficiais por empresa e período.
7. Aplicar limites mínimos de amostra e revisar risco de reidentificação antes da publicação.
8. Manter atribuição, licença, período, denominadores, metodologia e trilha de auditoria; publicar apenas agregados revisados.

## Decisão

Fonte promissora para um produto de dados independente, condicionado à inspeção do CSV, validação dos cálculos e revisão de privacidade. **Não** preencher `data/benchmarks.json` do índice geral com esses indicadores. Criar um contrato de dados separado para o índice Consumidor.gov.br, com rótulos que não confundam desempenho de atendimento com reputação geral.


## Fonte secundária agregada disponível para começar sem o CSV oficial

Para evitar bloquear todo o trabalho enquanto o CSV oficial não é acessível pelo ambiente de execução, foi acrescentado `data/consumidor-gov-sector-trends.json`. Ele contém 18 agregados publicados por setor em três janelas temporais, transcritos da tabela do dataset público **DNACX; Kammers, Diogo**, com licença CC BY 4.0:

- Dataset secundário: https://huggingface.co/datasets/dnacx/tres-numeros-de-resolucao-consumidor-gov
- Versão arquivada / referência: https://doi.org/10.5281/zenodo.22982134
- SHA-256 publicado pelo autor: `5ea2eeac8461d673ee481a79c40e9da585c12694d63a0ceca11b8fa693a33d0e`
- Fonte primária declarada pelo autor: https://www.consumidor.gov.br/pages/dadosabertos/externo/

Este arquivo é explicitamente uma **reprodução secundária pré-agregada**, não uma extração direta do CSV oficial por este projeto. A janela mais recente declarada é setembro de 2025 a agosto de 2026. Os números são agregados de setores, não resultados por empresa; por isso não entram em `data/benchmarks.json`, não ativam páginas de reputação por empresa e não podem ser misturados com avaliações privadas do Filtra.

As três taxas no arquivo usam denominadores diferentes. O índice oficial de solução considera não avaliadas como resolvidas; a taxa de resolvidas sobre avaliadas exclui não avaliadas. Nunca apresentar essas métricas como intercambiáveis. A mudança na publicação em 2024 também limita comparações históricas; os rótulos de janela devem acompanhar qualquer análise.

Essa trilha permite preparar conteúdo metodológico agregado, com atribuição clara, enquanto o caminho oficial continua em validação. Não libera as métricas por empresa de satisfação, resposta ou prazo médio até validar o CSV e reconciliar os cálculos com o portal oficial.
