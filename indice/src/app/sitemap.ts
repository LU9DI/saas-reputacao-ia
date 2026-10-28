import type { MetadataRoute } from 'next';
import { getLastmod, todosOsCaminhos } from '@/lib/data';
import { urlAbsoluta } from '@/lib/seo';

// Limite do protocolo: 50 mil URLs ou 50 MB por arquivo. 40 mil deixa folga.
export const POR_ARQUIVO = 40000;

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
