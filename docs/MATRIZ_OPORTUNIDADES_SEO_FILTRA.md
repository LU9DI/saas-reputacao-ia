# Matriz de oportunidades de SEO — Filtra.AI

**Estado:** backlog inicial de hipóteses para pesquisa; não é uma lista de URLs aprovadas para publicação.  
**Base do inventário:** leitura do `frontend/src/app/sitemap.ts` da branch `main` em 2026-10-23.  
**Limitação:** Search Console não está acessível nesta execução porque a conexão GSC Wizard exige assinatura ativa; a consulta Ahrefs também foi recusada por insuficiência de plano. Portanto, não há volumes, dificuldade, CTR ou demanda estimada nesta matriz. Não preencher métricas por suposição.

## 1. Cobertura já identificada no sitemap

A `main` já declara páginas de produto/tema e segmentos, incluindo:

- Temas centrais: gestão de reputação online, avaliações Google, reputação Google, melhorar avaliações, monitoramento, gestão de feedback, análise de avaliações com IA e auditoria gratuita.
- Segmentos: hotéis, restaurantes, turismo, clínicas, franquias, associações e agências/parceiros.
- Conteúdo editorial: guias de gestão de reputação, SEO local, resposta a avaliações negativas, como conseguir avaliações, QR code, reputação para clínicas/hotéis/franquias e avaliações de restaurantes.
- Localizações de idioma: famílias em português, inglês e espanhol, além de rotas em chinês excluídas do sitemap por configuração atual.

Isso indica que novas páginas genéricas sobre os mesmos temas ou traduções automáticas não devem ser a primeira decisão. É necessário comparar a intenção de cada proposta com as URLs atuais e verificar o conteúdo efetivo, não apenas o slug.

## 2. Matriz inicial

Escala de confiança: **baixa** significa hipótese baseada apenas no mapa de URLs; não representa baixa oportunidade comercial. “Evidência necessária” é o dado a coletar antes de aprovar a publicação.

| Prioridade de pesquisa | Família candidata | Exemplos de intenção para validar | Cobertura atual visível no sitemap | Diferenciação exigida | Evidência necessária | Decisão agora |
|---|---|---|---|---|---|---|
| P1 | Setores ainda não visíveis no sitemap | avaliações Google para salão; reputação de oficina mecânica; avaliações para imobiliária; reputação de loja; avaliações para escola | Não identifiquei páginas setoriais explícitas para esses segmentos no inventário consultado | Exemplos e fluxo operacional próprios do setor, não apenas trocar o nome do segmento | Consultas GSC, pesquisa de palavras-chave, feedback comercial e análise da SERP | Pesquisar; não publicar ainda |
| P1 | Problemas operacionais de alta intenção | responder avaliação negativa; organizar avaliações sem resposta; identificar reclamações recorrentes | Já há artigo sobre respostas negativas e conteúdo de feedback; possível sobreposição relevante | Resolver uma tarefa específica com roteiro, modelo, checklist ou ferramenta funcional | Consultas que levam às páginas atuais, termos relacionados e entrevistas com clientes | Comparar com conteúdo atual antes de propor URL |
| P1 | Diagnósticos e ferramentas | auditoria de reputação; checklist de gestão de avaliações; análise de temas recorrentes | Já existe auditoria gratuita e calculadora de nota Google | Entrega real e útil, não apenas formulário de captura; explicar método e limitações | Conversões atuais, consultas, intenção de usuário e capacidade técnica do produto | Priorizar melhorias nas ferramentas existentes antes de duplicar |
| P2 | Multiunidades | acompanhar reputação de várias unidades; comparar avaliações entre filiais | Franquias já existe; possível página ou funcionalidade multiunidade precisa ser verificada | Demonstrar processo e capacidades atuais do produto; distinguir franquias de outros grupos de unidades | Demanda, capacidades documentadas e feedback de operações multiunidade | Validar produto e demanda |
| P2 | Agências e parceiros | gestão de reputação para carteira de clientes; operação de reputação para agências | Já existem agências/parceiros em rotas atuais e versões localizadas | Separar intenção de parceria da intenção de comprar serviço/plataforma | Consultas por URL, conversões e pesquisa com parceiros | Evitar nova URL até esclarecer sobreposição |
| P2 | Comparações e alternativas | planilha versus plataforma; processo manual versus software | Cobertura atual precisa ser conferida no conteúdo completo, não apenas no sitemap | Comparação justa, atualizada e baseada em critérios verificáveis | SERP, consultas, feedback de vendas e capacidade real do produto | Pesquisar; revisar riscos de alegações |
| P2 | Integrações e canais | gestão de avaliações em canal específico; fluxo de monitoramento | O sitemap por si só não prova quais integrações estão implementadas | Página somente para integração/capacidade realmente suportada e documentada | Inventário técnico oficial e demanda por integração | Bloqueado até validar funcionalidades |
| P3 | Localidades | gestão de reputação em cidade específica | Não identificada família local explícita no trecho inventariado | Dados, serviço ou contexto local verificável; não criar páginas com cidade substituída em template | Pesquisa de termos locais, presença comercial real e dados próprios | Não criar páginas locais em massa |
| P3 | Novos idiomas/países | termos de gestão de avaliações em mercados adicionais | Há famílias em PT/EN/ES e rotas ZH configuradas fora do sitemap | Tradução/localização editorial, mercado-alvo, hreflang e manutenção coerentes | GSC por país/idioma, pesquisa local e capacidade de suporte | Otimizar famílias existentes antes de ampliar idiomas |
| P3 | Novos artigos educativos | perguntas sobre reputação, reviews e feedback | Blog já cobre múltiplos tópicos relacionados | Lacuna editorial demonstrada; não apenas reformular título de artigo existente | Consulta, SERP, análise de canibalização e desempenho dos artigos atuais | Só adicionar após mapa de intenção |

## 3. Modelo de scoring para cada oportunidade

Preencher cada critério com 0–3, incluindo uma nota explicativa e a fonte da evidência. Pontuação não deve ser calculada enquanto as evidências estiverem ausentes.

| Critério | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Evidência de demanda | Sem evidência | Sinal indireto | Várias fontes coerentes | GSC/pesquisa e evidência comercial consistentes |
| Valor comercial | Incerto | Educacional distante | Relacionado ao problema atendido | Intenção clara de avaliar/comprar solução |
| Intenção distinta | Duplicada | Diferença fraca | Diferença plausível | Necessidade e SERP claramente distintas |
| Valor exclusivo possível | Só troca de termos | Conteúdo genérico | Exemplos/fluxo específicos | Ferramenta, dados ou orientação difícil de substituir |
| Confiabilidade dos fatos | Não verificável | Lacunas importantes | Fontes disponíveis | Fontes primárias e revisão possível |
| Manutenção | Alto custo/sem dono | Custo significativo | Viável | Atualização simples e responsável definido |

**Penalizações qualitativas:** canibalização provável, dados ausentes, funcionalidades não confirmadas, páginas locais artificiais, traduções literais e custos de atualização elevados. Não publicar só porque uma combinação recebe um nome de URL plausível.

## 4. Dados a coletar antes de escolher o lote piloto

1. Exportar as páginas e consultas do Search Console para pelo menos 3 meses, idealmente também 12 meses, por URL e consulta.
2. Para cada URL existente, mapear título, H1, intenção primária, CTA, idioma, canonical, status HTTP e links internos.
3. Agrupar consultas por intenção, não apenas por correspondência textual.
4. Identificar consultas relevantes sem página adequada e páginas que disputam as mesmas consultas.
5. Validar ideias setoriais com pesquisa de palavras-chave e SERP do Brasil.
6. Verificar com produto/documentação quais capacidades e integrações são reais.
7. Entrevistar vendas/suporte ou consultar feedback real para confirmar vocabulário e problemas dos clientes.
8. Selecionar um pequeno lote de uma família, com hipótese, métrica de sucesso e condição para interromper/expandir.

## 5. Registro por URL candidata

Antes de autorizar uma URL, registrar:

- **Consulta/tema principal:**
- **Fonte, data e país:**
- **Intenção e público:**
- **URLs atuais potencialmente concorrentes:**
- **Por que uma página separada é necessária:**
- **Conteúdo/ferramenta exclusiva:**
- **Afirmações e fontes verificáveis:**
- **CTA existente e destino:**
- **Plano de links internos/canonical:**
- **Responsável pela manutenção:**
- **Decisão:** pesquisar / publicar lote piloto / melhorar URL existente / consolidar / descartar.

## 6. Próxima decisão recomendada

Começar pela família **setores ainda não visíveis no sitemap**, pois oferece hipóteses claras de expansão sem duplicar imediatamente os temas centrais já cobertos. Isso é apenas prioridade de pesquisa derivada do inventário, não uma afirmação de que essa família tem maior volume ou retorno.

Comparar primeiro cinco candidatos: salão/beleza, oficina automotiva, imobiliária, varejo local e escola/educação. Para cada um, pesquisar a intenção, verificar a SERP, procurar páginas concorrentes no próprio site e desenhar um conteúdo específico. Só então escolher um piloto e criar URLs em uma PR separada.

Não fazer merge, deploy, indexação em massa ou publicação externa automaticamente.

## 7. Critérios para o motor de crescimento

Além de avaliar se uma nova URL merece existir, registrar como ela contribui para o sistema completo:

- **Ativo diferenciador do Filtra:** diagnóstico, ferramenta, modelo operacional, conhecimento verificado ou dado próprio autorizado que a página entrega. Se não houver, explicar qual orientação específica resolve a necessidade.
- **Fonte e confiabilidade:** origem, data, método, limitações e responsável por atualizar qualquer dado ou afirmação.
- **Distribuição:** páginas internas que devem criar links contextuais; canais próprios disponíveis; parceiros/comunidades realmente relevantes; hipótese de tráfego de referência. Não planejar links artificiais nem spam.
- **Conversão observável:** CTA e destino existentes, evento correspondente, etapa do funil, denominador e janela de atribuição. Marcar como lacuna se a instrumentação ainda não existir.
- **Critério de decisão pós-lançamento:** janela de avaliação, sinal para expandir, correção necessária e condição para consolidar/retirar. Baixo tráfego em uma janela curta não basta, isoladamente, para remover uma página.

### Registro adicional por candidato

Adicionar estes campos ao registro da seção 5 antes de selecionar um piloto:

- **Ativo próprio ou utilidade entregue:**
- **Fonte, método e limitações dos dados:**
- **Plano de distribuição e links internos:**
- **Evento de conversão já instrumentado / lacuna:**
- **Métrica de sucesso, denominador e janela:**
- **Critério para expandir, revisar ou consolidar:**

### Próximo passo de pesquisa

A disponibilidade de Search Console e ferramentas de pesquisa paga está limitada nesta execução. Portanto, a próxima etapa não deve fingir uma pontuação de demanda: deve inventariar as URLs e intenções existentes, verificar fontes alternativas legítimas, analisar as SERPs para os cinco candidatos P1 e confirmar quais ferramentas, dados e eventos de conversão do Filtra já existem. Só então selecionar a família piloto em uma PR de implementação separada da PR documental.

