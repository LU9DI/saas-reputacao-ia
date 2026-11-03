/**
 * Escolhe o primeiro candidato que cabe em `max` caracteres.
 * Se nenhum couber, encurta o último candidato com reticências, sem ultrapassar o limite.
 */
export function ate(max: number, ...candidatos: string[]): string {
  if (!Number.isSafeInteger(max) || max < 1) {
    throw new RangeError('max deve ser um inteiro positivo');
  }

  const escolhido = candidatos.find((texto) => texto.length <= max);
  if (escolhido !== undefined) return escolhido;

  const fallback = candidatos[candidatos.length - 1] ?? '';
  if (fallback.length <= max) return fallback;
  if (max === 1) return '…';

  let prefixo = fallback.slice(0, max - 1).trimEnd();
  const ultimoEspaco = prefixo.lastIndexOf(' ');
  if (ultimoEspaco >= Math.floor((max - 1) * 0.6)) {
    prefixo = prefixo.slice(0, ultimoEspaco);
  }

  return `${prefixo}…`;
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
