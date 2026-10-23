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
