import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filtra.AI para ChatGPT, Claude e Grok | Reputação com IA',
  description:
    'Use o Filtra.AI com agentes de IA compatíveis para analisar avaliações, identificar padrões de reputação e gerar respostas profissionais.',
  alternates: { canonical: 'https://filtraai.com/ia' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/ia',
    title: 'Filtra.AI para ChatGPT, Claude e Grok',
    description:
      'Leve a inteligência de reputação do Filtra.AI para os principais agentes de IA compatíveis com MCP.',
  },
};

const platforms = [
  {
    name: 'ChatGPT',
    status: 'App MCP em preparação para publicação',
    description:
      'O Filtra.AI pode ser conectado ao ChatGPT como app baseado em MCP. A versão de desenvolvimento já está configurada para testes.',
  },
  {
    name: 'Claude',
    status: 'Conector MCP remoto',
    description:
      'O endpoint remoto do Filtra.AI pode ser usado como custom connector compatível com MCP.',
  },
  {
    name: 'Grok',
    status: 'Custom MCP connector',
    description:
      'O Grok oferece conectores MCP personalizados para servidores remotos. O Filtra.AI usa um endpoint HTTPS público compatível.',
  },
];

const tools = [
  'Auditar avaliações e reputação',
  'Identificar pontos fortes e riscos',
  'Encontrar temas recorrentes',
  'Gerar respostas profissionais para avaliações',
  'Conhecer o Filtra.AI e iniciar o teste gratuito',
];

export default function IAPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Filtra.AI + IA
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Leve a reputação da sua empresa para dentro das IAs
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            O Filtra.AI disponibiliza ferramentas de inteligência de reputação
            por MCP para que agentes de IA possam analisar avaliações fornecidas
            pelo usuário e transformar a voz do cliente em ações práticas.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {platforms.map((platform) => (
            <article
              key={platform.name}
              className="rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{platform.name}</h2>
              <p className="mt-2 text-sm font-medium text-indigo-600">
                {platform.status}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {platform.description}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-14 rounded-3xl bg-slate-50 p-8">
          <h2 className="text-2xl font-semibold">
            O que o Filtra.AI pode fazer dentro de um agente
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {tools.map((tool) => (
              <li key={tool} className="flex gap-3 text-slate-700">
                <span aria-hidden="true" className="font-bold text-indigo-600">
                  ✓
                </span>
                <span>{tool}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold">Um único MCP</h2>
          <p className="mt-4 text-slate-600">
            O mesmo núcleo do Filtra.AI atende clientes MCP compatíveis, sem
            duplicar a lógica de análise.
          </p>
          <div className="mt-6 rounded-2xl bg-slate-950 p-6 font-mono text-sm text-slate-100">
            https://api.filtraai.com/mcp
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-indigo-100 bg-indigo-50 p-8">
          <h2 className="text-2xl font-semibold">
            Quer testar o Filtra.AI?
          </h2>
          <p className="mt-3 text-slate-700">
            Comece pelo teste gratuito de 7 dias, sem cartão.
          </p>
          <a
            href="/preview/teste"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Começar teste gratuito
          </a>
        </section>
      </section>
    </main>
  );
}
