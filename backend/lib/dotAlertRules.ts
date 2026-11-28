/**
 * Regras de alerta do Filtra Dot (A1–A12).
 * Avalia métricas expostas por /api/metrics e retorna alertas ativos.
 */

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type DotAlertRule = {
  id: string;
  name: string;
  metric: string;
  condition: string;
  severity: AlertSeverity;
  message: string;
  check_every_ms: number;
  exposed_in?: string;
};

export type DotAlert = DotAlertRule & {
  active: boolean;
  reason: string;
  evaluated_at: string;
  metric_value?: unknown;
};

const RULES: DotAlertRule[] = [
  {
    id: 'A1', name: 'dot.scheduler_down', metric: 'dot.last_error_at',
    condition: 'not_null', severity: 'critical',
    message: 'O scheduler do Filtra Dot relatou erro na última execução.',
    check_every_ms: 300_000,
  },
  {
    id: 'A2', name: 'dot.no_eligible_companies', metric: 'dot.eligible_companies',
    condition: '== 0', severity: 'warning',
    message: 'Nenhuma empresa elegível para o Filtra Dot. Verifique planos ativos (Rei/Corporativo).',
    check_every_ms: 900_000,
  },
  {
    id: 'A3', name: 'dot.pending_sent_over_grace', metric: 'dot.pending_sent_over_grace',
    condition: '> 0', severity: 'critical',
    message: 'Ações pendentes de envio do Dot além do período de graça. Verifique filas de ação e SMTP.',
    check_every_ms: 600_000, exposed_in: '/api/metrics',
  },
  {
    id: 'A4', name: 'dot.scheduler_not_running', metric: 'dot.last_run_at',
    condition: 'older_than_ms: 600000', severity: 'critical',
    message: 'O scheduler do Filtra Dot não executou há mais de 10 minutos.',
    check_every_ms: 300_000,
  },
  {
    id: 'A5', name: 'dot.high_error_rate', metric: 'dot.errors',
    condition: '> 5', severity: 'warning',
    message: 'Taxa elevada de erros no monitor do Dot nas últimas execuções.',
    check_every_ms: 300_000,
  },
  {
    id: 'A6', name: 'dot.zero_processed', metric: 'dot.processed',
    condition: '== 0', severity: 'warning',
    message: 'O scheduler do Dot não processou empresas na última janela. Verifique elegibilidade de planos.',
    check_every_ms: 900_000,
  },
  {
    id: 'A7', name: 'api.health_timeout', metric: 'http.GET /api/health.p95_ms',
    condition: '> 5000', severity: 'critical',
    message: 'Health check da API acima de 5s (p95). Possível instabilidade.',
    check_every_ms: 300_000,
  },
  {
    id: 'A8', name: 'api.health_failing', metric: 'http.GET /api/health.errors',
    condition: '> 0', severity: 'critical',
    message: 'Health check retornou erro (5xx).',
    check_every_ms: 300_000,
  },
  {
    id: 'A9', name: 'smtp.connection_timeout', metric: 'smtp.verify_ok',
    condition: '== false', severity: 'warning',
    message: 'SMTP não configurado ou falha de conexão.',
    check_every_ms: 900_000,
  },
  {
    id: 'A10', name: 'checkout.stripe_missing', metric: 'stripe.configured',
    condition: '== false', severity: 'warning',
    message: 'STRIPE_SECRET_KEY ausente. Checkout de cartão desabilitado.',
    check_every_ms: 900_000,
  },
  {
    id: 'A11', name: 'dot.actions_stuck_prepared', metric: 'dot.actions_prepared',
    condition: '> 0 && dot.actions_executed == 0', severity: 'warning',
    message: 'Ações do Dot preparadas mas não executadas.',
    check_every_ms: 900_000,
  },
  {
    id: 'A12', name: 'dot.events_unacknowledged', metric: 'dot.events_created',
    condition: '> 20', severity: 'warning',
    message: 'Mais de 20 eventos do Dot criados sem reconhecimento.',
    check_every_ms: 900_000,
  },
];

export function listAlertRules(): DotAlertRule[] {
  return [...RULES];
}

export function getAlertRule(id: string): DotAlertRule | undefined {
  return RULES.find((r) => r.id === id);
}

function evaluateCondition(value: unknown, condition: string): { passed: boolean; reason: string } {
  const num = Number(value);
  const isNum = !Number.isNaN(num) && typeof value === 'number';

  if (condition === 'not_null') {
    return { passed: value !== null && value !== undefined, reason: `valor=${String(value)}` };
  }
  if (condition === 'null') {
    return { passed: value === null || value === undefined, reason: `valor=${String(value)}` };
  }
  if (condition === '== false') {
    return { passed: value === false || value === 0 || value === '0', reason: `valor=${String(value)}` };
  }
  if (condition === '== true') {
    return { passed: value === true || value === 1 || value === '1', reason: `valor=${String(value)}` };
  }

  const m = condition.match(/^(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (!m) {
    return { passed: false, reason: `condição não reconhecida: ${condition}` };
  }

  const op = m[1];
  const ref = Number(m[2]);
  const refIsNum = !Number.isNaN(ref);

  if (!isNum || !refIsNum) {
    return { passed: false, reason: `valor não numérico para comparação: ${String(value)}` };
  }

  let passed = false;
  switch (op) {
    case '==': passed = num === ref; break;
    case '!=': passed = num !== ref; break;
    case '>': passed = num > ref; break;
    case '>=': passed = num >= ref; break;
    case '<': passed = num < ref; break;
    case '<=': passed = num <= ref; break;
  }

  return { passed, reason: `valor=${num}, referência=${ref}, operador=${op}` };
}

export function evaluateAlerts(metrics: {
  dot?: Record<string, unknown>;
  http?: Record<string, unknown>;
  ai?: Record<string, unknown>;
}): DotAlert[] {
  const now = new Date().toISOString();
  const dot = metrics.dot || {};
  const http = metrics.http || {};
  const ai = metrics.ai || {};

  const allMetrics: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(dot)) allMetrics[`dot.${k}`] = v;
  for (const [k, v] of Object.entries(http)) allMetrics[`http.${k}`] = v;
  for (const [k, v] of Object.entries(ai)) allMetrics[`ai.${k}`] = v;

  const alerts: DotAlert[] = [];

  for (const rule of RULES) {
    const value = allMetrics[rule.metric];
    const result = evaluateCondition(value, rule.condition);

    if (result.passed) {
      alerts.push({ ...rule, active: true, reason: result.reason, evaluated_at: now, metric_value: value });
    } else {
      alerts.push({ ...rule, active: false, reason: result.reason, evaluated_at: now, metric_value: value });
    }
  }

  return alerts;
}

export function getActiveAlerts(metrics: {
  dot?: Record<string, unknown>;
  http?: Record<string, unknown>;
  ai?: Record<string, unknown>;
}): DotAlert[] {
  return evaluateAlerts(metrics).filter((a) => a.active);
}