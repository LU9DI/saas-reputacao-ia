/**
 * Planos oficiais do produto + flags de recurso.
 */

export const PLANOS_OFICIAIS = ['inicial', 'pro', 'ultra', 'corporativo', 'rei'] as const;
export type PlanoOficial = (typeof PLANOS_OFICIAIS)[number];

export function isPlanoOficial(p: string): p is PlanoOficial {
  return (PLANOS_OFICIAIS as readonly string[]).includes(String(p || '').toLowerCase());
}

/** Em dev (ou ALLOW_PLAN_SWITCH=1) o cliente pode alternar plano sem Stripe. */
export function allowPlanSwitch(): boolean {
  if (process.env.ALLOW_PLAN_SWITCH === '0') return false;
  if (process.env.ALLOW_PLAN_SWITCH === '1') return true;
  return process.env.NODE_ENV !== 'production';
}

/** Trial / teste de 7 dias — tudo incluso (IA, PDF, dashboard completo). */
export function isTrialPlan(plan: string | null | undefined): boolean {
  const p = String(plan || '').toLowerCase();
  return p === 'trial' || p === 'teste' || p === 'trialing' || p.startsWith('trial');
}

/** Relatório profissional mensal: Pro e acima + trial. O Inicial não inclui o entregável mensal. */
export function planTemRelatorioMensal(plan: string | null | undefined): boolean {
  const p = String(plan || '').toLowerCase();
  if (isTrialPlan(p)) return true;
  return ['pro', 'ultra', 'corporativo', 'corp', 'rei'].includes(p);
}

/** Alias legado mantido para que rotas antigas não quebrem enquanto o PDF é aposentado como entregável. */
export function planTemPdf(plan: string | null | undefined): boolean {
  return planTemRelatorioMensal(plan);
}
/** Alias usado por alguns módulos legados */
export function empresaTemPdf(empresa: { plan?: string; status?: string } | null): boolean {
  if (!empresa) return false;
  return planTemPdf(empresa.plan || empresa.status);
}

export function planLabel(plan: string): string {
  const map: Record<string, string> = {
    trial: 'Trial',
    teste: 'Teste',
    trialing: 'Trial',
    inicial: 'Inicial',
    pro: 'Pro',
    ultra: 'Ultra',
    corporativo: 'Corporativo',
    corp: 'Corporativo',
    rei: 'Rei',
  };
  return map[String(plan || '').toLowerCase()] || String(plan || '—');
}
