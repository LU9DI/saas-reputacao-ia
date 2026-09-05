/** Validação de mês YYYY-MM no frontend (espelha regras da API). */

export function currentMonthYYYYMM(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function compareYYYYMM(a: string, b: string): number {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  if (ya !== yb) return ya - yb;
  return ma - mb;
}

export function validateReportMonth(
  raw: string,
  opts?: { minYear?: number; maxMonth?: string }
): { ok: true; value: string } | { ok: false; error: string } {
  const s = String(raw || '').trim();
  const maxMonth = opts?.maxMonth ?? currentMonthYYYYMM();
  const minYear = opts?.minYear ?? 2020;

  if (!/^\d{4}-\d{2}$/.test(s)) {
    return { ok: false, error: 'Use o formato AAAA-MM (ex.: 2026-09).' };
  }
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(5, 7));
  if (month < 1 || month > 12) {
    return { ok: false, error: 'Mês inválido (01–12).' };
  }
  if (year < minYear) {
    return { ok: false, error: `Ano mínimo: ${minYear}.` };
  }
  if (compareYYYYMM(s, maxMonth) > 0) {
    return { ok: false, error: `Não é possível escolher mês futuro (máx. ${maxMonth}).` };
  }
  const probe = new Date(year, month - 1, 1);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1) {
    return { ok: false, error: 'Data inválida.' };
  }
  return { ok: true, value: s };
}
