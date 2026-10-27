import type { MetadataRoute } from 'next';
import { todosOsItens } from '@/lib/caminhos';
import { urlAbsoluta } from '@/lib/seo';

// Limite do protocolo: 50 mil URLs ou 50 MB por arquivo. 40 mil deixa folga.
export const POR_ARQUIVO = 40000;

export async function generateSitemaps() {
  const qtd = Math.max(1, Math.ceil(todosOsItens().length / POR_ARQUIVO));
  return Array.from({ length: qtd }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  return todosOsItens()
    .slice(id * POR_ARQUIVO, (id + 1) * POR_ARQUIVO)
    .map(({ caminho, lastmod }) => ({ url: urlAbsoluta(caminho), lastModified: new Date(lastmod) }));
}
