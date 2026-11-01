const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const n = (x: number) => x.toLocaleString('pt-BR');
export const ord = (x: number) => `${n(x)}º`;
export const pct = (parte: number, total: number, casas = 1) =>
  total > 0 ? `${((parte / total) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas })}%` : '0%';
export const capitaliza = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "2026-10" -> "outubro de 2026" */
export function mesPorExtenso(ym: string): string {
  const [a, m] = ym.split('-').map(Number);
  return `${MESES[m - 1]} de ${a}`;
}
/** "2025-10" -> "out/2025" */
export function mesCurto(ym: string): string {
  const [a, m] = ym.split('-').map(Number);
  return `${MESES[m - 1].slice(0, 3)}/${a}`;
}
/** "2026-10-26T07:34:27.901Z" -> "26/10/2026", sem deslocar o dia pelo fuso do servidor. */
export function dataCurta(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
export function corta(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  return `${corte.slice(0, corte.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')}…`;
}

// --- English / US formatting ---
export const nUS = (x: number) => x.toLocaleString('en-US');
export function ordUS(x: number): string {
  const r100 = x % 100;
  if (r100 >= 11 && r100 <= 13) return `${nUS(x)}th`;
  return `${nUS(x)}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[x % 10] ?? 'th'}`;
}
export const pctUS = (parte: number, total: number, casas = 1) =>
  total > 0 ? `${((parte / total) * 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: casas })}%` : '0%';
