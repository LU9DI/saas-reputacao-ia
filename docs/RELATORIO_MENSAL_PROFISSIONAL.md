# Relatório profissional mensal

O relatório profissional mensal é um botão dentro da seção do Relatório Inteligente no painel do cliente. O documento tem conteúdo padronizado (sem diferenciação por plano) e é gerado uma única vez por ciclo mensal: o primeiro acesso do mês gera e persiste o snapshot em `relatorio_envios_mensais.report_json`; reaberturas e downloads ilimitados leem esse snapshot em cache, sem novo consumo de IA.

O Relatório Inteligente legado e seus endpoints permanecem intactos e fora do escopo desta entrega.

## Painel do cliente

- Exibido para os planos Pro, Ultra, Corporativo e REI (o plano Inicial continua fora da entrega mensal).
- O botão fica na área do Relatório Inteligente e abre o painel do mês de referência (mês calendário anterior).
- No primeiro clique de um ciclo sem snapshot, o painel mostra o estado "Gerando o relatório deste mês…" e chama `POST /api/empresa/:ref/relatorio-mensal`. Nos cliques seguintes o relatório abre imediatamente do cache local/persistido.
- Permite selecionar entre snapshots mensais persistidos (histórico), com indicadores, resumo executivo, sentimento, temas, riscos, oportunidades, recomendações, ranking de unidades (quando há dados), prioridades operacionais e radar estratégico (quando há dados).
- Contém o botão **Baixar PDF**: abre o HTML profissional persistido (`canais.email.html`) em nova aba com as regras de impressão A4 e aciona a impressão/salvamento em PDF. Se o navegador bloquear a janela, o arquivo HTML é baixado como fallback. Nenhum download consome IA.
- Os snapshots ficam persistidos por empresa e mês, são verificados contra a empresa autenticada e também são incluídos no carregamento normal do painel (`relatorios_profissionais_mensais`), com o sinalizador `dashboard.mostrar_relatorio_mensal`.

## Uniformidade entre planos

- O documento renderizado é idêntico para todos os planos elegíveis: as seções (unidades, prioridades, radar, oportunidades) dependem apenas dos dados do período, nunca do plano contratado.
- Não há bloco comercial, "escopo do plano" ou comparativo de planos dentro do relatório (nem no HTML, nem no texto dos canais).
- A narrativa interpretativa é redigida por IA para todos os planos elegíveis, uma vez por ciclo.

## Geração, cache e limites de tokens

- `POST /api/empresa/:ref/relatorio-mensal` (autenticado pelo token da empresa) opera no modo "get-or-generate" para o mês de referência (mês calendário anterior, calculado no servidor):
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

O relatório mensal está incluído a partir do Pro, com o mesmo conteúdo profissional em todos os planos elegíveis (Pro, Ultra, Corporativo e REI). Os demais recursos de cada plano continuam seguindo os gates existentes no painel e nos textos comerciais; o conteúdo do relatório mensal não é hierarquizado pelo plano.
