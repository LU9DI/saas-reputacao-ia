/**
 * Monitor de alertas do Filtra Dot.
 *
 * Consulta /api/metrics da API, avalia as regras de alerta (A1–A12)
 * e opcionalmente envia notificações via webhook.
 */

import { getDotMetrics } from './metrics.js';
import { evaluateAlerts, DotAlert } from './dotAlertRules.js';

export type MonitorResult = {
  evaluated_at: string;
  alerts: DotAlert[];
  active_count: number;
  source: string;
};

export async function runAlertMonitor(options: {
  apiUrl?: string;
  jobsSecret?: string;
  webhookUrl?: string;
}): Promise<MonitorResult> {
  const apiUrl = options.apiUrl || process.env.API_URL || 'http://localhost:5000';
  const jobsSecret = options.jobsSecret || process.env.JOBS_SECRET || '';
  const webhookUrl = options.webhookUrl || process.env.ALERT_WEBHOOK_URL || '';
  const evaluated_at = new Date().toISOString();

  // 1) Coleta métricas locais (disponíveis sempre que a API está rodando)
  const dotMetrics = getDotMetrics();

  // 2) Tenta enriquecer com métricas HTTP da API remota (opcional)
  let httpMetrics: Record<string, unknown> | undefined;
  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/metrics`, {
      headers: jobsSecret ? { 'x-jobs-secret': jobsSecret } : {},
    });
    if (res.ok) {
      const data = await res.json();
      httpMetrics = data.http;
    }
  } catch {
    // API remota indisponível — usamos apenas métricas locais
  }

  // 3) Avalia regras
  const alerts = evaluateAlerts({ dot: dotMetrics, http: httpMetrics });
  const active = alerts.filter((a) => a.active);

  // 4) Notifica via webhook se houver alertas ativos e webhook configurado
  if (active.length > 0 && webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluated_at,
          active_count: active.length,
          alerts: active.map((a) => ({ id: a.id, name: a.name, severity: a.severity, message: a.message, metric_value: a.metric_value })),
        }),
      });
    } catch {
      // Falha silenciosa — webhook opcional
    }
  }

  return {
    evaluated_at,
    alerts,
    active_count: active.length,
    source: apiUrl,
  };
}