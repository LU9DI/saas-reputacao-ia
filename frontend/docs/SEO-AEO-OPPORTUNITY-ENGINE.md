# Motor de oportunidades SEO + AEO

## O que foi criado

- `data/seo-aeo-opportunity-taxonomy.json`: taxonomia versionada de 474 segmentos, 12 intenções e 5 formatos.
- `scripts/build-seo-aeo-opportunities.mjs`: gera backlog JSON e CSV para priorização.
- `npm run seo:opportunities`: executa o gerador.

A matriz teórica produz até 28.440 candidatos (474 × 12 × 5). Isso é um inventário de hipóteses, não 28.440 páginas prontas. O gerador **não** cria rotas, arquivos públicos, metadados de indexação, sitemap entries ou páginas de produção.

## Como executar

Na pasta `frontend`, usando a versão Node 22 definida pelo projeto:

```bash
npm run seo:opportunities
```

Saídas padrão:

- `reports/seo-aeo-opportunities/opportunities.json`
- `reports/seo-aeo-opportunities/opportunities.csv`

Para escrever em outro diretório:

```bash
node scripts/build-seo-aeo-opportunities.mjs --out /tmp/seo-opportunities
```

## Importar evidências reais do Search Console

O importador aceita CSV de consultas exportado do Search Console, com cabeçalhos em inglês ou português (consulta, cliques, impressões, CTR e posição). Detecta delimitadores por vírgula ou ponto e vírgula, preserva a origem e agrega linhas cuja consulta normalizada é idêntica.

1. Exporte o relatório de consultas do Search Console e guarde o CSV original fora do repositório.
2. Gere o backlog de hipóteses:
   `npm run seo:opportunities`
3. Importe a evidência informando propriedade e janela exatas:

```bash
npm run seo:demand:import -- --input "C:/caminho/search-console-queries.csv" --site "https://seu-dominio/" --start-date 2026-09-01 --end-date 2026-09-30
```

Saídas locais (não versionadas automaticamente):

- `reports/seo-aeo-opportunities/demand-evidence.json`
- `reports/seo-aeo-opportunities/demand-evidence.csv`

Cada linha registra consulta, fonte, propriedade, janela, momento da importação, métricas, linhas de origem e estado de revisão. A correspondência com candidatos só é automática quando a consulta normalizada é **exatamente igual** à hipótese; consultas não correspondentes ficam explícitas para mapeamento manual, evitando associação semântica inventada. Linhas inválidas são reportadas, e consultas duplicadas são agregadas com CTR recalculado a partir de cliques/impressões e posição ponderada por impressões.

O importador é deliberadamente conservador: todos os itens permanecem `publishAllowed=false`. Métricas observadas demonstram presença/desempenho na pesquisa, mas não provam sozinhas intenção comercial, aderência ao produto, diferenciação ou autorização editorial. Não commitar exportações brutas que possam conter consultas sensíveis.

Teste local:

```bash
npm run seo:demand:test
```

## Fila de qualificação por evidência

A fila separa consultas para revisão de páginas existentes daquelas que podem justificar avaliar um candidato novo. Ela **não** tenta adivinhar URLs por similaridade semântica. O destino só é preenchido a partir de um mapeamento explícito revisado por uma pessoa.

```bash
npm run seo:qualification -- --inventory "C:/caminho/sitemap.xml"
npm run seo:qualification:test
```

Por padrão, o script lê `reports/seo-aeo-opportunities/demand-evidence.json`, o backlog `opportunities.json` e um arquivo local opcional `data/seo-aeo-manual-mappings.json`. Para qualificar destinos `existing-page`, forneça obrigatoriamente `--inventory` apontando para o sitemap XML exportado do site ou para um arquivo UTF-8 com uma URL absoluta por linha. A validação exige correspondência exata da URL (normalizando apenas query, fragmento e barra final); domínio correto sem URL presente no inventário não basta. O arquivo de exemplo versionado fica em `data/seo-aeo-manual-mappings.example.json`; copie-o e substitua os exemplos por mapeamentos realmente verificados, ou passe um caminho privado via `--mappings`. Não versione consultas sensíveis do Search Console.

Campos obrigatórios de cada mapeamento: `normalizedQuery` ou `evidenceId`, `targetType` (`existing-page` ou `candidate`), destino válido, `reviewedBy`, `reviewedAt` e `rationale`. Um destino `candidate` precisa referenciar um ID presente no backlog gerado. Conflitos de mapeamento são bloqueados e mapeamentos inválidos são reportados. Destinos existentes ausentes do inventário e mapeamentos sem inventário são rejeitados e contabilizados como inválidos. Um match exato de hipótese é apenas uma sugestão, nunca um destino aprovado automaticamente.

Saídas locais: `qualification-queue.json` e `qualification-queue.csv`. As ações significam apenas:
- `optimize-existing-page-review`: revisar se a página existente precisa de otimização;
- `evaluate-new-candidate-review`: avaliar editorial e comercialmente o candidato;
- `manual-mapping-required`: falta destino explícito;
- `blocked-conflicting-mappings`: mais de um mapeamento revisado corresponde à evidência.

Todas as linhas continuam com `publishAllowed=false`. O processo não cria conteúdo, URL, rota, canonical, sitemap ou solicitação de indexação.

## Processo de qualificação

Cada combinação nasce com `status=candidate-only` e `publishAllowed=false`. Antes de virar URL pública, a equipe precisa:

1. Confirmar intenção e demanda com Search Console, pesquisa de palavras-chave ou evidência de clientes; guardar fonte, data e consulta.
2. Confirmar que o Filtra oferece uma capacidade real para o caso, ou redirecionar a intenção para uma propriedade editorial/ferramenta distinta.
3. Acrescentar pelo menos dois elementos de evidência diferenciadores: dados autorizados e agregados, procedimento específico do setor, exemplos originais, fonte primária, metodologia ou uma ferramenta funcional.
4. Fazer revisão editorial para evitar páginas que apenas substituem o nome do setor.
5. Revisar canibalização, links internos, canonical, indexabilidade, privacidade e afirmações de produto.
6. Publicar apenas o lote aprovado e observar rastreamento, indexação, impressões, cliques, conversões e citações.

## Modelo de distribuição

- **Filtra.AI:** intenção comercial com aderência comprovada ao produto.
- **Base editorial:** educação ampla que não exige página comercial dedicada.
- **Ferramentas:** calculadoras, diagnósticos e geradores que realmente funcionam.
- **Inteligência setorial:** benchmarks apenas com dataset, tamanho de amostra e metodologia publicáveis.
- **Propriedade vertical:** somente se houver audiência, manutenção, diferenciação e estratégia próprias.
- **Rejeitada/mesclada:** sem demanda, duplicada, sem lastro ou coberta melhor por uma página existente.

Não crie domínios separados apenas para aumentar a contagem de URLs. Uma página deve morar onde a intenção e a experiência do usuário são melhor atendidas.

## Próxima integração técnica

Depois de revisar e qualificar candidatos, integrar o registro aprovado à fonte de páginas já existente e derivar rotas, índice, sitemap e versões Markdown dessa mesma fonte. Evitar manter listas independentes: divergências entre rotas, sitemap e validadores são falhas de publicação. A contagem de URLs precisa ser calculada, nunca espalhada como números mágicos.

## Limites atuais

- As consultas são hipóteses geradas a partir da taxonomia; não são volume de busca.
- A taxonomia tem sobreposição entre alguns rótulos setoriais; os flags no relatório servem para triagem.
- O gerador é um backlog de pesquisa e não está conectado ao Search Console, Analytics nem a fontes externas de demanda.
- A geração automatizada não comprova E-E-A-T, utilidade, originalidade ou elegibilidade para indexação.
