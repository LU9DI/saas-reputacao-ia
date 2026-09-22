import Link from 'next/link';

type Props = {
  eyebrow: string; title: string; intro: string; keywords: string[];
  sections: { title: string; body: string }[];
  faqs: { question: string; answer: string }[];
};

export function SeoLandingPage({ eyebrow, title, intro, keywords, sections, faqs }: Props) {
  const softwareLd = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Filtra.AI', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: 'https://filtraai.com', description: intro };
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) };
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-14">
          <Link href="/" className="text-sm font-semibold tracking-wide text-indigo-400">FILTRA.AI</Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">{intro}</p>
          <div className="mt-8 flex flex-wrap gap-2">{keywords.map((k) => <span key={k} className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">{k}</span>)}</div>
          <Link href="/" className="mt-9 inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Start your 7-day free trial</Link>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((s) => <section key={s.title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-7"><h2 className="text-xl font-semibold">{s.title}</h2><p className="mt-3 leading-7 text-zinc-400">{s.body}</p></section>)}
        </div>
        <section className="mt-14 rounded-2xl border border-zinc-800 bg-zinc-950 p-7">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <div className="mt-6 space-y-7">{faqs.map((f) => <div key={f.question}><h3 className="font-semibold">{f.question}</h3><p className="mt-2 leading-7 text-zinc-400">{f.answer}</p></div>)}</div>
        </section>
        <footer className="mt-14 border-t border-zinc-900 pt-8 text-sm text-zinc-500"><Link href="/">Filtra.AI</Link><span className="mx-2">·</span><Link href="/planos">Plans</Link><span className="mx-2">·</span><Link href="/termos">Terms</Link><span className="mx-2">·</span><Link href="/privacidade">Privacy</Link></footer>
      </div>
    </main>
  );
}
