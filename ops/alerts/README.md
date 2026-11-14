# Alertas do Filtra Dot

Este diretório contém a definição das regras de alerta operacionais do módulo Filtra Dot.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `dot-alerts.json` | Definição das 12 regras de alerta (A1–A12) com métricas, condições e severidades |
| `README.md` | Este documento |

## Como as alertas funcionam

As alertas são avaliadas contra os dados expostos pelo endpoint `GET /api/metrics` da API `filtra-ia-api`. O endpoint requer o cabeçalho `x-jobs-secret` (igual ao `JOBS_SECRET` do backend) em produção.

## Regras (A1–A12)

Consulte `dot-alerts.json` para a lista completa de alertas, condições e severidades.

### A3 — `dot.pending_sent_over_grace`

Esta métrica foi adicionada ao endpoint `/api/metrics` e conta ações de envio do Dot que permanecem pendentes além do período de graça configurado. É exposta sob a chave `dot.pending_sent_over_grace` no objeto `dot` da resposta de `/api/metrics`.

## Execução do monitor

O monitor de alertas pode ser executado via CLI:

```bash
npx tsx scripts/dot-alert-monitor.ts
```

Requires as variáveis de ambiente:
- `API_URL` — URL pública da API (p. ex. `https://filtra-ia-api.onrender.com`)
- `JOBS_SECRET` — segredo para autenticar em `/api/metrics`
- `ALERT_WEBHOOK_URL` — (opcional) webhook para notificação de alertas disparados

## Autenticação de métricas

O endpoint `/api/metrics` exige o cabeçalho `x-jobs-secret` quando `NODE_ENV=production` e `JOBS_SECRET` está definido. Sem esse cabeçalho (ou com valor incorreto), retorna HTTP 401.

## Tratamento de falhas

Se a API estiver indisponível ou retornar erro, o monitor registra o erro no console e não dispara alertas falsos. Não inventa credenciais nem URLs de webhook: se `ALERT_WEBHOOK_URL` não estiver definido, os alertas são apenas logados localmente.