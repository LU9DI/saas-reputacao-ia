import type { Metadata } from 'next';

const title = 'Filtra Dot — acesso privado';
const description =
  'Área privada do Filtra.AI, disponível somente ao proprietário autorizado da empresa.';

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    type: 'website',
    title,
    description,
    url: 'https://filtraai.com/dot',
    siteName: 'Filtra.AI',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
};

export default function DotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
