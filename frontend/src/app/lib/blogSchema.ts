import { OG_IMAGE_URL } from './socialMetadata';

export { OG_IMAGE_META, buildTwitter } from './socialMetadata';

const SITE_URL = 'https://filtraai.com';
const PUBLISHER_LOGO = `${SITE_URL}/icons/icon.svg`;

export type BlogPostingInput = {
  headline: string;
  description: string;
  canonical: string;
  datePublished: string;
  dateModified: string;
};

export function buildBlogPosting({
  headline,
  description,
  canonical,
  datePublished,
  dateModified,
}: BlogPostingInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    image: OG_IMAGE_URL,
    datePublished,
    dateModified,
    inLanguage: 'pt-BR',
    author: { '@type': 'Organization', name: 'Filtra.AI', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Filtra.AI',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: PUBLISHER_LOGO },
    },
    isPartOf: { '@type': 'WebSite', name: 'Filtra.AI', url: SITE_URL },
  };
}

export function buildBreadcrumbList(canonical: string, headline: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: headline, item: canonical },
    ],
  };
}
