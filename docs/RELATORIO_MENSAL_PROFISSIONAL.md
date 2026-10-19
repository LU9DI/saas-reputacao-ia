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
  - primeira leitura do ciclo → gera uma única vez, persiste e responde `200 { cached: false, report }`;
  - geração concorrente em andamento → `202 { status: 'generating', retry_after_ms }` sem duplicar custo;
  - plano sem direito → `403 { code: 'REPORT_NOT_INCLUDED' }`.
- A limitação de tokens é estrutural, não degradante: uma geração por empresa/mês, com orçamento fixo de resposta da IA (sem corte de conteúdo). Não existe mais o gate de cota que rebaixava o relatório para a versão determinística — o conteúdo profissional completo é sempre produzido quando a IA está configurada.
- Os tokens do relatório são registrados em `ai_usage` com `feature = 'relatorio_mensal'` e ficam isolados da cota geral de IA da empresa (`tokensUsadosMes` sem `feature` os ignora). Assim o relatório não consome o orçamento usado por respostas, tags e sentimento, e a cota geral também não afeta o relatório.
- Se o provedor de IA falhar ou não estiver configurado, o relatório usa a narrativa determinística de fallback (disponibilidade, não degradação por cota). A IA recebe apenas dados agregados e temas, nunca comentários individuais.

## Identidade visual

O relatório HTML inclui o logotipo oficial do Filtra.AI no cabeçalho e uma marca-d'água tipográfica discreta "FILTRA.AI" no corpo. O HTML traz regras de impressão em A4 com fluxo natural, sem quebras de página forçadas, evitando páginas vazias; títulos, linhas de tabela e blocos curtos são protegidos contra cortes quando possível. A impressão deve ser conferida em navegadores diferentes, pois o comportamento final também depende do mecanismo de impressão.

## Conteúdo

- Resumo executivo e indicadores calculados no servidor.
- Distribuição de avaliações, sentimento e temas recorrentes.
- Riscos e oportunidades sustentados pelas avaliações do período.
- Ranking comparativo entre unidades e prioridades operacionais com evidências (quando a empresa tem unidades com avaliações no período).
- Radar estratégico, comparação com o mês anterior e oportunidades de crescimento (quando há sinal suficiente).
- E-mail HTML editorial, texto completo para outros canais e versão compacta para SMS.

KPIs e contagens são sempre calculados pelo backend. O relatório declara quando não há histórico suficiente para comparação ou quando não houve avaliações válidas (nota média exibida como "—", nunca 0,0/5).

## Cadência e idempotência

O job `POST /api/jobs/monthly-reports` prepara e persiste o snapshot do mês calendário anterior mesmo quando a distribuição ainda não está configurada; quando houver webhook e destinatários, também encaminha o relatório. É possível indicar um mês encerrado por `?mes=YYYY-MM` para uma execução de recuperação. O plano Inicial fica fora da entrega mensal; Pro, Ultra, Corporativo e REI são elegíveis.

O job mantém a tabela `relatorio_envios_mensais` e reserva uma combinação única de empresa + mês (a mesma reserva usada pelo endpoint sob demanda). Uma segunda execução não encaminha de novo um relatório já aceito. Reservas em processamento por mais de 30 minutos podem ser retomadas; falhas ficam registradas e podem ser tentadas novamente. Se o cliente já tiver gerado o snapshot pelo painel, o job reutiliza o `report_json` (sem novo custo de IA) ao encaminhar a distribuição.

## Configuração necessária para operação automática

- `JOBS_SECRET` definido no ambiente de produção. Envie-o no header `Authorization: Bearer ...` ou `x-jobs-secret`; não use query string para segredo.
- `N8N_WEBHOOK_URL` configurada e `N8N_ENABLED` não desativado.
- Workflow n8n que reconheça o evento `report.generated`, entregue o relatório aos canais informados e use `idempotency_key` para impedir duplicações na própria camada de distribuição.
- Agendador externo configurado para chamar o endpoint autenticado **diariamente** (UTC). O job verifica o dia de aniversário salvo em `empresas.relatorio_dia_assinatura` e prepara o relatório do mês calendário anterior. Não use apenas uma execução no dia 1: ela não atende assinantes com outros dias de aniversário.
- Assinaturas novas gravam o dia de aniversário na ativação e renovações preservam o valor. Para empresas antigas sem `relatorio_dia_assinatura`, o job não inventa a data a partir de `expira_em` (meses curtos tornam essa inferência ambígua); elas são contabilizadas em `sem_dia_assinatura` e precisam de backfill confiável a partir do registro original de assinatura antes de receberem o agendamento automático.

**Importante:** a resposta HTTP positiva do webhook confirma que o n8n aceitou o encaminhamento; a confirmação final de e-mail/WhatsApp/SMS depende do resultado do workflow e dos provedores de destino. Não se deve marcar uma entrega final como concluída se o workflow só tiver colocado o evento em uma fila sem acompanhar o resultado.

## Benefícios por plano

O relatório mensal está incluído a partir do Pro e seu conteúdo progride conforme os benefícios: Pro (indicadores), Ultra (análise avançada), Corporativo (comparativo e prioridades por unidade) e REI (radar estratégico e oportunidades executivas). Reabrir o relatório no painel reutiliza os dados já carregados e não dispara chamadas ao backend nem à IA.
