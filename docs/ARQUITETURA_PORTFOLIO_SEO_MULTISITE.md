# Arquitetura de portfólio SEO — múltiplos sites e propriedades

**Estado:** proposta estratégica; não autoriza registrar domínios, publicar conteúdo ou alterar DNS.  
**Objetivo:** ampliar a cobertura orgânica em centenas de URLs e eventualmente milhares sem forçar todas as intenções para dentro do site comercial do Filtra.AI.

## Princípio central

O portfólio pode conter mais de um site, marca ou produto. A escolha de onde publicar deve decorrer da audiência, da proposta de valor, da intenção de busca e da capacidade de manter a propriedade — não da tentativa de distribuir páginas semelhantes entre domínios para manipular rankings.

O Filtra.AI deve continuar concentrado nas páginas que ajudam a avaliar, entender ou adotar a solução real do produto. Intenções informacionais amplas, ferramentas independentes, pesquisa original, educação setorial e outros produtos podem justificar propriedades separadas quando tiverem público, função e valor próprios.

Não criar sites satélites apenas para copiar páginas, trocar a marca ou o setor, contornar a qualidade do domínio principal ou encaminhar visitantes para uma única página comercial. A política do Google cita expressamente sites múltiplos usados para esconder conteúdo escalado e páginas semelhantes que funcionam como portas de entrada; o portfólio precisa ser genuinamente útil em cada propriedade.

## Arquétipos de propriedade

Estes arquétipos são opções a avaliar, não nomes de domínios já aprovados.

| Arquétipo | Papel | Conteúdo adequado | Modelo de sustentabilidade | Critério para propriedade própria |
|---|---|---|---|---|
| **Filtra.AI — produto** | Converter demanda compatível com a solução | Produto, funcionalidades verificadas, casos de uso que o produto realmente atende, comparação de alternativas, onboarding e páginas comerciais | Assinatura/receita do produto | Deve permanecer o destino principal para intenção comercial diretamente relacionada ao Filtra |
| **Centro de conhecimento** | Resolver dúvidas e ensinar práticas | Guias, glossário, métodos, políticas, modelos, exemplos e explicações com fontes | Distribuição orgânica, newsletter consentida, patrocínio editorial transparente ou encaminhamento contextual ao produto | Site separado apenas se houver missão editorial, navegação, autoria e plano de manutenção próprios; caso contrário, seção editorial existente pode ser melhor |
| **Ferramentas gratuitas** | Resolver tarefas pontuais e atrair uso recorrente | Calculadoras, checklists interativos, geradores, diagnósticos e templates funcionais | Produto freemium, captação consentida ou monetização transparente | Ferramenta precisa funcionar de verdade e ter experiência, manutenção e utilidade independentes |
| **Inteligência setorial** | Publicar dados e análises sobre setores | Benchmarks agregados, taxonomias, relatórios, estudos de caso autorizados e metodologia | Relatórios, parcerias legítimas, leads qualificados ou assinatura de dados | Exige dados suficientes, metodologia publicável, direitos de uso, proteção contra reidentificação e atualização |
| **Portal vertical** | Servir uma profissão ou setor com profundidade | Fluxos de trabalho, legislação/políticas relevantes, diretórios ou recursos específicos e comunidade útil | Serviços, software vertical, patrocínio identificado ou associação | Só criar quando existir público recorrente e valor vertical maior que uma landing page; não usar apenas para multiplicar páginas por setor |
| **Agência/parceiros** | Ajudar profissionais que prestam serviços a empresas | Operação de agência, templates de entrega, governança, onboarding, métricas e playbooks | Serviços, parceiros ou produto para esse segmento | Deve servir necessidades próprias da audiência; não duplicar o site do produto com outra marca |
| **Produto futuro independente** | Atender uma necessidade que não é bem resolvida pelo Filtra | Produto, documentação, suporte, páginas de adoção e casos de uso específicos | Receita ou financiamento definido | Precisa de proposta de valor, proprietário, roadmap e suporte próprios |

## Matriz para decidir o destino de cada intenção

Para cada intenção do backlog, registrar estes campos antes de escolher a URL:

- **Intenção principal:** o que a pessoa quer conseguir?
- **Audiência:** comprador do Filtra, operador, agência, estudante, pesquisador ou outro público?
- **Entrega necessária:** resposta editorial, ferramenta, benchmark, comunidade ou software?
- **Relação com o Filtra:** direta, complementar, indireta ou nenhuma.
- **Propriedade candidata:** Filtra, centro de conhecimento, ferramentas, inteligência setorial, portal vertical, produto futuro ou ainda não definida.
- **Razão para separar:** necessidade editorial/comercial real, produto próprio, dados próprios, navegação e governança independentes.
- **Evidência:** pesquisa de SERP, consultas, entrevistas, Search Console, uso do produto, dados de suporte/vendas ou pesquisa de mercado, sempre com data.
- **Canibalização e sobreposição:** páginas que já respondem à mesma necessidade em todas as propriedades.
- **Destino de conversão:** ação útil e compatível com a intenção; não encaminhar todo visitante à força para o cadastro do Filtra.
- **Custos operacionais:** domínio, segurança, acessibilidade, conteúdo, atualização, analytics, consentimento, suporte e manutenção técnica.

Se a necessidade puder ser resolvida com qualidade em uma página existente, não criar outra URL ou outro site sem motivo claro. Se houver uma entrega independente e sustentável, não forçar a página a caber no Filtra apenas porque o domínio já existe.

## Arquitetura de informação e tecnologia

A arquitetura pode evoluir para múltiplas aplicações e domínios, mas precisa manter governança centralizada:

1. **Registro central de intenções:** fonte única para IDs, evidências, proprietários, estado editorial, URL de destino e histórico de decisão.
2. **Mapa de propriedades:** cada site tem público, propósito, marca, responsável, métricas, regras editoriais e plano de manutenção.
3. **Inventário global de URLs:** deduplicação entre todos os domínios, com canonical e redirecionamentos corretos quando páginas forem consolidadas ou movidas.
4. **Taxonomia compartilhada, execução independente:** vocabulário e identificadores podem ser reutilizados; o conteúdo publicado deve ser escrito para a necessidade real daquela audiência, não replicado por template.
5. **Medição comparável:** convenções de eventos e UTMs coerentes, propriedades de analytics separadas quando necessário, consentimento e privacidade adequados.
6. **Distribuição editorial legítima:** links entre sites apenas quando úteis ao leitor e com contexto. Não criar redes artificiais de links ou páginas de passagem.
7. **Operação de publicação:** preview, revisão, validação de links, metadados, canonical, sitemap, status HTTP, acessibilidade, segurança e revisão factual por propriedade.
8. **Plano de saída:** páginas sem utilidade ou manutenção devem ser atualizadas, consolidadas ou retiradas com status/redirect adequado, não mantidas por inércia.

Domínios diferentes não criam automaticamente autoridade, tráfego ou independência de ranking. Cada propriedade precisa ganhar utilidade e reputação por mérito próprio; uma nova marca também aumenta o custo de distribuição, confiança, analytics e manutenção.

## Modelo de crescimento em centenas de URLs

A escala será planejada como um portfólio de famílias de intenção, não como um gerador cego de slugs.

### Camada 1 — mapa de mercado
- intenção comercial relacionada ao Filtra;
- tarefas operacionais recorrentes;
- educação e políticas de plataformas;
- ferramentas e templates;
- inteligência e dados setoriais;
- necessidades de agências;
- verticais que justifiquem profundidade própria;
- idiomas e mercados com terminologia e demanda específicas.

### Camada 2 — atribuição de propriedade
Cada intenção recebe um destino principal e uma justificativa. Uma intenção pode ser recusada, consolidada ou ficar sem propriedade até surgir evidência e capacidade.

### Camada 3 — produção em lote
Produzir lotes de dezenas de URLs por família apenas quando os dados e a revisão permitirem conteúdo realmente diferenciado. A arquitetura técnica deve suportar centenas de páginas; o gate editorial determina quais são publicadas e indexáveis.

### Camada 4 — avaliação
Medir impressões, cliques, consultas, indexação, engajamento útil, conversões adequadas à intenção, qualidade dos leads, custo de manutenção e sobreposição. Comparar janelas e denominadores consistentes.

### Camada 5 — expansão
Expandir uma família quando houver evidência de necessidades não cobertas e capacidade de entregar valor. Revisar ou consolidar quando páginas competirem pela mesma intenção ou não servirem o usuário.

## Decisão sobre o conjunto atual

- A PR #91 contém 108 páginas comerciais candidatas sob `/solucoes/`. Não assumir que todas pertencem ao Filtra nem que todas devem ser publicadas.
- Cruzar as 108 candidatas com o sitemap de `main`, o blog e o registro de intenções.
- Classificar cada uma: manter no Filtra, reescrever para uma intenção comercial distinta, mover para uma propriedade editorial/ferramenta futura (sem migrar automaticamente), consolidar, bloquear até validar a capacidade do produto ou descartar.
- Não transferir URLs para outros domínios sem definir a propriedade de destino, conteúdo real, manutenção, redirecionamentos e plano de distribuição.
- O backlog de 95 intenções é um começo e deve continuar crescendo com pesquisa. Não representa limite de escala.

## Critérios de aprovação para uma nova propriedade

1. Público e problema próprios, comprovados por pesquisa.
2. Proposta de valor que não dependa apenas de captar tráfego para o Filtra.
3. Plano editorial/produto e conteúdo ou funcionalidade de lançamento concretos.
4. Proprietário e orçamento de manutenção.
5. Plano de distribuição e confiança (autoria, fontes, contato, política de privacidade).
6. Diferenciação global em relação às propriedades existentes.
7. Instrumentação e metas de sucesso.
8. Avaliação de riscos legais, de privacidade, de marca e de plataforma.
9. Justificativa para novo domínio em vez de seção, subdomínio ou aplicação existente.
10. Plano de revisão, consolidação e encerramento se não houver valor sustentado.

## Próximas ações

1. Auditar sitemap atual e as 108 rotas candidatas da PR #91.
2. Montar uma tabela global de intenção → propriedade candidata → URL atual/candidata → sobreposição → evidência → próxima ação.
3. Separar intenções de produto, educação, ferramentas, dados e verticais; identificar as que não devem ficar no Filtra.
4. Pesquisar SERPs e sinais de demanda para as famílias prioritárias sem inventar volumes.
5. Propor arquitetura de propriedade e primeiros lotes para revisão, sem registrar domínios nem publicar em produção automaticamente.

**Objetivo final:** centenas de URLs úteis distribuídas pelas propriedades adequadas, cada uma com intenção e entrega próprias, governança global e resultados mensuráveis — não centenas de páginas forçadas para um único domínio.
