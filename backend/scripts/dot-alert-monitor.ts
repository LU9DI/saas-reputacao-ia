#!/usr/bin/env tsx
/**
 * Script CLI para executar o monitor de alertas do Filtra Dot.
 *
 * Uso:
 *   npx tsx scripts/dot-alert-monitor.ts
 *
 * Variáveis de ambiente:
 *   API_URL            URL pública da API (padrão: http://localhost:5000)
 *   JOBS_SECRET        Segredo para autenticar em /api/metrics
 *   ALERT_WEBHOOK_URL  Webhook opcional para notificação de alertas ativos
 */

import { runAlertMonitor } from '../lib/dotAlertMonitor.js';

async function main() {
  const result = await runAlertMonitor({});

  console.log(`🔔 Monitor de alertas do Filtra Dot — ${result.evaluated_at}`);
  console.log(`   Fonte: ${result.source}`);
  console.log(`   Alertas ativos: ${result.active_count}`);

  for (const alert of result.alerts) {
    const mark = alert.active ? '🔴' : '🟢';
    console.log(
      `   ${mark} ${alert.id} (${alert.severity}): ${alert.name} — ${alert.reason}`
    );
  }

  if (result.active_count > 0) {
    process.exitCode = 0;
  }
}

main().catch((error) => {
  console.error('❌ Erro no monitor de alertas:', error?.message || error);
  process.exitCode = 1;
});