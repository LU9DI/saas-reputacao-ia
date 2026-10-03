import type { Metadata } from 'next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const metadata: Metadata = {
  title: 'Filtra.AI para ChatGPT, Claude e Grok | IA',
  description:
    'Use o Filtra.AI com ChatGPT, Claude, Grok e outros clientes MCP para analisar avaliações, entender a reputação e transformar feedback em ações.',
  alternates: { canonical: 'https://filtraai.com/ia' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/ia',
    title: 'Filtra.AI para ChatGPT, Claude e Grok',
    description:
      'Leve a inteligência de reputação do Filtra.AI para agentes de IA compatíveis com MCP.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'Filtra.AI — Gestão de avaliações Google' }],
  },
};

const platforms = [
  {
    name: 'ChatGPT',
    status: 'App MCP em desenvolvimento',
    description:
      'Conecte o Filtra.AI ao ChatGPT para testar fluxos de análise de avaliações e reputação usando o mesmo MCP do produto.',
  },
  {
    name: 'Claude',
    status: 'Conector MCP remoto',
    description:
      'Use o endpoint remoto do Filtra.AI como custom connector compatível com MCP e leve as ferramentas de reputação para suas conversas.',
  },
  {
    name: 'Grok',
    status: 'MCP remoto + marketplace em andamento',
    description:
      'O Filtra.AI oferece um servidor MCP remoto compatível com conectores do Grok e mantém sua distribuição pública em preparação.',
  },
];

const tools = [
  'Auditar avaliações e reputação',
  'Identificar pontos fortes e riscos',
  'Encontrar temas recorrentes no feedback',
  'Gerar respostas profissionais para avaliações',
  'Conhecer o produto e iniciar o teste gratuito',
];

const faqs = [
  {
    question: 'O Filtra.AI funciona com ChatGPT, Claude e Grok?',
    answer:
      'O Filtra.AI disponibiliza um servidor MCP remoto para clientes compatíveis. A página apresenta os caminhos de conexão e o estado atual de cada integração.',
  },
  {
    question: 'É preciso criar um backend diferente para cada IA?',
    answer:
      'Não. O mesmo endpoint MCP do Filtra.AI concentra as ferramentas de reputação, evitando duplicar a lógica de análise para cada cliente.',
  },
  {
    question: 'Quais dados são analisados?',
    answer:
      'A auditoria de reputação usa as avaliações fornecidas pelo usuário. O Filtra.AI não deve inventar avaliações, clientes, notas ou fatos externos.',
  },
  {
    question: 'Posso testar o Filtra.AI sem cartão?',
    answer:
      'Sim. O teste gratuito informado pelo Filtra.AI é de 7 dias e não exige cartão.',
  },
];

export default function IAPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100">\n      <nav className="mx-auto flex max-w-5xl justify-end px-6 pt-6">\n        <LanguageSwitcher />\n      </nav>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Filtra.AI + IA
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Leve a reputação da sua empresa para dentro das IAs
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Use o Filtra.AI com ChatGPT, Claude, Grok e outros clientes
            compatíveis com MCP para analisar avaliações fornecidas pelo
            usuário, encontrar padrões e transformar a voz do cliente em ações
            práticas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/preview/teste"
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Começar teste gratuito
            </a>
            <a
              href="/auditoria-gratuita"
              className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-zinc-900"
            >
              Fazer auditoria gratuita
            </a>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {platforms.map((platform) => (
            <article
              key={platform.name}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{platform.name}</h2>
              <p className="mt-2 text-sm font-medium text-indigo-400">
                {platform.status}
              </p>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                {platform.description}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-14 rounded-3xl bg-zinc-950 p-8">
          <h2 className="text-2xl font-semibold">
            O que o Filtra.AI pode fazer dentro de um agente
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {tools.map((tool) => (
              <li key={tool} className="flex gap-3 text-zinc-300">
                <span aria-hidden="true" className="font-bold text-indigo-400">
                  ✓
                </span>
                <span>{tool}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold">Um único MCP</h2>
          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
            O mesmo núcleo do Filtra.AI atende clientes MCP compatíveis, sem
            duplicar a lógica de análise. Isso permite ampliar a distribuição
            sem criar um backend diferente para cada plataforma.
          </p>
          <div className="mt-6 rounded-2xl bg-zinc-950 p-6 font-mono text-sm text-zinc-100">
            https://api.filtraai.com/mcp
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold">Reputação conectada ao crescimento</h2>
          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
            Avaliações ajudam empresas a entender o que clientes valorizam,
            onde existem problemas recorrentes e quais pontos merecem ação.
            O Filtra.AI conecta esse trabalho à gestão de reputação e ao
            acompanhamento das avaliações públicas.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a className="rounded-xl border border-zinc-800 p-4 font-medium text-zinc-200 hover:bg-zinc-900" href="/avaliacoes-google">
              Gestão de avaliações Google
            </a>
            <a className="rounded-xl border border-zinc-800 p-4 font-medium text-zinc-200 hover:bg-zinc-900" href="/gestao-de-reputacao-online">
              Gestão de reputação online
            </a>
            <a className="rounded-xl border border-zinc-800 p-4 font-medium text-zinc-200 hover:bg-zinc-900" href="/analise-de-avaliacoes-com-ia">
              Análise de avaliações com IA
            </a>
            <a className="rounded-xl border border-zinc-800 p-4 font-medium text-zinc-200 hover:bg-zinc-900" href="/feedback-de-clientes">
              Feedback de clientes
            </a>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-zinc-800 p-6">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 leading-7 text-zinc-400">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-indigo-500/20 bg-zinc-950 p-8">
          <h2 className="text-2xl font-semibold">Quer testar o Filtra.AI?</h2>
          <p className="mt-3 text-zinc-300">
            Comece pelo teste gratuito de 7 dias, sem cartão.
          </p>
          <a
            href="/preview/teste"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Começar teste gratuito
          </a>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      </section>
    </main>
  );
}
