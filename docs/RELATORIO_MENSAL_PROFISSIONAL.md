# Relatório profissional mensal

O Relatório Inteligente mensal é acessado por botões no painel do cliente. Abrir em nova aba e baixar o HTML montam o documento no próprio navegador a partir do snapshot já incluído no payload do carregamento normal do painel (`relatorios_profissionais_mensais`). O painel é somente de leitura: não chama o endpoint de geração, não solicita nova análise e não faz nenhuma chamada de rede específica do relatório. A preparação do snapshot ocorre fora da interação do cliente; abrir, baixar ou reabrir apenas reutiliza os dados já carregados, sem consumir tokens.

O Relatório Inteligente legado e seus endpoints permanecem intactos e fora do escopo desta entrega.

## Painel do cliente

- Exibido para os planos Pro, Ultra, Corporativo e REI (o plano Inicial continua fora da entrega mensal).
- Os botões ficam na área do Relatório Inteligente e usam o mês de referência (mês calendário anterior) já selecionado.
- **Abrir relatório em nova aba:** monta o HTML completo no navegador (Blob URL) a partir do snapshot em memória e abre em uma nova aba. Não dispara `POST /api/empresa/:ref/relatorio-mensal` nem outra chamada de rede específica do relatório.
- **Baixar HTML:** gera o mesmo documento para download local, com nome `relatorio-mensal-{empresa}-{periodo}.html`. O download pode ser repetido indefinidamente, sem nova IA e sem consumir tokens.
- Permite selecionar entre snapshots mensais persistidos (histórico), com indicadores, resumo executivo, sentimento, temas, riscos, oportunidades, recomendações, ranking de unidades (quando há dados), prioridades operacionais e radar estratégico (quando há dados).
- O relatório completo é apresentado no documento HTML em linguagem profissional; o produto não gera PDF.
- Os snapshots ficam persistidos por empresa e mês, são verificados contra a empresa autenticada e também são incluídos no carregamento normal do painel (`relatorios_profissionais_mensais`), com o sinalizador `dashboard.mostrar_relatorio_mensal`.
- O documento real não contém `<script>` nem recursos externos: é um arquivo HTML autossuficiente, gerado sem `fetch`.

## Conteúdo progressivo por plano

- **Pro:** resumo executivo e indicadores essenciais do mês.
- **Ultra:** conteúdo do Pro + análise profissional de sentimento, temas recorrentes, riscos, oportunidades e interpretação por IA.
- **Corporativo:** conteúdo do Ultra + ranking comparativo entre unidades e prioridades operacionais baseadas em evidências.
- **REI:** conteúdo do Corporativo + radar estratégico, tendências comparativas e oportunidades de crescimento com recomendações executivas.
- O Inicial não tem direito ao relatório mensal. Não há bloco comercial ou comparativo de preços no documento; só aparecem módulos incluídos no plano atual — os módulos fora do plano não são renderizados no HTML, e não apenas ocultados por CSS.
- Se o plano mudar depois da criação do snapshot, a apresentação e os metadados são adaptados a partir do mesmo snapshot, sem uma nova chamada à IA. O snapshot persistido guarda o conteúdo integral para permitir upgrade no mesmo ciclo; o payload do painel e o payload de entrega do job (n8n) são sempre adaptados ao plano atual antes de sair do backend.

## Preparação do snapshot, cache e limites de tokens

- O endpoint `POST /api/empresa/:ref/relatorio-mensal` permanece disponível para processos internos/administrativos e compatibilidade, mas não é chamado pelo frontend do painel. A apresentação do cliente usa somente os snapshots que chegam no payload do carregamento normal do painel.
  - snapshot existente → `200 { success: true, cached: true, report }`;
  - uma solicitação interna autorizada sem snapshot pode gerar e persistir o relatório;
  - geração concorrente em andamento → `202 { status: 'generating', retry_after_ms }` sem duplicar custo;
  - período anterior à criação da empresa → `409 { code: 'REPORT_PERIOD_BEFORE_COMPANY' }`, inclusive se houver snapshot legado;
  - plano sem direito → `403 { code: 'REPORT_NOT_INCLUDED' }`.

Esses comportamentos de endpoint não são acionados pelo painel do cliente; abrir, baixar ou reabrir o relatório não envia requisições.

- A limitação de tokens é estrutural, não degradante: uma geração por empresa/mês, com orçamento fixo de resposta da IA (sem corte de conteúdo). Não existe mais o gate de cota que rebaixava o relatório para a versão determinística — o conteúdo profissional completo é sempre produzido quando a IA está configurada.
- Os tokens do relatório são registrados em `ai_usage` com `feature = 'relatorio_mensal'` e ficam isolados da cota geral de IA da empresa (`tokensUsadosMes` sem `feature` os ignora). Assim o relatório não consome o orçamento usado por respostas, tags e sentimento, e a cota geral também não afeta o relatório.
- Se o provedor de IA falhar ou não estiver configurado, o relatório usa a narrativa determinística de fallback (disponibilidade, não degradação por cota). A IA recebe apenas dados agregados e temas, nunca comentários individuais.

## Identidade visual

O documento HTML usa a identidade visual Filtra.AI, com seções numeradas, glossário "Como ler este relatório" e linguagem profissional e didática. O produto não gera PDF; abrir em nova aba e baixar usam o mesmo snapshot já carregado.

## Conteúdo

- Resumo executivo e indicadores calculados no servidor.
- Indicadores do período, sentimento e temas recorrentes.
- Riscos e oportunidades sustentados pelas avaliações do período.
- Ranking comparativo entre unidades e prioridades operacionais com evidências (quando a empresa tem unidades com avaliações no período).
- Radar estratégico, comparação com o mês anterior e oportunidades de crescimento (quando há sinal suficiente).
- Conteúdo textual estruturado para leitura em nova aba e download. A distribuição por e-mail/WhatsApp é feita pelo job externo via n8n quando configurado, usando o mesmo snapshot adaptado ao plano.

KPIs e contagens são sempre calculados pelo backend. O relatório declara quando não há histórico suficiente para comparação ou quando não houve avaliações válidas (nota média exibida como "—", nunca 0,0/5).

## Cadência e idempotência

O snapshot é preparado fora da interação do painel, uma vez por mês, no dia do aniversário da assinatura do plano (`relatorio_dia_assinatura`, gravado na ativação e preservado por `COALESCE`). Em meses mais curtos, os dias 29–31 caem no último dia do mês. Empresas ativas que assinaram antes de a coluna existir são regularizadas na primeira execução do job, usando o dia do fim do ciclo de cobrança atual como aniversário; depois disso, o `COALESCE` preserva o valor.

O painel não dispara jobs, webhooks ou distribuição por e-mail; apenas abre e baixa snapshots já presentes no payload carregado. O plano Inicial fica fora da entrega mensal; Pro, Ultra, Corporativo e REI são elegíveis.

O armazenamento do snapshot mantém a chave de empresa + mês para evitar geração duplicada. Abrir, baixar ou reabrir o relatório não cria nem altera esse snapshot.

## Operação do job mensal

O agendador externo deve chamar **diariamente** `POST /api/jobs/monthly-reports`, autenticando com `JOBS_SECRET` (`Authorization: Bearer …` ou header `x-jobs-secret`). No dia do aniversário de cada assinatura elegível, o job gera e persiste o snapshot do mês anterior.

Se o dia do aniversário for pulado, o job recupera o snapshot nos dias seguintes do mesmo mês. Se um mês inteiro ficar para trás e a empresa já tiver histórico, o job retoma o mês mais antigo em falta nas execuções seguintes, um por execução, sem gerar períodos anteriores à criação da empresa. Falhas de geração e de distribuição são tratadas separadamente: uma entrega de e-mail que falhou não impede a geração dos meses seguintes. Para recuperação manual de um mês específico, use `?mes=YYYY-MM`.

O agendador não faz parte deste repositório (Render/Cloudflare ou equivalente). Sem ele, nenhuma geração automática roda — a leitura do painel continua funcionando e não consome tokens, mas depende de snapshots já existentes.

## Benefícios por plano

O relatório mensal está incluído a partir do Pro e seu conteúdo progride conforme os benefícios: Pro (indicadores), Ultra (análise avançada), Corporativo (comparativo e prioridades por unidade) e REI (radar estratégico e oportunidades executivas). Abrir em nova aba, baixar e reabrir reutilizam os dados já carregados; nenhuma dessas ações dispara chamadas ao backend, gera nova análise ou consome tokens.
