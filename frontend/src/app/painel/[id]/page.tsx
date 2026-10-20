import type { Metadata } from 'next';
import Client from './Client';

export const metadata: Metadata = {
  title: 'Painel da empresa',
  robots: { index: false, follow: false },
};

// Static export (Cloudflare Pages) needs a shell route and client-side ID lookup.
// The Render Next.js runtime must accept real IDs dynamically; otherwise
// dynamicParams=false makes every /painel/<id> except "_" return 404.
const isStaticExport = process.env.CLOUDFLARE_PAGES === '1';

export const dynamicParams = !isStaticExport;

export function generateStaticParams() {
  return isStaticExport ? [{ id: '_' }] : [];
}

export default function Page() {
  return <Client />;
}
