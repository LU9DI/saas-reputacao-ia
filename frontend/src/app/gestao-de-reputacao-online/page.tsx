import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageHeader } from '../components/SeoPageHeader';

export const metadata: Metadata = {
  title: 'Gestão de reputação online para empresas',
  description: 'Monitore avaliações, responda sinais importantes e transforme a reputação online em uma rotina de gestão e melhoria contínua.',
  alternates: { canonical: 'https://filtraai.com/gestao-de-reputacao-online' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/gestao-de-reputacao-online',
    title: 'Gestão de reputação online para empresas | Filtra.AI',
    description: 'Monitore avaliações, responda sinais importantes e transforme a reputação online em uma rotina de gestão e melhoria contínua.',
  },
};

export default function Page() {
  return (
    <>
      <SeoPageHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://filtraai.com/' },
          { '@type': 'ListItem', position: 2, name: 'Gestão de reputação online', item: 'https://filtraai.com/gestao-de-reputacao-online' },
        ],
      }) }} />
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Filtra.AI · Reputação online</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">Sua reputação online é uma fonte de crescimento.</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">Cada avaliação pública influencia a percepção de futuros clientes e também revela informações sobre a experiência de quem já comprou. A Filtra.AI transforma esse fluxo de avaliações em inteligência para gestão.</p>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/auditoria-gratuita" className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold">Teste a Filtra.AI</Link><Link href="/ia" className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold">Filtra.AI para IA</Link></div>

      <section className="mt-16 space-y-10">
        <div><h2 className="text-3xl font-bold">O que acompanhar na reputação online</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Não basta olhar a nota média. A gestão precisa acompanhar volume de avaliações, recorrência de temas, mudanças na percepção e diferenças entre unidades, serviços ou períodos. Esses sinais ajudam a separar um problema pontual de uma tendência operacional.</p><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Também vale observar a velocidade com que novas avaliações chegam, a distribuição das notas e os temas associados a cada faixa. Uma mudança pequena na média pode esconder uma mudança grande na natureza das reclamações.</p></div>
        <div><h2 className="text-3xl font-bold">Da avaliação para a ação</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Uma avaliação negativa pode indicar atrito no atendimento, prazo, comunicação ou entrega. Avaliações positivas também mostram o que merece ser preservado. Ao organizar esses padrões, a equipe consegue transformar comentários dispersos em prioridades concretas.</p><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Uma rotina simples é classificar o sinal, investigar a causa, definir uma ação e acompanhar novas avaliações. O objetivo não é apagar críticas, mas entender o que elas revelam e reduzir problemas repetidos enquanto os pontos fortes continuam sendo reforçados.</p></div>
        <div><h2 className="text-3xl font-bold">Reputação em empresas com várias unidades</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Redes de hotéis, restaurantes, clínicas, franquias e outras operações distribuídas precisam enxergar tanto a reputação da marca quanto as diferenças locais. Comparar unidades por temas e períodos ajuda a encontrar boas práticas e pontos de atenção sem tratar todos os locais como se fossem iguais.</p></div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3"><article className="rounded-2xl border border-zinc-800 p-6"><h2 className="text-xl font-semibold">Reputação</h2><p className="mt-3 text-zinc-400">Entenda os temas que estão moldando a percepção da sua empresa.</p></article><article className="rounded-2xl border border-zinc-800 p-6"><h2 className="text-xl font-semibold">Experiência</h2><p className="mt-3 text-zinc-400">Identifique pontos de atrito e oportunidades recorrentes.</p></article><article className="rounded-2xl border border-zinc-800 p-6"><h2 className="text-xl font-semibold">Crescimento</h2><p className="mt-3 text-zinc-400">Converta a voz do consumidor em prioridades para melhorar o negócio.</p></article></section>

      <section className="mt-16 space-y-8">
        <div><h2 className="text-3xl font-bold">Como responder avaliações negativas</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Uma resposta útil deve considerar o contexto do cliente, reconhecer o problema quando ele existir e indicar um caminho de resolução sem expor dados pessoais. Responder não elimina o problema original, mas mostra que a empresa acompanha sua experiência e cria uma oportunidade de levar a conversa para um canal adequado. <Link href="/blog/como-responder-avaliacoes-negativas" className="underline">Veja o guia completo para responder avaliações negativas</Link>.</p></div>
        <div><h2 className="text-3xl font-bold">Como medir a gestão de reputação</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Acompanhe evolução da nota, volume de avaliações, distribuição por estrelas, temas recorrentes, tempo de resposta e diferenças entre unidades. Combine esses indicadores com ações realizadas para saber se a operação está realmente mudando. <Link href="/blog/gestao-reputacao-online-guia" className="underline">Confira o guia prático de gestão de reputação online</Link>.</p></div>
        <div><h2 className="text-3xl font-bold">Reputação e aquisição</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Avaliações fazem parte da informação que potenciais clientes encontram antes de comprar. Por isso, gerir reputação não é apenas responder comentários: é criar um ciclo em que experiência, feedback, melhoria operacional e presença pública se reforçam.</p></div>
      </section>

      <section className="mt-16 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-8"><h2 className="text-2xl font-bold">Transforme reputação em rotina de gestão</h2><p className="mt-3 leading-7 text-zinc-300">Use a Filtra.AI para organizar sinais das avaliações e descobrir onde sua empresa deve concentrar atenção.</p><Link href="/auditoria-gratuita" className="mt-6 inline-block rounded-xl bg-indigo-500 px-5 py-3 font-semibold">Começar com uma auditoria</Link></section>
      <nav className="mt-12 flex flex-wrap gap-4 text-sm"><Link href="/feedback-de-clientes" className="underline">Feedback de clientes</Link><Link href="/analise-de-avaliacoes-com-ia" className="underline">Análise de avaliações com IA</Link><Link href="/ia" className="underline">Filtra.AI para IA</Link><Link href="/auditoria-gratuita" className="underline">Auditoria gratuita</Link><Link href="/blog/gestao-reputacao-online-guia" className="underline">Guia de gestão de reputação</Link><Link href="/blog/como-responder-avaliacoes-negativas" className="underline">Guia de respostas a avaliações negativas</Link><Link href="/avaliacoes-google" className="underline">Gestão de avaliações Google</Link></nav>
    </main>
    </>
  );
}
