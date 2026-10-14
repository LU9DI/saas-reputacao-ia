# Relatório profissional mensal

O relatório mensal é um entregável independente do painel. Esta implementação não altera componentes, rotas de tela ou fluxos do painel; mantém os endpoints PDF existentes por compatibilidade.

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

O job `POST /api/jobs/monthly-reports` prepara o mês calendário anterior e encaminha o relatório aos destinatários configurados. É possível indicar um mês encerrado por `?mes=YYYY-MM` para uma execução de recuperação. O plano Inicial fica fora da entrega mensal; Pro, Ultra, Corporativo e REI são elegíveis.

O job mantém a tabela `relatorio_envios_mensais` e reserva uma combinação única de empresa + mês. Uma segunda execução não encaminha de novo um relatório já aceito. Reservas em processamento por mais de 30 minutos podem ser retomadas; falhas ficam registradas e podem ser tentadas novamente.

## Configuração necessária para operação automática

- `JOBS_SECRET` definido no ambiente de produção.
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

Os textos comerciais não substituem a verificação dos gates de acesso existentes para recursos fora do relatório.
