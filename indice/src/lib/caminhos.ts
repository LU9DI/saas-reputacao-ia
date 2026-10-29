import { getLastmod, todosOsCaminhos } from './data';
import { temDadosUS, usCaminhos, usMeta } from './us';

export type Item = { caminho: string; lastmod: string };

/** Brasil + EUA. BR: lastmod por página (lastmod.json). EUA: data de geração da base. */
export function todosOsItens(): Item[] {
  const itens: Item[] = todosOsCaminhos().map((caminho) => ({ caminho, lastmod: getLastmod(caminho).toISOString() }));
  if (temDadosUS()) {
    const us = usMeta().geradoEm;
    for (const caminho of usCaminhos()) itens.push({ caminho, lastmod: us });
  }
  return itens;
}
