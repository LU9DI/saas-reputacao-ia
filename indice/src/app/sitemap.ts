import type { MetadataRoute } from 'next';
import { contarItens, iterarItens } from '@/lib/caminhos';
import { urlAbsoluta } from '@/lib/seo';

// Shards menores reduzem o risco de timeout/502 em crawlers e proxies. O protocolo permite
// até 50 mil URLs/50 MB; 10 mil URLs por arquivo dá margem operacional adicional.
export const POR_ARQUIVO = 10000;

export async function generateSitemaps() {
  const qtd = Math.max(1, Math.ceil(contarItens() / POR_ARQUIVO));
  return Array.from({ length: qtd }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  // lastmod por página: só muda quando as estatísticas exibidas nela mudam (ver scripts/lib/lastmod.mjs).
  if (!Number.isInteger(id) || id < 0) return [];

  const inicio = id * POR_ARQUIVO;
  const fim = inicio + POR_ARQUIVO;
  const itens: MetadataRoute.Sitemap = [];
  let indice = 0;
  for (const { caminho, lastmod } of iterarItens()) {
    if (indice >= fim) break;
    if (indice >= inicio) {
      itens.push({ url: urlAbsoluta(caminho), lastModified: new Date(lastmod) });
    }
    indice += 1;
  }
  return itens;
}
