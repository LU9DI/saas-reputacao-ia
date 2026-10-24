# Protocolo de escala segura para SEO + AEO

## Objetivo

Aumentar cobertura de intenção e descoberta de marca em escala sem transformar combinações automáticas em páginas finas, sem evidência, duplicadas ou desconectadas do produto. A escala é do **processo de descoberta e validação**; a publicação continua limitada por evidência.

## Invariantes não negociáveis

1. **Nenhum candidato é publicável por padrão.** A geração do backlog nunca muda `publishAllowed=false`.
2. **Não inventar demanda, prova social, métricas, clientes, integrações ou capacidades.** Cada afirmação factual tem fonte, data e responsável.
3. **Não publicar só por combinação de palavras.** Trocar o setor ou a cidade num texto-base não constitui diferenciação.
4. **Não multiplicar URLs para simular autoridade.** Sem domínio separado por conveniência; cada conteúdo deve ter uma propriedade canônica e uma intenção clara.
5. **Não indexar páginas de filtros, parâmetros, buscas internas ou variantes sem conteúdo próprio.**
6. **Não expor dados individuais de clientes.** Benchmarks exigem autorização, agregação, limiar mínimo de amostra e revisão de risco de reidentificação.
7. **Não fazer merge/deploy automático a partir de um score.** O score prioriza revisão; aprovação humana e CI permanecem obrigatórias.

## Esteira proposta

### Etapa 0 — Descoberta

- Enumerar segmentos, problemas, intents e formatos como hipóteses.
- Deduplicar IDs, slugs, rótulos normalizados e consultas normalizadas.
- Registrar a origem da hipótese e a data da coleta.
- Separar páginas comerciais, conteúdo educativo, ferramentas funcionais e estudos/benchmarks.

### Etapa 1 — Evidência de demanda

Fontes aceitáveis: exportação do Google Search Console, pesquisa de palavras-chave com fonte identificável, dados de busca internos devidamente agregados ou perguntas reais de clientes com uso autorizado.

Para cada evidência, preservar: consulta original, país/idioma, intervalo de datas, fonte, URL/relatório de origem e métricas disponíveis. Volume estimado de uma ferramenta não deve ser confundido com impressão observada. Zero dado significa **desconhecido**, não demanda zero e nem demanda positiva.

### Etapa 2 — Aderência de produto

- Mapear cada intenção a uma capacidade existente e verificável no Filtra.
- Se a aderência for condicional, exigir prova do fluxo e da experiência real antes de escrever uma landing page.
- Se for adjacente, decidir entre guia educativo, ferramenta funcional ou rejeição; não forçar uma página comercial.
- Não prometer integrações, automações, relatórios ou resultados que não estejam disponíveis no produto.

### Etapa 3 — Diferenciação e qualidade

Uma página candidata deve oferecer, no mínimo, dois elementos substanciais e verificáveis, por exemplo:

- metodologia própria explicada e reproduzível;
- procedimento operacional realmente específico daquele setor;
- dados agregados autorizados, com período, amostra e limitações;
- exemplos originais, anonimizados e autorizados;
- ferramenta funcional que entrega resultado útil;
- fontes primárias relevantes, interpretadas por especialista.

Texto genérico, FAQ repetitivo, paráfrase de concorrentes e substituição de nome de setor não contam como diferenciação.

### Etapa 4 — Arquitetura e deduplicação

Antes de criar uma URL, verificar:

- intenção primária e página existente mais próxima;
- canibalização com páginas comerciais/editoriais;
- slug único e estável;
- canonical para a versão preferida;
- links internos contextuais e caminho de navegação;
- inclusão no sitemap apenas quando a URL for canônica, indexável, útil e publicada;
- HTML renderizado com título, descrição, conteúdo principal e metadados coerentes;
- versão Markdown/llms.txt derivada da mesma fonte de verdade, nunca de uma lista paralela.

**Uma fonte de verdade** deve alimentar rota, metadados, índice, sitemap, páginas HTML e representação textual. Divergência entre esses artefatos é bloqueio de publicação.

### Etapa 5 — Lançamento em lotes

- Começar com um pequeno lote de páginas de alta confiança, não milhares simultaneamente.
- Guardar um manifesto de release com IDs aprovados, commit, data, canonical e responsável.
- Verificar resposta HTTP, canonical, robots, sitemap, links, conteúdo renderizado e ausência de placeholders.
- Publicar gradualmente e manter rollback simples: remover do sitemap, aplicar noindex quando apropriado ou reverter o lote sem apagar evidências de auditoria.
- Não solicitar indexação em massa como substituto de qualidade ou descoberta natural.

### Etapa 6 — Observação e expansão

Acompanhar por coorte e por URL: descoberta/rastreamento, status de indexação, impressões, cliques, CTR, posição, conversões qualificadas, leads assistidos e manutenção editorial. Separar métricas observadas de estimativas.

Expandir apenas quando o lote demonstrar utilidade e houver capacidade de manter as páginas. Consolidar, atualizar ou retirar páginas que não sustentem uma intenção distinta. A ausência de impressões em uma janela curta não é, isoladamente, prova de fracasso; avaliar a janela, a demanda e o rastreamento.

## Critérios de aprovação por página

Todos são obrigatórios; não compensar uma falha crítica com pontuação alta em outra dimensão:

- [ ] Evidência de demanda com fonte e data, ou justificativa editorial explícita para conteúdo sem demanda de busca comprovada.
- [ ] Capacidade do produto verificada ou formato editorial corretamente escolhido.
- [ ] Dois ou mais elementos de diferenciação substantiva.
- [ ] Revisão factual, editorial, de privacidade e de marca.
- [ ] Página não duplicada nem canibalizadora; canonical e intenção definidos.
- [ ] Links internos e caminho de descoberta.
- [ ] Testes técnicos e visualização do HTML final.
- [ ] Proprietário, data de revisão e plano de atualização definidos.

## Métricas de segurança

Reportar junto com o volume de candidatos:

- candidatos gerados, rejeitados, mesclados, em revisão e aprovados;
- percentagem com evidência de demanda rastreável;
- percentagem com aderência de produto verificada;
- duplicatas de rótulo, consulta, slug e intenção;
- URLs publicadas, indexáveis e presentes no sitemap;
- páginas rastreadas/indexadas versus publicadas;
- páginas sem impressões após janela adequada e páginas com conversão;
- regressões de canonical, 404, conteúdo vazio, dados estruturados e links quebrados.

O número de candidatos e o número de páginas publicadas são métricas distintas. O primeiro pode crescer muito; o segundo só cresce conforme a evidência e a capacidade de manutenção.

## Limites da implementação atual

O motor atual gera hipóteses para pesquisa e não consulta automaticamente Search Console, volume de busca, Analytics nem dados de clientes. As 28.440 combinações são um espaço combinatório, não 28.440 oportunidades validadas. Este protocolo não afirma que páginas novas foram publicadas nem que houve ganho de tráfego.
