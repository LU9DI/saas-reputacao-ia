import type { MetadataRoute } from 'next';
import { getLastmod, todosOsCaminhos } from '@/lib/data';
import { urlAbsoluta } from '@/lib/seo';

// Shards menores reduzem o risco de timeout/502 em crawlers e proxies. O protocolo permite
// até 50 mil URLs/50 MB; 10 mil URLs por arquivo dá margem operacional adicional.
export const POR_ARQUIVO = 10000;

export async function generateSitemaps() {
  const qtd = Math.max(1, Math.ceil(todosOsCaminhos().length / POR_ARQUIVO));
  return Array.from({ length: qtd }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  // lastmod por página: só muda quando as estatísticas exibidas nela mudam (ver scripts/lib/lastmod.mjs).
  return todosOsCaminhos()
    .slice(id * POR_ARQUIVO, (id + 1) * POR_ARQUIVO)
    .map((caminho) => ({ url: urlAbsoluta(caminho), lastModified: getLastmod(caminho) }));
}
