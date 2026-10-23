# Estratégia de expansão orgânica programática — Filtra.AI

## Objetivo

Construir um sistema sustentável para ampliar a cobertura orgânica do Filtra.AI de dezenas/centenas para milhares de URLs quando houver demanda e valor suficientes, sem tratar volume de páginas como métrica de sucesso isolada.

Esta é uma estratégia de execução, não um relatório de demanda validada. Os exemplos de segmentos, consultas e rotas são hipóteses para pesquisa; não afirmam volume de busca, dificuldade ou potencial de conversão sem dados do Search Console, pesquisa de palavras-chave e resultados comerciais.

## Princípios

1. **Escala sem teto artificial:** não limitar a estratégia ao número atual de URLs. O limite de publicação deve ser a qualidade, a demanda demonstrável, a capacidade de manter os dados e a utilidade para o visitante.
2. **Uma URL, uma intenção principal:** só separar páginas quando a necessidade do usuário, a solução ou a evidência disponível forem materialmente diferentes.
3. **Valor específico por página:** não publicar páginas que apenas substituam o nome de um setor ou cidade em um texto genérico. Incluir orientação operacional, exemplos, critérios, dados, perguntas frequentes úteis ou ferramenta pertinente ao caso.
4. **Conteúdo verificável:** não inventar estatísticas, clientes, resultados, integrações, funcionalidades, depoimentos ou garantias de ranking/nota.
5. **Conversão sem pressão enganosa:** cada página deve oferecer um próximo passo coerente (por exemplo, auditoria gratuita ou planos), sem prometer resultados que o produto não controla.
6. **Expansão reversível:** lançar por lotes, observar indexação e comportamento, corrigir ou consolidar com critérios explícitos; não remover páginas apenas por opinião.
7. **Métrica de negócio acima de contagem:** acompanhar leads qualificados, auditorias iniciadas/concluídas, cadastros, trials e clientes, além de impressões, cliques e CTR.

## Universo de páginas: famílias a pesquisar

Estas famílias são um mapa inicial de hipóteses, não uma autorização para gerar todas as combinações.

| Família | Exemplos de intenção | Condição para uma URL independente |
|---|---|---|
| Setor × tarefa | gestão de avaliações para clínicas; responder avaliações de restaurantes | O setor altera de verdade os exemplos, riscos, fluxo ou orientação |
| Problema × solução | muitas avaliações sem resposta; temas recorrentes nas avaliações | Há uma resposta prática específica e ligação clara com o produto |
| Etapa do fluxo | monitorar avaliações; analisar feedback; responder em escala | A intenção é distinta e a página não compete com outra para a mesma consulta |
| Ferramenta/diagnóstico | auditoria de reputação; análise de avaliações; checklist operacional | Existe ferramenta, método ou entrega real e explicável |
| Comparação/alternativa | planilha versus plataforma; processo manual versus automatizado | Comparação justa, atualizada, fundamentada e sem alegações inventadas |
| Localidade | gestão de reputação em uma cidade | Há valor local verificável; não basta trocar o nome da cidade |
| Integração/canal | gestão de avaliações de uma plataforma específica | A integração/capacidade é real, suportada e documentada |
| Educação/decisão | como criar processo de resposta; indicadores de reputação | O conteúdo resolve uma questão real e conduz naturalmente ao próximo passo |

### Não gerar combinações automaticamente

Não cruzar indiscriminadamente todos os setores × cidades × problemas × plataformas. Uma combinação só entra no backlog publicável se passar por todos os critérios:

- Intenção distinta apoiada por pesquisa ou evidência de usuários.
- Demanda plausível documentada (Search Console, pesquisa de palavras-chave, pesquisa comercial ou feedback de clientes).
- Conteúdo e exemplos específicos que não possam ser substituídos por uma página irmã sem perda.
- Fatos, funcionalidades e afirmações verificáveis.
- Próximo passo comercial coerente.
- Canonical, links internos e inclusão no sitemap corretos.
- Responsável e plano de manutenção quando a página depende de dados que mudam.

Se não houver evidência suficiente, registrar como hipótese de pesquisa — não como URL a publicar.

## Modelo de dados recomendado

Manter os dados de cada página separados da lógica de renderização. Cada registro deve ter, no mínimo:

- slug estável e único;
- família e intenção principal;
- title, description e H1;
- público e problema;
- valor único explicando o que torna a página diferente;
- seções com conteúdo factual revisado;
- fontes para afirmações específicas;
- tipo de CTA e destino existente;
- caminho canônico;
- status (rascunho, revisão, publicado, precisa atualizar, retirado);
- responsável e data da última revisão;
- relações explícitas com páginas-pai, irmãs e conteúdo relacionado.

Os nomes são uma proposta de esquema conceitual, não uma afirmação de que esses campos já existam no código. Adotar o padrão do projeto ao implementar. Evitar copiar conteúdo editorial inteiro entre registros ou criar páginas diretamente de uma lista de palavras-chave sem revisão.

## Arquitetura de URLs e navegação

- Preservar URLs existentes que tenham valor e backlinks; não mudar slugs por estética.
- Usar rotas por família com taxonomia clara (por exemplo, a família atual /solucoes/ pode conter soluções por setor/tarefa quando isso fizer sentido).
- Criar páginas-pai que ajudem o usuário a navegar por grupos úteis, não diretórios de links sem contexto.
- Garantir links internos contextuais de páginas-pai para páginas-filhas e entre páginas realmente relacionadas.
- Evitar que múltiplas páginas tenham o mesmo foco principal; quando duas URLs respondem à mesma intenção, avaliar melhorar uma, diferenciar claramente ou consolidar com redirecionamento planejado.
- Sitemaps devem conter somente URLs canônicas, indexáveis, publicadas e com resposta válida. Não usar o sitemap como mecanismo para forçar indexação.
- Páginas de busca interna, filtros combinatórios, parâmetros e estados utilitários não devem virar URLs indexáveis em massa sem justificativa.
- Não usar conteúdo programático para criar páginas locais fictícias, perfis de clientes fictícios ou alegações não comprovadas.

## Priorização

Pontuar oportunidades de 0 a 3 em cada dimensão, com justificativa registrada:

- Evidência de demanda;
- Valor comercial / proximidade de compra;
- Distinção da intenção;
- Capacidade de oferecer conteúdo ou ferramenta própria;
- Confiança e disponibilidade dos dados;
- Facilidade de manutenção.

Deduzir pontos por risco de duplicação, afirmações difíceis de provar, necessidade de dados indisponíveis ou custo de atualização alto. Não usar uma pontuação matemática para substituir julgamento: registrar a justificativa e a evidência. Começar pelas oportunidades com intenção clara, valor distinto e manutenção simples.

## Publicação em lotes

1. **Inventário:** exportar URLs existentes e agrupar por intenção/família; identificar páginas concorrentes e lacunas.
2. **Pesquisa:** coletar consultas, impressões, cliques, CTR e posição quando Search Console estiver disponível; complementar com pesquisa de palavras-chave e evidência de clientes. Registrar período e fonte.
3. **Protótipo:** selecionar um pequeno lote representativo de uma família e testar a qualidade editorial, os CTAs, a renderização, metadados, canonical, links e sitemap.
4. **Validação automática:** slug único, title/description/H1, conteúdo específico mínimo, fonte de afirmações, destino de CTA válido, canonical consistente, links válidos e ausência de duplicação óbvia.
5. **Revisão humana:** conferir se a página realmente ajuda o público, se os fatos estão corretos e se a diferença em relação às páginas irmãs é real.
6. **Lançamento gradual:** publicar o lote; não criar milhares de URLs de uma só vez apenas porque o gerador permite.
7. **Avaliação:** medir indexação, impressões, cliques, CTR, engajamento útil e conversões em janelas comparáveis. Distinguir ausência de demanda de problemas de rastreamento/indexação e de problemas de conversão.
8. **Iteração:** expandir famílias com sinais positivos; corrigir páginas com problemas claros; consolidar somente com justificativa e plano de redirecionamento/canonical.

## Medição mínima

Relatar por URL e por família, quando as fontes estiverem disponíveis:

- URL canônica e família/intenção;
- status HTTP e indexabilidade;
- inclusão no sitemap;
- impressões, cliques, CTR e posição média do Search Console, com período explícito;
- eventos de CTA, auditoria iniciada/concluída, cadastro, trial e cliente, se esses eventos estiverem realmente instrumentados;
- taxa de conversão com denominador definido;
- fonte de tráfego e limitações de atribuição.

Não inventar números quando uma integração não estiver disponível. Separar métricas observadas, métricas ainda não instrumentadas e hipóteses. Não enviar dados pessoais aos eventos de analytics.

## Guardrails técnicos e editoriais

- Slugs únicos e determinísticos.
- Metadata e canonical coerentes com a URL.
- Conteúdo útil, específico e renderizado no HTML entregue ao crawler.
- Links internos sem órfãos; sitemap sem duplicatas ou URLs não canônicas.
- CTAs funcionais e destinos válidos.
- Sem noindex, exclusão ou redirecionamento automático com base apenas em tráfego baixo de curto prazo.
- Conteúdo sensível, afirmações de desempenho e comparações comerciais exigem revisão apropriada.
- Toda página deve poder ser atualizada, retirada ou consolidada sem quebrar navegação ou perder redirecionamentos necessários.

## Próxima sequência de trabalho

1. Fazer inventário do estado real da branch/base escolhida e das URLs existentes, sem presumir que uma PR aberta já está em produção.
2. Extrair as páginas atuais por família e detectar duplicação de intenção e lacunas.
3. Conectar a análise às fontes reais de demanda disponíveis; se Search Console não estiver acessível, registrar a limitação e continuar com fontes alternativas, sem fabricar dados.
4. Escolher uma única família piloto a partir da evidência encontrada.
5. Implementar os guardrails e o lote piloto em uma PR isolada.
6. Medir antes de expandir a família para centenas ou milhares de URLs.

## Definição de sucesso

Sucesso significa aumentar a cobertura de intenções relevantes e gerar mais demanda qualificada, sem deteriorar a utilidade do conteúdo, a rastreabilidade técnica ou a conversão. O total de URLs é uma métrica de capacidade/cobertura, nunca o único KPI.
