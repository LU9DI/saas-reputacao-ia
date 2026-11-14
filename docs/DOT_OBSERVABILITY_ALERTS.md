# Observabilidade e Alertas — Filtra Dot

Este documento consolida a observabilidade do módulo Filtra Dot, incluindo métricas expostas, regras de alerta (A1–A12) e procedimentos de operação.

## Métricas expostas em `GET /api/metrics`

O endpoint `/api/metrics` retorna, além das métricas HTTP e de IA, um bloco `dot` com contadores do Filtra Dot:

```json
{
  "dot": {
    "eligible_companies": 0,
    "due": 0,
    "processed": 0,
    "skipped": 0,
    "errors": 0,
    "events_created": 0,
    "decisions_created": 0,
    "actions_prepared": 0,
    "followups_processed": 0,
    "pending_sent_over_grace": 0,
    "last_run_at": null,
    "last_success_at": null,
    "last_error_at": null,
    "last_error": null
  }
}
```

### `dot.pending_sent_over_grace` (lacuna A3 resolvida)

Conta ações de envio do Dot que permanecem pendentes além do período de graça configurado. É avaliada pela regra **A3** e exposta explicitamente em `/api/metrics`.

## Regras de alerta (A1–A12)

As regras estão definidas em `ops/alerts/dot-alerts.json` e implementadas em `backend/lib/dotAlertRules.ts`.

| ID | Nome | Métrica | Condição | Severidade |
|----|------|---------|----------|------------|
| A1 | dot.scheduler_down | dot.last_error_at | not_null | critical |
| A2 | dot.no_eligible_companies | dot.eligible_companies | == 0 | warning |
| A3 | dot.pending_sent_over_grace | dot.pending_sent_over_grace | > 0 | critical |
| A4 | dot.scheduler_not_running | dot.last_run_at | older_than_ms: 600000 | critical |
| A5 | dot.high_error_rate | dot.errors | > 5 | warning |
| A6 | dot.zero_processed | dot.processed | == 0 | warning |
| A7 | api.health_timeout | http.GET /api/health.p95_ms | > 5000 | critical |
| A8 | api.health_failing | http.GET /api/health.errors | > 0 | critical |
| A9 | smtp.connection_timeout | smtp.verify_ok | == false | warning |
| A10 | checkout.stripe_missing | stripe.configured | == false | warning |
| A11 | dot.actions_stuck_prepared | dot.actions_prepared | > 0 && dot.actions_executed == 0 | warning |
| A12 | dot.events_unacknowledged | dot.events_created | > 20 | warning |

## Execução do monitor de alertas

```bash
# Local (desenvolvimento)
npx tsx backend/scripts/dot-alert-monitor.ts

# Com variáveis de ambiente
API_URL=https://filtra-ia-api.onrender.com \
JOBS_SECRET=seu-segredo \
ALERT_WEBHOOK_URL=https://hooks.slack.com/... \
npx tsx backend/scripts/dot-alert-monitor.ts
```

## Autenticação de métricas

Em produção (`NODE_ENV=production` com `JOBS_SECRET` definido), `/api/metrics` exige o cabeçalho `x-jobs-secret`. Sem ele, retorna HTTP 401.

## Tratamento de falhas

- Se a API estiver indisponível, o monitor registra o erro e não dispara alertas falsos.
- Webhook de notificação é opcional (`ALERT_WEBHOOK_URL`). Sem ele, alertas são apenas logados no console.
- Não inventa credenciais nem URLs de webhook. Se `JOBS_SECRET` ou `ALERT_WEBHOOK_URL` não estiverem definidos, o monitor funciona com métricas locais e sem notificação externa.

## Arquivos relacionados

| Caminho | Função |
|---------|--------|
| `backend/lib/metrics.ts` | Coleta e expõe métricas HTTP + Dot (inclui `pending_sent_over_grace`) |
| `backend/services/dotScheduler.ts` | Atualiza contadores Dot após cada execução do scheduler |
| `backend/lib/dotAlertRules.ts` | Regras A1–A12 e motor de avaliação |
| `backend/lib/dotAlertMonitor.ts` | Monitor que consulta `/api/metrics` e avalia alertas |
| `backend/scripts/dot-alert-monitor.ts` | CLI para execução manual ou via cron |
| `backend/tests/dotAlertRules.test.ts` | Testes das regras de alerta |
| `ops/alerts/dot-alerts.json` | Definição declarativa das 12 regras |
| `ops/alerts/README.md` | Guia de operação do monitor |