import type { Metadata } from 'next';
import Client from './Client';

export const metadata: Metadata = {
  title: 'Painel da empresa',
  robots: { index: false, follow: false },
};

// Export estático (Cloudflare Pages): uma única página-casca; o id real vem da URL no cliente
// (ver utils/useRouteId e public/_redirects). Em dev/Vercel a rota é renderizada sob demanda.
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function Page() {
  return <Client />;
}
