import type { Metadata } from 'next';
import { SeoPageHeader } from '../components/SeoPageHeader';

const title = 'Blog | Reputação, avaliações Google e SEO local';
const description =
  'Guias práticos sobre gestão de reputação online, avaliações Google, feedback de clientes e SEO local para empresas e agências.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://filtraai.com/blog' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Blog Filtra.AI | Reputação, avaliações Google e SEO local',
    description,
    url: 'https://filtraai.com/blog',
    siteName: 'Filtra.AI',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Filtra.AI | Reputação, avaliações Google e SEO local',
    description,
    images: ['https://filtraai.com/og-image.svg'],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoPageHeader />
      {children}
    </>
  );
}
