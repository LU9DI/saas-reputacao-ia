import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageHeader } from '../components/SeoPageHeader';
import { OG_IMAGE_META } from '../lib/socialMetadata';
import content from './content.json';

type PageContent = {
  slug: string;
  canonical: string;
  metaTitle: string;
  description: string;
  datePublished: string;
  dateModified: string;
  eyebrow: string;
  h1: string;
  lead: string;
  status: { heading: string; body: string };
  sections: Array<{
    id: string;
    heading: string;
    paragraphs: string[];
    bullets: string[];
    ordered: boolean;
    links: Array<{ label: string; href: string }>;
  }>;
  glossary: {
    heading: string;
    intro: string;
    terms: Array<{ term: string; definition: string }>;
  };
  faq: Array<{ question: string; answer: string }>;
  cta: { heading: string; body: string; label: string; href: string };
  related: Array<{ label: string; href: string }>;
};

const data = content as unknown as PageContent;
const canonical = data.canonical;

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.description,
  alternates: {
    canonical,
    types: {
      'text/markdown': `${canonical}.md`,
    },
  },
  openGraph: {
    type: 'website',
    url: canonical,
    title: `${data.metaTitle} | Filtra.AI`,
    description: data.description,
    siteName: 'Filtra.AI',
    locale: 'pt_BR',
    images: [OG_IMAGE_META],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${data.metaTitle} | Filtra.AI`,
    description: data.description,
    images: [OG_IMAGE_META.url],
  },
  robots: { index: true, follow: true },
};

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${canonical}#webpage`,
  url: canonical,
  name: data.h1,
  description: data.description,
  inLanguage: 'pt-BR',
  datePublished: data.datePublished,
  dateModified: data.dateModified,
  isPartOf: { '@id': 'https://filtraai.com/#website' },
  about: { '@type': 'Thing', name: 'Auditoria de avaliações e reputação online' },
  publisher: { '@id': 'https://filtraai.com/#organization' },
  breadcrumb: { '@id': `${canonical}#breadcrumb` },
  mainEntity: { '@id': `${canonical}#faq` },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${canonical}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://filtraai.com/' },
    { '@type': 'ListItem', position: 2, name: 'Auditoria gratuita', item: 'https://filtraai.com/auditoria-gratuita' },
    { '@type': 'ListItem', position: 3, name: 'Metodologia', item: canonical },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${canonical}#faq`,
  mainEntity: data.faq.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

const updatedLabel = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${data.dateModified}T00:00:00Z`));

export default function MetodologiaAuditoriaPage() {
  return (
    <>
      <SeoPageHeader showLanguageSwitcher={false} />
      <main className="min-h-screen bg-black text-zinc-100">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
            <Link href="/" className="hover:text-indigo-300">Início</Link>
            <span aria-hidden="true"> / </span>
            <Link href="/auditoria-gratuita" className="hover:text-indigo-300">Auditoria gratuita</Link>
            <span aria-hidden="true"> / </span>
            <span className="text-zinc-300">Metodologia</span>
          </nav>

          <header className="mt-8 max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-400">{data.eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">{data.h1}</h1>
            <p className="text-lg leading-8 text-zinc-300">{data.lead}</p>
            <p className="text-xs leading-6 text-zinc-500">
              Atualizado em <time dateTime={data.dateModified}>{updatedLabel}</time>. Esta página descreve o método; não é uma promessa de resultado.
            </p>
          </header>

          <section className="mt-8 rounded-2xl border border-indigo-900 bg-indigo-950/30 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">{data.status.heading}</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-300">{data.status.body}</p>
          </section>

          <article className="mt-10 space-y-10">
            {data.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                <h2 className="text-2xl font-semibold text-white">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-7 text-zinc-300">{paragraph}</p>
                ))}
                {section.bullets.length > 0 && (
                  section.ordered ? (
                    <ol className="list-decimal space-y-2 pl-5 leading-7 text-zinc-300 marker:text-indigo-400">
                      {section.bullets.map((item) => <li key={item}>{item}</li>)}
                    </ol>
                  ) : (
                    <ul className="list-disc space-y-2 pl-5 leading-7 text-zinc-300 marker:text-indigo-400">
                      {section.bullets.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )
                )}
                {section.links.map((link) => (
                  <p key={link.href}>
                    <Link href={link.href} className="text-sm font-medium text-indigo-300 underline underline-offset-4 hover:text-indigo-200">
                      {link.label}
                    </Link>
                  </p>
                ))}
              </section>
            ))}
          </article>

          <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-2xl font-semibold text-white">{data.glossary.heading}</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{data.glossary.intro}</p>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {data.glossary.terms.map((term) => (
                <div key={term.term} className="border-l border-zinc-800 pl-4">
                  <dt className="font-medium text-zinc-100">{term.term}</dt>
                  <dd className="mt-1 text-sm leading-6 text-zinc-400">{term.definition}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-12 space-y-5">
            <h2 className="text-2xl font-semibold text-white">Perguntas frequentes</h2>
            {data.faq.map((item) => (
              <div key={item.question} className="space-y-2 border-b border-zinc-800 pb-5">
                <h3 className="text-lg font-semibold text-zinc-100">{item.question}</h3>
                <p className="leading-7 text-zinc-300">{item.answer}</p>
              </div>
            ))}
          </section>

          <aside className="mt-12 rounded-2xl border border-indigo-900 bg-indigo-950/30 p-6">
            <h2 className="text-2xl font-semibold text-white">{data.cta.heading}</h2>
            <p className="mt-2 leading-7 text-zinc-300">{data.cta.body}</p>
            <Link href={data.cta.href} className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-500">
              {data.cta.label}
            </Link>
          </aside>

          <nav aria-label="Continue explorando" className="mt-12 border-t border-zinc-800 pt-8">
            <h2 className="text-xl font-semibold text-white">Continue explorando</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.related.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm font-medium text-zinc-200 transition hover:border-zinc-700">
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <p className="mt-8 text-xs leading-6 text-zinc-500">
            Versão em Markdown para agentes e leitores técnicos:{' '}
            <a href="/metodologia-auditoria.md" className="text-indigo-300 underline underline-offset-4 hover:text-indigo-200">/metodologia-auditoria.md</a>.
            A versão HTML é a canônica.
          </p>
        </div>
      </main>
    </>
  );
}
