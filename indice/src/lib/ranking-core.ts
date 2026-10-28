/**
 * Ordenação com posição de competição: empates dividem a mesma posição (1, 2, 2, 4).
 * Sem dependências, para poder ser testada direto com `node --test`.
 */
export type Posicionada<T> = T & { pos: number };

export function posicionar<T>(linhas: T[], valor: (x: T) => number, desempate: (x: T) => string): Posicionada<T>[] {
  const ordenadas = [...linhas].sort((x, y) => valor(y) - valor(x) || desempate(x).localeCompare(desempate(y), 'pt-BR'));
  const saida: Posicionada<T>[] = [];
  ordenadas.forEach((linha, i) => {
    const anterior = saida[i - 1];
    const pos = anterior && valor(ordenadas[i - 1]) === valor(linha) ? anterior.pos : i + 1;
    saida.push({ ...linha, pos });
  });
  return saida;
}
