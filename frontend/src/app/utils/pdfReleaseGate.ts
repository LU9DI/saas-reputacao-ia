/** PDF liberado após 1 mês da assinatura (aniversário do plano). Trial: liberado. */
export function pdfReleaseStatus(empresa: {
  plan?: string | null;
  status?: string | null;
  expira_em?: string | null;
} | null | undefined): { released: boolean; unlockLabel: string | null } {
  const p = String(empresa?.plan || '').toLowerCase();
  const s = String(empresa?.status || '').toLowerCase();
  if (p === 'trial' || p === 'teste' || p === 'test' || s === 'trial' || s === 'teste') {
    return { released: true, unlockLabel: null };
  }
  const expiraRaw = empresa?.expira_em;
  if (!expiraRaw) return { released: true, unlockLabel: null };
  const end = new Date(expiraRaw);
  if (Number.isNaN(end.getTime())) return { released: true, unlockLabel: null };
  const start = new Date(end.getTime());
  start.setMonth(start.getMonth() - 1);
  const unlock = new Date(start.getTime());
  unlock.setMonth(unlock.getMonth() + 1);
  if (Date.now() >= unlock.getTime()) return { released: true, unlockLabel: null };
  return {
    released: false,
    unlockLabel: unlock.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  };
}
