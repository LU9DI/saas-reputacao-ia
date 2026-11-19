/** As quatro nações do Reino Unido. A chave é o slug da URL. */
export const NACOES_UK: Record<string, string> = {
  england: 'England',
  scotland: 'Scotland',
  wales: 'Wales',
  'northern-ireland': 'Northern Ireland',
};
/** Prefixo do código GSS da autoridade local: E, S, W, N. */
const PREFIXO: Record<string, string> = { E: 'england', S: 'scotland', W: 'wales', N: 'northern-ireland' };
export const nacaoDoCodigo = (codigoGss: string): string | undefined => PREFIXO[codigoGss.charAt(0).toUpperCase()];
export const slugNacao = (slug: string): string | undefined => (slug in NACOES_UK ? slug : undefined);
