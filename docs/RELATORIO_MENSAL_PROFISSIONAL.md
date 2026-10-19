# Relatório profissional mensal

O Relatório Inteligente mensal é acessado por um único botão no painel do cliente. O painel é somente de leitura: não chama o endpoint de geração, não solicita nova análise e não faz chamadas de rede específicas do relatório. Ele renderiza snapshots já incluídos no payload do carregamento normal do painel (`relatorios_profissionais_mensais`). A preparação do snapshot ocorre fora da interação do cliente; reabrir o relatório apenas reutiliza os dados já carregados.

O Relatório Inteligente legado e seus endpoints permanecem intactos e fora do escopo desta entrega.

## Painel do cliente

- Exibido para os planos Pro, Ultra, Corporativo e REI (o plano Inicial continua fora da entrega mensal).
- O botão fica na área do Relatório Inteligente e abre o painel do mês de referência (mês calendário anterior).
- O botão apenas mostra/oculta o relatório já carregado na memória do painel. Não dispara `POST /api/empresa/:ref/relatorio-mensal` nem outra chamada de rede.
- Permite selecionar entre snapshots mensais persistidos (histórico), com indicadores, resumo executivo, sentimento, temas, riscos, oportunidades, recomendações, ranking de unidades (quando há dados), prioridades operacionais e radar estratégico (quando há dados).
- O relatório é apresentado em linguagem profissional diretamente no painel; não há download de PDF.
- Os snapshots ficam persistidos por empresa e mês, são verificados contra a empresa autenticada e também são incluídos no carregamento normal do painel (`relatorios_profissionais_mensais`), com o sinalizador `dashboard.mostrar_relatorio_mensal`.

## Conteúdo progressivo por plano

- **Pro:** resumo executivo e indicadores essenciais do mês.
- **Ultra:** conteúdo do Pro + análise profissional de sentimento, temas recorrentes, riscos, oportunidades e interpretação por IA.
- **Corporativo:** conteúdo do Ultra + ranking comparativo entre unidades e prioridades operacionais baseadas em evidências.
- **REI:** conteúdo do Corporativo + radar estratégico, tendências comparativas e oportunidades de crescimento com recomendações executivas.
- O Inicial não tem direito ao relatório mensal. Não há bloco comercial ou comparativo de preços no documento; só aparecem módulos incluídos no plano atual.
- Se o plano mudar depois da criação do snapshot, a apresentação e os metadados são adaptados a partir do mesmo snapshot, sem uma nova chamada à IA.

## Preparação do snapshot, cache e limites de tokens

- O endpoint `POST /api/empresa/:ref/relatorio-mensal` permanece disponível para processos internos/administrativos e compatibilidade, mas não é chamado pelo frontend do painel. A apresentação do cliente usa somente os snapshots que chegam no payload do carregamento normal do painel.
  - snapshot existente → `200 { success: true, cached: true, report }`;
  - uma solicitação interna autorizada sem snapshot pode gerar e persistir o relatório;
  - geração concorrente em andamento → `202 { status: 'generating', retry_after_ms }` sem duplicar custo;
  - plano sem direito → `403 { code: 'REPORT_NOT_INCLUDED' }`.

Esses comportamentos de endpoint não são acionados pelo painel do cliente; abrir/ocultar o relatório não envia requisições.
- A limitação de tokens é estrutural, não degradante: uma geração por empresa/mês, com orçamento fixo de resposta da IA (sem corte de conteúdo). Não existe mais o gate de cota que rebaixava o relatório para a versão determinística — o conteúdo profissional completo é sempre produzido quando a IA está configurada.
- Os tokens do relatório são registrados em `ai_usage` com `feature = 'relatorio_mensal'` e ficam isolados da cota geral de IA da empresa (`tokensUsadosMes` sem `feature` os ignora). Assim o relatório não consome o orçamento usado por respostas, tags e sentimento, e a cota geral também não afeta o relatório.
- Se o provedor de IA falhar ou não estiver configurado, o relatório usa a narrativa determinística de fallback (disponibilidade, não degradação por cota). A IA recebe apenas dados agregados e temas, nunca comentários individuais.

## Identidade visual

A interface do painel apresenta o conteúdo em linguagem profissional e usa a identidade visual Filtra.AI. O painel não oferece PDF nem usa a versão HTML destinada a outros canais.

## Conteúdo

- Resumo executivo e indicadores calculados no servidor.
- Distribuição de avaliações, sentimento e temas recorrentes.
- Riscos e oportunidades sustentados pelas avaliações do período.
- Ranking comparativo entre unidades e prioridades operacionais com evidências (quando a empresa tem unidades com avaliações no período).
- Radar estratégico, comparação com o mês anterior e oportunidades de crescimento (quando há sinal suficiente).
- Conteúdo textual estruturado para exibição no painel; não há distribuição por e-mail.

KPIs e contagens são sempre calculados pelo backend. O relatório declara quando não há histórico suficiente para comparação ou quando não houve avaliações válidas (nota média exibida como "—", nunca 0,0/5).

## Cadência e idempotência

O processo de preparação do snapshot deve ocorrer fora da interação do painel. O painel não dispara jobs, webhooks ou distribuição por e-mail; apenas exibe snapshots presentes no payload carregado. O plano Inicial fica fora da entrega mensal; Pro, Ultra, Corporativo e REI são elegíveis.

O armazenamento do snapshot mantém a chave de empresa + mês para evitar geração duplicada. O painel nunca cria nem altera esse snapshot.

## Benefícios por plano

O relatório mensal está incluído a partir do Pro e seu conteúdo progride conforme os benefícios: Pro (indicadores), Ultra (análise avançada), Corporativo (comparativo e prioridades por unidade) e REI (radar estratégico e oportunidades executivas). Reabrir o relatório no painel reutiliza os dados já carregados e não dispara chamadas ao backend nem à IA.
