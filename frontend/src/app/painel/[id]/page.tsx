import type { Metadata } from 'next';
import Client from './Client';

export const metadata: Metadata = {
  title: 'Painel da empresa',
  robots: { index: false, follow: false },
};

// The prebuild script replaces this file with the appropriate static-export
// or runtime variant. Keep the committed default safe for the Render runtime.
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function Page() {
  return <Client />;
}
