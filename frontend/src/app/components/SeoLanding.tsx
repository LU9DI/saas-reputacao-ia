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

const CONTEXT_LINKS_BY_PATH: Record<string, ContextLink[]> = {
  '/filtra-ai': [
    { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Acompanhe avaliações, feedback e evolução da reputação.' },
    { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Transforme avaliações em uma rotina de gestão.' },
    { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Encontre padrões e temas recorrentes com IA.' },
    { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Organize a voz do cliente antes que os sinais se percam.' },
    { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação online', description: 'Acompanhe mudanças e sinais relevantes ao longo do tempo.' },
    { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Faça um diagnóstico inicial da reputação.' },
  ],
  '/gestao-de-reputacao-online': [
    { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação online', description: 'Detecte mudanças, padrões e sinais que pedem atenção.' },
    { href: '/reputacao-google', title: 'Reputação no Google', description: 'Conecte avaliações públicas à gestão da reputação.' },
    { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Estruture o acompanhamento das avaliações.' },
    { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Transforme comentários em temas e prioridades.' },
    { href: '/gestao-de-feedback', title: 'Gestão de feedback', description: 'Leve sinais da experiência até a equipe responsável.' },
    { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Identifique pontos de atenção e oportunidades.' },
  ],
  '/avaliacoes-google': [
    { href: '/como-melhorar-avaliacoes-google', title: 'Como melhorar avaliações Google', description: 'Crie uma rotina sustentável para aumentar a qualidade das avaliações.' },
    { href: '/reputacao-google', title: 'Reputação no Google', description: 'Entenda os sinais por trás da percepção pública.' },
    { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Conecte avaliações a monitoramento e melhoria contínua.' },
    { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Encontre padrões em grandes volumes de comentários.' },
    { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Transforme opiniões em informação acionável.' },
    { href: '/blog/como-conseguir-avaliacoes-google', title: 'Como conseguir avaliações Google', description: 'Aprenda práticas para facilitar avaliações genuínas.' },
  ],
  '/reputacao-google': [
    { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Organize a gestão das avaliações e seus sinais.' },
    { href: '/como-melhorar-avaliacoes-google', title: 'Como melhorar avaliações Google', description: 'Conecte experiência, feedback e evolução da percepção.' },
    { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação online', description: 'Acompanhe mudanças e recorrências.' },
    { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture a operação contínua de reputação.' },
    { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Entenda a experiência antes e depois da avaliação pública.' },
    { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Encontre oportunidades na presença e reputação.' },
  ],
  '/analise-de-avaliacoes-com-ia': [
    { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Aplique análise aos sinais que chegam pelas avaliações.' },
    { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Una avaliações públicas e feedback estruturado.' },
    { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Converta padrões em decisões de reputação.' },
    { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação online', description: 'Observe tendências e mudanças nos temas.' },
    { href: '/reputacao-google', title: 'Reputação no Google', description: 'Relacione temas de avaliações com percepção pública.' },
    { href: '/ia', title: 'IA para reputação', description: 'Veja como a inteligência artificial entra no fluxo.' },
  ],
  '/feedback-de-clientes': [
    { href: '/gestao-de-feedback', title: 'Gestão de feedback', description: 'Estruture coleta, triagem, responsáveis e acompanhamento.' },
    { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Encontre padrões em comentários e avaliações.' },
    { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Conecte feedback à reputação pública.' },
    { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Transforme sinais da experiência em gestão contínua.' },
    { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação online', description: 'Acompanhe tendências e problemas recorrentes.' },
    { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece com um diagnóstico da reputação.' },
  ],
  '/gestao-de-feedback': [
    { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Entenda como estruturar a voz do cliente.' },
    { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Priorize temas recorrentes com IA.' },
    { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Conecte feedback à reputação e à operação.' },
    { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Relacione feedback e avaliações públicas.' },
    { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação online', description: 'Acompanhe se os problemas persistem.' },
    { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Identifique os principais pontos de atenção.' },
  ],
  '/como-melhorar-avaliacoes-google': [
    { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Estruture a rotina de avaliações da empresa.' },
    { href: '/reputacao-google', title: 'Reputação no Google', description: 'Entenda como a percepção pública evolui.' },
    { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Use feedback para descobrir pontos de atrito.' },
    { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Conecte experiência, avaliação e gestão.' },
    { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique temas recorrentes com IA.' },
    { href: '/blog/como-conseguir-avaliacoes-google', title: 'Guia de avaliações Google', description: 'Aprofunde as práticas para gerar avaliações genuínas.' },
  ],
  '/monitoramento-reputacao-online': [
    { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Transforme monitoramento em processo de gestão.' },
    { href: '/reputacao-google', title: 'Reputação no Google', description: 'Acompanhe a percepção pública da marca.' },
    { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Monitore volume, temas e evolução das avaliações.' },
    { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Acelere a descoberta de padrões.' },
    { href: '/gestao-de-feedback', title: 'Gestão de feedback', description: 'Conecte sinais públicos e privados.' },
    { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece identificando os sinais mais importantes.' },
  ],
  '/auditoria-gratuita': [
    { href: '/filtra-ai', title: 'Filtra.AI', description: 'Conheça a plataforma e o fluxo completo.' },
    { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Veja como organizar a gestão das avaliações.' },
    { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Entenda o processo contínuo de reputação.' },
    { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Aprofunde o diagnóstico dos comentários.' },
    { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Entenda os sinais que não aparecem só na nota.' },
    { href: '/como-melhorar-avaliacoes-google', title: 'Como melhorar avaliações Google', description: 'Transforme diagnóstico em melhoria contínua.' },
  ],
};

const DEFAULT_CONTEXT_LINKS: ContextLink[] = [
  { href: '/filtra-ai', title: 'Filtra.AI — gestão de reputação', description: 'Conheça a plataforma de gestão de reputação, avaliações Google e feedback com IA.' },
  { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Entenda como transformar avaliações Google e feedback em uma rotina de gestão.' },
  { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Transforme opiniões em informação útil para o negócio.' },
  { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e temas recorrentes nas avaliações.' },
  { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Organize monitoramento, respostas e evolução da reputação.' },
  { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Faça um diagnóstico inicial e descubra pontos de atenção.' },
  { href: '/blog/seo-local-avaliacoes-local-pack', title: 'SEO local e avaliações', description: 'Entenda como presença local, avaliações e reputação trabalham juntas.' },
];

export function SeoLanding({
  h1,
  lead,
  sections,
  ctaHref = '/preview/teste',
  ctaLabel,
  breadcrumbHref,
  contextLinks,
  mcpEndpoint,
}: {
  h1: string;
  lead: string;
  sections: Section[];
  ctaHref?: string;
  ctaLabel?: string;
  breadcrumbHref?: string;
  contextLinks?: ContextLink[];
  mcpEndpoint?: string;
}) {
  const resolvedContextLinks = contextLinks || (breadcrumbHref ? CONTEXT_LINKS_BY_PATH[breadcrumbHref] : undefined) || DEFAULT_CONTEXT_LINKS;
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
                  { '@type': 'ListItem', position: 1, name: UI.home, item: 'https://filtraai.com/' },
                  { '@type': 'ListItem', position: 2, name: h1, item: `https://filtraai.com${breadcrumbHref}` },
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

        {mcpEndpoint && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Endpoint MCP</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Use este endereço no cliente compatível com MCP. Você pode selecionar e copiar o endereço abaixo.
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800 bg-black px-4 py-3">
              <code className="whitespace-nowrap text-sm text-zinc-100">{mcpEndpoint}</code>
            </div>
          </section>
        )}

        <section className="border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold">{UI.deep}</h2>
          <p className="mt-2 text-sm text-zinc-400">{UI.deepBody}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {resolvedContextLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700">
                <span className="font-medium">{link.title}</span>
                <span className="mt-1 block text-xs text-zinc-500">{link.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="pt-4">
          <Link href={ctaHref} className="inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white">
            {ctaLabel || UI.cta}
          </Link>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
          {resolvedContextLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-zinc-300">{link.title}</Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
