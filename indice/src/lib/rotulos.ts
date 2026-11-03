/** Escolhe o primeiro candidato que cabe em `max` caracteres; se nenhum couber, o último (o mais curto). */
export function ate(max: number, ...candidatos: string[]): string {
  return candidatos.find((t) => t.length <= max) ?? candidatos[candidatos.length - 1];
}

/** Nome curto do segmento para títulos (o nome longo da CNAE estoura 60 caracteres). */
export const ROTULO_SEGMENTO: Record<string, string> = {
  restaurantes: 'restaurantes e bares',
  hoteis: 'hotéis',
  clinicas: 'clínicas',
  'profissionais-de-saude': 'profissionais de saúde',
  'saloes-de-beleza': 'salões de beleza',
  academias: 'academias',
  farmacias: 'farmácias',
  oficinas: 'oficinas mecânicas',
  supermercados: 'supermercados',
};

export function rotuloSegmento(slug: string, fallback: string): string {
  return ROTULO_SEGMENTO[slug] ?? fallback;
}

export const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Estados que pedem artigo: "no Rio de Janeiro", "na Bahia". Os demais usam "em"/"de".
const ARTIGO_UF: Record<string, 'o' | 'a'> = {
  AC: 'o', AP: 'o', AM: 'o', BA: 'a', CE: 'o', DF: 'o', ES: 'o', MA: 'o', MT: 'o', MS: 'o',
  PA: 'o', PB: 'a', PR: 'o', PI: 'o', RJ: 'o', RN: 'o', RS: 'o', TO: 'o',
};

/** "no Rio de Janeiro", "na Bahia", "em São Paulo". */
export function emUF(sigla: string, nome: string): string {
  const a = ARTIGO_UF[sigla];
  return a ? `n${a} ${nome}` : `em ${nome}`;
}

/** "do Rio de Janeiro", "da Bahia", "de São Paulo". */
export function deUF(sigla: string, nome: string): string {
  const a = ARTIGO_UF[sigla];
  return a ? `d${a} ${nome}` : `de ${nome}`;
}
