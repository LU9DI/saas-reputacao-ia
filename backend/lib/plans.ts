/**
 * Planos oficiais do produto + flags de recurso.
 *
 * Regra de ouro: o plano exibido/decidido deve vir SEMPRE do plano real da
 * empresa autenticada. Aliases legados (`corp`, `corporate`) são
 * normalizados para `corporativo`; nunca há fallback para `rei`.
 */

export const PLANOS_OFICIAIS = ['inicial', 'pro', 'ultra', 'corporativo', 'rei'] as const;
export type PlanoOficial = (typeof PLANOS_OFICIAIS)[number];

/** Normaliza aliases e sufixos de ciclo de cobrança sem inventar um plano. */
function canonicalPlanKey(plan: string | null | undefined): string {
  const p = String(plan ?? '').trim().toLowerCase();
  if (!p) return '';
  if (p === 'corp' || p === 'corporate') return 'corporativo';
  if (p.endsWith('-anual')) return p.slice(0, -'-anual'.length);
  return p;
}

/**
 * Retorna o plano oficial canônico ou `null` quando o valor é ausente,
 * desconhecido ou apenas um alias que não corresponde a um plano oficial.
 */
export function normalizePlan(plan: string | null | undefined): PlanoOficial | null {
  const canonical = canonicalPlanKey(plan);
  return (PLANOS_OFICIAIS as readonly string[]).includes(canonical)
    ? (canonical as PlanoOficial)
    : null;
}

export function isPlanoOficial(p: string): p is PlanoOficial {
  return normalizePlan(p) !== null;
}

/** Em dev (ou ALLOW_PLAN_SWITCH=1) o cliente pode alternar plano sem Stripe. */
export function allowPlanSwitch(): boolean {
  if (process.env.ALLOW_PLAN_SWITCH === '0') return false;
  if (process.env.ALLOW_PLAN_SWITCH === '1') return true;
  return process.env.NODE_ENV !== 'production';
}

/** Trial / teste de 7 dias — tudo incluso (IA, PDF, dashboard completo). */
export function isTrialPlan(plan: string | null | undefined): boolean {
  const p = canonicalPlanKey(plan);
  return p === 'trial' || p === 'teste' || p === 'trialing' || p.startsWith('trial');
}

/** PDF mensal: Pro e acima + trial (tudo incluso nos 7 dias). Inicial pago não tem PDF. */
export function planTemPdf(plan: string | null | undefined): boolean {
  const p = canonicalPlanKey(plan);
  if (isTrialPlan(p)) return true;
  if (['pro', 'ultra', 'corporativo', 'rei'].includes(p)) return true;
  return false;
}

/** Alias usado por alguns módulos legados */
export function empresaTemPdf(empresa: { plan?: string; status?: string } | null): boolean {
  if (!empresa) return false;
  return planTemPdf(empresa.plan || empresa.status);
}

/** Rótulo humano do plano. Valores desconhecidos são devolvidos como vieram. */
export function planLabel(plan: string | null | undefined): string {
  const p = canonicalPlanKey(plan);
  const map: Record<string, string> = {
    trial: 'Trial',
    teste: 'Teste',
    trialing: 'Trial',
    inicial: 'Inicial',
    pro: 'Pro',
    ultra: 'Ultra',
    corporativo: 'Corporativo',
    rei: 'Rei',
  };
  return map[p] || String(plan ?? '').trim() || '—';
}

/** Planos que podem usar o Filtra Dot. */
export function isDotPlan(plan: string | null | undefined): boolean {
  const normalized = normalizePlan(plan);
  return normalized === 'rei' || normalized === 'corporativo';
}

export type DotPlanCode =
  | 'DOT_PLAN_OK'
  | 'DOT_PLAN_MISSING'
  | 'DOT_PLAN_INVALID'
  | 'DOT_PLAN_NOT_ALLOWED';

export type DotPlanDecision = {
  allowed: boolean;
  plan: PlanoOficial | null;
  label: string | null;
  code: DotPlanCode;
  reason: string | null;
};

/**
 * Decide o acesso ao Dot a partir da ÚNICA fonte de verdade: o plano da
 * empresa autenticada. Ausência de plano nunca libera acesso e nunca vira
 * `rei`. Planos oficiais fora da lista do Dot são negados, mas continuam
 * identificados (ex.: Ultra aparece como Ultra, não como Rei).
 */
export function resolveDotPlan(plan: string | null | undefined): DotPlanDecision {
  const raw = String(plan ?? '').trim();
  if (!raw) {
    return {
      allowed: false,
      plan: null,
      label: null,
      code: 'DOT_PLAN_MISSING',
      reason: 'Plano da empresa não identificado.',
    };
  }

  const normalized = normalizePlan(raw);
  if (!normalized) {
    return {
      allowed: false,
      plan: null,
      label: null,
      code: 'DOT_PLAN_INVALID',
      reason: 'Plano da empresa inválido.',
    };
  }

  if (!isDotPlan(normalized)) {
    return {
      allowed: false,
      plan: normalized,
      label: planLabel(normalized),
      code: 'DOT_PLAN_NOT_ALLOWED',
      reason: 'O Filtra Dot está em acesso antecipado para os planos Rei e Corporativo.',
    };
  }

  return {
    allowed: true,
    plan: normalized,
    label: planLabel(normalized),
    code: 'DOT_PLAN_OK',
    reason: null,
  };
}
