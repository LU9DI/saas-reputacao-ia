import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '../../components/BrandMark';

const canonical = 'https://filtraai.com/blog/gestao-reputacao-online-guia';
const logo = 'https://filtraai.com/icons/icon-512.png';

export const metadata: Metadata = {
  title: 'Gestão de reputação online: guia completo para empresas | Filtra.AI',
  description:
    'Gestão de reputação online: como monitorar avaliações, responder clientes, analisar feedback e transformar a reputação da empresa em crescimento.',
  alternates: { canonical },
  openGraph: {
    title: 'Gestão de reputação online: guia completo para empresas',
    description:
      'Como gerir a reputação da empresa com avaliações, feedback, respostas e indicadores de melhoria.',
    url: canonical,
    type: 'article',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Gestão de reputação online: guia completo para empresas',
  description:
    'Como gerir a reputação da empresa com avaliações, feedback, respostas e indicadores de melhoria.',
  mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  datePublished: '2026-09-30',
  dateModified: '2026-10-05',
  author: {
    '@type': 'Organization',
    name: 'Filtra.AI',
    url: 'https://filtraai.com',
    logo: { '@type': 'ImageObject', url: logo },
  },
  image: logo,
  publisher: {
    '@type': 'Organization',
    name: 'Filtra.AI',
    url: 'https://filtraai.com',
    logo: { '@type': 'ImageObject', url: logo },
  },
};

export default function BlogReputacaoOnlinePage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
        <BrandMark size="md" subtitle="Blog" href="/" />
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">Trial 7 dias</Link>
      </header>
      <article className="max-w-3xl mx-auto px-4 pb-16 space-y-6 text-sm text-zinc-300 leading-relaxed">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Guia · Reputação online</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">Gestão de reputação online: guia completo para empresas</h1>
          <p className="text-zinc-400">Gerir a reputação de uma empresa é acompanhar o que clientes dizem, entender padrões, responder publicamente e transformar sinais recorrentes em melhorias reais.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">O que é gestão de reputação online?</h2>
          <p>Gestão de reputação online é o processo contínuo de monitorar avaliações, feedbacks e menções públicas, identificar riscos e oportunidades e transformar esses sinais em ações. Não é apenas responder a comentários: é entender por que a percepção do cliente muda e acompanhar se a operação melhora.</p>
          <p>Para empresas que dependem de descoberta no Google, reputação, avaliações e experiência do cliente fazem parte da mesma jornada de aquisição. Por isso, a gestão deve conectar feedback, atendimento, presença pública e indicadores.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">1. Comece pelo que o cliente já está dizendo</h2>
          <p>Reúna avaliações públicas, comentários e feedbacks recebidos pelos canais da empresa. Procure temas recorrentes: atendimento, prazo, preço, espera, produto, ambiente e pós-venda.</p>
          <p>A meta inicial não é esconder críticas. É identificar o que aparece repetidamente e separar um caso isolado de um problema operacional que merece ação.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">2. Transforme avaliações em indicadores</h2>
          <p>Acompanhe volume de avaliações, nota média, recência, distribuição por tema e quantidade de respostas. Para redes e franquias, compare também unidades e períodos.</p>
          <p>Na prática, uma boa gestão de reputação online conecta presença digital, reputação e conversão, em vez de tratar avaliações como um número isolado.</p>
          <p>Veja também o guia de <Link href="/avaliacoes-google" className="text-indigo-400 underline">gestão de avaliações Google</Link> e entenda como organizar esse fluxo.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">3. Responda sem transformar a crítica em disputa</h2>
          <p>Respostas públicas devem ser curtas, profissionais e específicas. Reconheça o ponto relatado e leve detalhes sensíveis para um canal privado.</p>
          <p>O objetivo é atender o cliente e mostrar para quem está pesquisando que a empresa acompanha o que acontece depois da venda.</p>
          <p>Se o volume de comentários for alto, a <Link href="/analise-de-avaliacoes-com-ia" className="text-indigo-400 underline">análise de avaliações com IA</Link> ajuda a encontrar padrões sem depender de leitura manual de cada comentário.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">4. Crie um fluxo contínuo de feedback</h2>
          <p>Depois de cada atendimento, facilite o envio de feedback com um link ou QR Code e registre os sinais recebidos.</p>
          <p>O pedido deve buscar opinião autêntica, sem comprar avaliações, oferecer vantagem em troca de estrelas ou pressionar clientes a publicar uma nota específica.</p>
          <p>O objetivo é transformar a <Link href="/feedback-de-clientes" className="text-indigo-400 underline">voz do cliente</Link> em uma rotina de gestão.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">5. Feche o ciclo: feedback → ação → acompanhamento</h2>
          <p>Use o feedback para mudar a operação. Se clientes relatam espera, acompanhe o tempo de atendimento. Se reclamam de comunicação, revise mensagens e treinamento. Depois, observe se o tema diminui nas avaliações seguintes.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">6. Reputação também é SEO local</h2>
          <p>Para negócios locais, avaliações fazem parte do conjunto de sinais que o consumidor encontra antes de visitar ou comprar. Site, presença local e reputação devem trabalhar juntos.</p>
          <p>Leia o guia sobre <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">SEO local e avaliações no Local Pack</Link> para conectar reputação à estratégia de busca local.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">7. Para negócios com várias unidades</h2>
          <p>Centralize indicadores por unidade, mas preserve o contexto local. Uma média geral pode esconder uma clínica, loja, restaurante ou franquia com um problema específico.</p>
          <p>Veja também <Link href="/franquias" className="text-indigo-400 underline">franquias</Link>, <Link href="/hoteis" className="text-indigo-400 underline">hotéis</Link>, <Link href="/restaurantes" className="text-indigo-400 underline">restaurantes</Link> e <Link href="/clinicas" className="text-indigo-400 underline">clínicas</Link>.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">Checklist para gerir a reputação da empresa</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Monitorar avaliações e feedback</li>
            <li>Classificar temas recorrentes</li>
            <li>Responder avaliações públicas</li>
            <li>Registrar problemas e responsáveis</li>
            <li>Medir evolução dos temas críticos</li>
            <li>Comparar unidades quando houver operação multiunidade</li>
            <li>Conectar reputação a aquisição e SEO local</li>
          </ul>
        </section>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <p className="text-zinc-100 font-medium">Teste a gestão de reputação por 7 dias</p>
          <p>O Filtra.AI reúne feedback, avaliações e análise com IA para ajudar sua equipe a identificar padrões e transformar sinais de clientes em ações.</p>
          <Link href="/auditoria-gratuita" className="inline-flex rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 text-sm">Fazer auditoria gratuita</Link>
        </div>

        <nav className="flex flex-wrap gap-3 text-xs text-zinc-500 pt-4 border-t border-zinc-800">
          <Link href="/gestao-de-reputacao-online">Gestão de reputação</Link>
          <Link href="/avaliacoes-google">Avaliações Google</Link>
          <Link href="/analise-de-avaliacoes-com-ia">Análise com IA</Link>
          <Link href="/feedback-de-clientes">Feedback de clientes</Link>
          <Link href="/auditoria-gratuita">Auditoria gratuita</Link>
          <Link href="/blog/seo-local-avaliacoes-local-pack">SEO local</Link>
        </nav>
      </article>
    </div>
  </>;
}
