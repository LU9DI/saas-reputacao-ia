import Link from 'next/link';
import { SeoPageHeader } from './SeoPageHeader';

type Section = { heading: string; body: string };
type ContextLink = { href: string; title: string; description: string };

const UI = {
  home: 'Início',
  deep: 'Aprofunde sua análise de reputação',
  deepBody: 'Continue por estes caminhos para entender feedback, avaliações, reputação e diagnóstico.',
  cta: 'Começar teste gratuito (7 dias)',
};

const DEFAULT_CONTEXT_LINKS: ContextLink[] = [
  {
    href: '/filtra-ai',
    title: 'Filtra.AI — gestão de reputação',
    description: 'Conheça a plataforma de gestão de reputação, avaliações Google e feedback com IA.',
  },
  {
    href: '/avaliacoes-google',
    title: 'Avaliações Google',
    description: 'Entenda como transformar avaliações Google e feedback em uma rotina de gestão.',
  },
  {
    href: '/feedback-de-clientes',
    title: 'Feedback de clientes',
    description: 'Transforme opiniões em informação útil para o negócio.',
  },
  {
    href: '/analise-de-avaliacoes-com-ia',
    title: 'Análise de avaliações com IA',
    description: 'Identifique padrões e temas recorrentes nas avaliações.',
  },
  {
    href: '/gestao-de-reputacao-online',
    title: 'Gestão de reputação online',
    description: 'Organize monitoramento, respostas e evolução da reputação.',
  },
  {
    href: '/auditoria-gratuita',
    title: 'Auditoria gratuita',
    description: 'Faça um diagnóstico inicial e descubra pontos de atenção.',
  },
];

export function SeoLanding({
  h1,
  lead,
  sections,
  ctaHref = '/preview/teste',
  ctaLabel,
  breadcrumbHref,
  contextLinks = DEFAULT_CONTEXT_LINKS,
}: {
  h1: string;
  lead: string;
  sections: Section[];
  ctaHref?: string;
  ctaLabel?: string;
  breadcrumbHref?: string;
  contextLinks?: ContextLink[];
}) {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <SeoPageHeader />

      {breadcrumbHref && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                name: h1,
                description: lead,
                url: `https://filtraai.com${breadcrumbHref}`,
                isPartOf: {
                  '@type': 'WebSite',
                  name: 'Filtra.AI',
                  url: 'https://filtraai.com/',
                },
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: UI.home,
                  item: 'https://filtraai.com/',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: h1,
                  item: `https://filtraai.com${breadcrumbHref}`,
                },
                ],
              }),
            }}
          />
        </>
      )}

      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-16">
        <nav aria-label="Breadcrumb" className="pt-2 text-xs text-zinc-500">
          <Link href="/">{UI.home}</Link>
          <span className="mx-2">/</span>
          <span>{h1}</span>
        </nav>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">{h1}</h1>
          <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">{lead}</p>
        </div>

        {sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-100">{section.heading}</h2>
            <p className="text-sm leading-relaxed text-zinc-300">{section.body}</p>
          </section>
        ))}

        <section className="border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold">{UI.deep}</h2>
          <p className="mt-2 text-sm text-zinc-400">{UI.deepBody}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {contextLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700"
              >
                <span className="font-medium">{link.title}</span>
                <span className="mt-1 block text-xs text-zinc-500">{link.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="pt-4">
          <Link
            href={ctaHref}
            className="inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white"
          >
            {ctaLabel || UI.cta}
          </Link>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
          {DEFAULT_CONTEXT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-zinc-300">
              {link.title}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
