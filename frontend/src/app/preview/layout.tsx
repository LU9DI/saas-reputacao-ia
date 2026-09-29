import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://filtraai.com'),
  title: 'Filtra.AI — Gestão de reputação com IA | Preview',
  description: 'Gestão de avaliações, reputação, feedbacks, relatórios e inteligência artificial em um único painel.',
  robots: { index: false, follow: false },
  keywords: ['gestão de reputação','reputação online','avaliações de clientes','feedback de clientes','inteligência artificial','gestão de avaliações','Filtra.AI'],
  robots: { index: false, follow: false },
  alternates: { canonical: '/preview' },
  openGraph: { type: 'website', title: 'Filtra.AI — Gestão de reputação com IA', description: 'Gestão de avaliações, reputação, feedbacks e inteligência artificial em um único painel.', siteName: 'Filtra.AI', url: '/preview', locale: 'pt_BR' },
  twitter: { card: 'summary_large_image', title: 'Filtra.AI — Gestão de reputação com IA', description: 'Gestão de avaliações, reputação, feedbacks e IA em um único painel.' },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    '@context':'https://schema.org',
    '@type':'SoftwareApplication',
    name:'Filtra.AI',
    applicationCategory:'BusinessApplication',
    description:'Gestão de reputação, avaliações, feedbacks e inteligência artificial para empresas.',
    url:'https://filtraai.com/preview',
    offers:{'@type':'AggregateOffer',priceCurrency:'BRL'}
  };
  return <>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} /></>;
}
