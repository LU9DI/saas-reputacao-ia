import type { Metadata } from 'next';
import Client from './Client';

export const metadata: Metadata = {
  title: 'Painel da empresa | Filtra.AI',
  robots: { index: false, follow: false },
};

// Export estático (Cloudflare Pages): uma única página-casca; o id real vem da URL no cliente
// (ver utils/useRouteId e public/_redirects).
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function Page() {
  return <Client />;
}
