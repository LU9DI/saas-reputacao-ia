import { serializeJsonLd } from '../lib/safeJsonLd';
const SITE_URL = 'https://filtraai.com';

type Crumb = { name: string; path: string };

/**
 * BreadcrumbList isolado (um <script> por schema facilita depurar no Rich Results Test).
 * Para páginas que não usam SeoLanding/BlogSchema, que já emitem o próprio breadcrumb.
 * `path` é o caminho canônico, sem domínio. Início é sempre o item 1.
 */
export function BreadcrumbJsonLd({
  crumbs,
  homeName = 'Início',
  homePath = '/',
}: {
  crumbs: Crumb[];
  homeName?: string;
  homePath?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: homeName, path: homePath }, ...crumbs].map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />;
}
