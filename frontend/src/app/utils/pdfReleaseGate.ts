/** PDF liberado a cada aniversário mensal da assinatura. Trial: liberado. */
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

  // expira_em representa o fim do período mensal já pago/atual.
  // Portanto, o PDF do ciclo é liberado no mesmo dia do mês em que
  // esse período termina e a assinatura entra no próximo ciclo.
  const expiraRaw = empresa?.expira_em;
  if (!expiraRaw) return { released: true, unlockLabel: null };
  const unlock = new Date(expiraRaw);
  if (Number.isNaN(unlock.getTime())) return { released: true, unlockLabel: null };

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
