import { getLastmod, iterarCaminhos } from './data';
import { temDadosUS, usCaminhos, usMeta } from './us';

export type Item = { caminho: string; lastmod: string };

/** Brasil + EUA, sem alocar a lista inteira. BR: lastmod por página. EUA: data de geração da base. */
export function* iterarItens(): Generator<Item> {
  for (const caminho of iterarCaminhos()) yield { caminho, lastmod: getLastmod(caminho).toISOString() };
  if (temDadosUS()) {
    const us = usMeta().geradoEm;
    for (const caminho of usCaminhos()) yield { caminho, lastmod: us };
  }
}

export function contarItens(): number {
  let total = 0;
  for (const _ of iterarItens()) total += 1;
  return total;
}

export function todosOsItens(): Item[] {
  return Array.from(iterarItens());
}
