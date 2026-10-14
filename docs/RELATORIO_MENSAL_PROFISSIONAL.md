# Relatório profissional mensal

O relatório profissional mensal tem uma seção própria no painel do cliente. O job mensal gera um snapshot JSON completo a partir das avaliações reais do mês e persiste esse conteúdo em `relatorio_envios_mensais.report_json`. O painel entrega os snapshots junto de seu payload principal autenticado; a seção não dispara uma chamada de rede própria nem gera o relatório durante a visualização. O Relatório Inteligente legado e seus endpoints PDF permanecem intactos e fora do escopo de alteração.

## Painel do cliente

- Exibido para os planos Pro, Ultra, Corporativo e REI.
- Permite selecionar entre snapshots mensais previamente gerados, com indicadores, resumo executivo, sentimento, temas, riscos, recomendações e, conforme o plano, comparativo de unidades e radar estratégico.
- Os snapshots ficam persistidos por empresa e mês, são verificados contra a empresa autenticada e são incluídos no carregamento normal do painel. Não é feita geração sob demanda na navegação.
- A seção não gera nem disponibiliza um PDF paralelo; o relatório profissional mensal é a experiência principal no painel.
- Meses anteriores à ativação do job ou ainda não gerados não aparecem no histórico. O fallback visual baseado nas avaliações carregadas é mantido apenas quando não há snapshot salvo, sem afirmar que esse fallback seja um relatório mensal persistido.

## Identidade visual

O relatório HTML inclui o logotipo oficial do Filtra.AI no cabeçalho e uma marca-d’água tipográfica discreta “FILTRA.AI” no corpo. A identidade visual é aplicada ao novo entregável mensal, sem alterar o painel nem os endpoints e conteúdos legados de PDF. O HTML também traz regras de impressão em A4 com fluxo natural, sem quebras de página forçadas, evitando páginas vazias; títulos, linhas de tabela e blocos curtos são protegidos contra cortes quando possível. A impressão deve ser conferida em navegadores diferentes, pois o comportamento final também depende do mecanismo de impressão.

## Conteúdo

- Resumo executivo e indicadores calculados no servidor.
- Distribuição de avaliações, sentimento e temas recorrentes.
- Riscos e oportunidades sustentados pelas avaliações do período.
- Corporativo: ranking comparativo entre unidades e prioridades operacionais com evidências.
- REI: itens do radar estratégico, comparação com o mês anterior e oportunidades de crescimento.
- Narrativa redigida por IA nos planos com IA habilitada; se o provedor falhar, o relatório usa a narrativa determinística de fallback.
- E-mail HTML editorial, texto completo para outros canais e versão compacta para SMS.

A IA recebe apenas dados agregados e temas, não os comentários individuais dos clientes. KPIs e contagens continuam sendo calculados pelo backend. O relatório declara quando não há histórico suficiente para comparação.

## Cadência e idempotência

O job `POST /api/jobs/monthly-reports` prepara e persiste o snapshot do mês calendário anterior mesmo quando a distribuição ainda não está configurada; quando houver webhook e destinatários, também encaminha o relatório. É possível indicar um mês encerrado por `?mes=YYYY-MM` para uma execução de recuperação. O plano Inicial fica fora da entrega mensal; Pro, Ultra, Corporativo e REI são elegíveis.

O job mantém a tabela `relatorio_envios_mensais` e reserva uma combinação única de empresa + mês. Uma segunda execução não encaminha de novo um relatório já aceito. Reservas em processamento por mais de 30 minutos podem ser retomadas; falhas ficam registradas e podem ser tentadas novamente.

## Configuração necessária para operação automática

- `JOBS_SECRET` definido no ambiente de produção. Envie-o no header `Authorization: Bearer ...` ou `x-jobs-secret`; não use query string para segredo.
- `N8N_WEBHOOK_URL` configurada e `N8N_ENABLED` não desativado.
- Workflow n8n que reconheça o evento `report.generated`, entregue o relatório aos canais informados e use `idempotency_key` para impedir duplicações na própria camada de distribuição.
- Agendador externo configurado para chamar o endpoint autenticado mensalmente (recomendação: dia 1, depois da virada UTC). Pode ser executado diariamente com segurança, pois a idempotência evita reenvios do mesmo mês.

**Importante:** a resposta HTTP positiva do webhook confirma que o n8n aceitou o encaminhamento; a confirmação final de e-mail/WhatsApp/SMS depende do resultado do workflow e dos provedores de destino. Não se deve marcar uma entrega final como concluída se o workflow só tiver colocado o evento em uma fila sem acompanhar o resultado.

## Benefícios por plano

- **Pro:** relatório profissional mensal com indicadores do período.
- **Ultra:** relatório mensal com análise de sentimento, temas recorrentes e interpretação por IA.
- **Corporativo:** visão multiunidades, ranking comparativo, temas por unidade e prioridades operacionais.
- **REI:** inclui o escopo Corporativo e acrescenta leitura executiva mensal, radar de riscos/tendências e oportunidades de crescimento.
- **Trial:** não herda os benefícios exclusivos do REI.

O conteúdo do relatório respeita a hierarquia dos planos: Pro recebe o resumo e os indicadores essenciais; Ultra acrescenta interpretação, temas, riscos, oportunidades e plano de ação; Corporativo acrescenta ranking e prioridades por unidade; REI acrescenta o radar estratégico. Quando não há avaliações válidas, a nota média é exibida como “—”, não como 0,0/5.

Os textos comerciais não substituem a verificação dos gates de acesso existentes para recursos fora do relatório.
