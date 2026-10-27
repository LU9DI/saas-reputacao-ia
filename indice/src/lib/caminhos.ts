import { getMeta, todosOsCaminhos } from './data';
import { temDadosUS, usCaminhos, usMeta } from './us';

export type Item = { caminho: string; lastmod: string };

/** Brasil + EUA. lastmod = data em que cada base foi gerada; só muda quando a base é reprocessada. */
export function todosOsItens(): Item[] {
  const br = getMeta().geradoEm;
  const itens: Item[] = todosOsCaminhos().map((caminho) => ({ caminho, lastmod: br }));
  if (temDadosUS()) {
    const us = usMeta().geradoEm;
    for (const caminho of usCaminhos()) itens.push({ caminho, lastmod: us });
  }
  return itens;
}
