import type { MetadataRoute } from 'next';
import { getMeta, todosOsCaminhos } from '@/lib/data';
import { usAllPaths, usMeta } from '@/lib/us';
import { urlAbsoluta } from '@/lib/seo';

// Limite do protocolo: 50 mil URLs ou 50 MB por arquivo. 40 mil deixa folga.
export const POR_ARQUIVO = 40000;

const todos = () => [...todosOsCaminhos(), ...usAllPaths()];

export async function generateSitemaps() {
  const qtd = Math.max(1, Math.ceil(todos().length / POR_ARQUIVO));
  return Array.from({ length: qtd }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  // lastmod = data em que o dado foi gerado; só muda quando a base é reprocessada.
  const lastModified = new Date(getMeta().geradoEm);
  const lastUs = new Date(usMeta().generatedAt);
  const nBr = todosOsCaminhos().length;
  return todos()
    .slice(id * POR_ARQUIVO, (id + 1) * POR_ARQUIVO)
    .map((caminho, i) => ({ url: urlAbsoluta(caminho), lastModified: id * POR_ARQUIVO + i >= nBr ? lastUs : lastModified }));
}
