import Link from 'next/link';

type ResearchSection = {
  title: string;
  body: string;
  bullets?: string[];
};

type ResearchPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: ResearchSection[];
};

export default function ResearchPlaceholder({
  eyebrow,
  title,
  description,
  sections,
}: ResearchPlaceholderProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-14 text-zinc-100 sm:px-8 sm:py-20">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-400">
        <Link href="/" className="transition hover:text-white">Início</Link>
        <span className="mx-2">/</span>
        <Link href="/indice-reputacao-filtra" className="transition hover:text-white">
          Índice de Reputação Filtra
        </Link>
        <span className="mx-2">/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <header className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
          {eyebrow}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-300">{description}</p>
      </header>

      <section
        aria-labelledby="status-title"
        className="mt-10 rounded-2xl border border-amber-300/25 bg-amber-300/5 p-6 sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">
          Estado da pesquisa
        </p>
        <h2 id="status-title" className="mt-2 text-2xl font-semibold">
          Dados ainda em validação
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
          Esta página define o escopo da análise, mas ainda não apresenta resultados de mercado.
          A base disponível não sustenta comparações públicas confiáveis neste recorte. Não
          exibiremos médias, rankings ou gráficos sem amostra verificável, origem documentada e
          revisão de privacidade.
        </p>
      </section>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {sections.map((section, index) => (
          <section key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-medium text-indigo-300">0{index + 1}</p>
            <h2 className="mt-3 text-xl font-semibold">{section.title}</h2>
            <p className="mt-3 leading-7 text-zinc-300">{section.body}</p>
            {section.bullets && (
              <ul className="mt-4 list-disc space-y-2 pl-5 leading-6 text-zinc-400">
                {section.bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>

      <section className="mt-12 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold">Critério de publicação</h2>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
          Antes de liberar qualquer resultado, a equipe documentará a data de corte, a amostra,
          as exclusões, a metodologia de cálculo, os vieses conhecidos e a autorização para uso
          das fontes. O conteúdo continuará fora do índice de busca até essa revisão ser aprovada.
        </p>
        <Link
          href="/indice-reputacao-filtra"
          className="mt-6 inline-flex rounded-xl border border-white/15 px-5 py-3 font-medium transition hover:border-indigo-300/60 hover:bg-white/5"
        >
          Voltar à metodologia do índice
        </Link>
      </section>
    </main>
  );
}
