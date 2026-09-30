import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Feedback de clientes: transforme opiniões em crescimento',
  description: 'Entenda o que seus clientes estão dizendo, encontre padrões nas avaliações e transforme feedback em decisões para crescer, reter clientes e proteger sua reputação.',
  alternates: { canonical: '/feedback-de-clientes' },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Filtra.AI · Inteligência de clientes</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">Feedback de clientes não é só opinião. É dado de crescimento.</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-300">Seus clientes já estão mostrando o que funciona, o que afasta compradores e onde sua empresa pode melhorar. A Filtra.AI organiza esse sinal e transforma avaliações e feedback em prioridades práticas.</p>
        <div className="mt-8 flex flex-wrap gap-4"><Link href="/auditoria-gratuita" className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white">Faça uma auditoria gratuita</Link><Link href="/planos" className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold">Conheça a Filtra.AI</Link></div>
      </header>
      <section className="mt-16 space-y-10">
        <div><h2 className="text-3xl font-bold">Por que feedback de clientes é um ativo</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Comentários e avaliações registram a experiência depois da compra. Quando analisados em conjunto, ajudam a encontrar padrões que uma equipe pode não perceber ao responder cada comentário isoladamente. O objetivo é transformar sinais repetidos em decisões de produto, atendimento, operação e reputação.</p><p className="mt-4 max-w-3xl leading-8 text-zinc-400">O valor não está apenas na nota média. Uma empresa pode manter uma boa média e ainda acumular reclamações sobre um ponto específico. Da mesma forma, elogios recorrentes podem revelar diferenciais que deveriam aparecer com mais força na comunicação comercial.</p></div>
        <div><h2 className="text-3xl font-bold">O que procurar nas avaliações</h2><ul className="mt-4 max-w-3xl space-y-3 leading-7 text-zinc-400"><li>• temas recorrentes em notas baixas;</li><li>• elogios que mostram diferenciais percebidos;</li><li>• problemas de atendimento, prazo, preço ou entrega;</li><li>• mudanças na percepção ao longo do tempo;</li><li>• diferenças entre unidades, serviços ou canais.</li></ul></div>
        <div><h2 className="text-3xl font-bold">Como transformar feedback em ação</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Reúna avaliações de forma consistente, agrupe comentários por tema e observe frequência, nota, período e contexto. Depois, separe sintomas de causas: “demora” pode aparecer como reclamação, mas a causa pode estar no processo de atendimento, na comunicação ou na capacidade da equipe.</p><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Por fim, transforme os padrões em ações verificáveis. Uma boa análise deve responder o que mudou, onde o problema aparece, qual evidência sustenta a conclusão e qual ação pode ser acompanhada depois. Assim, feedback deixa de ser arquivo histórico e passa a fazer parte da gestão.</p></div>
        <div><h2 className="text-3xl font-bold">Feedback público e privado</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Avaliações públicas mostram como o mercado percebe a empresa. Feedback privado ajuda a descobrir atritos que o cliente talvez não publique. Os dois sinais podem ser complementares: um afeta a percepção de novos compradores; o outro pode ajudar a corrigir problemas antes que se repitam.</p></div>
        <div><h2 className="text-3xl font-bold">Quais indicadores acompanhar</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Além da nota média, acompanhe volume de avaliações, distribuição por nota, temas recorrentes, evolução por período e diferenças entre unidades ou serviços. Também registre quais temas geraram ações e se os comentários relacionados diminuíram depois das mudanças.</p></div>
      </section>
      <section className="mt-16 grid gap-6 md:grid-cols-3">{[['Encontre padrões','Descubra reclamações, elogios e temas recorrentes que ficam escondidos em centenas de avaliações.'],['Priorize problemas','Separe sinais importantes do ruído e transforme a voz do cliente em prioridades de ação.'],['Cresça com inteligência','Use a experiência do cliente para melhorar reputação, retenção, aquisição e resultado.']].map(([title,text]) => <article key={title} className="rounded-2xl border border-zinc-800 p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-zinc-400">{text}</p></article>)}</section>
      <section className="mt-16 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-8"><h2 className="text-2xl font-bold">O que seus clientes estão dizendo que você ainda não percebeu?</h2><p className="mt-3 leading-7 text-zinc-300">A Filtra.AI ajuda empresas a transformar avaliações em informação acionável, em vez de deixar milhares de comentários parados em plataformas diferentes.</p><Link href="/auditoria-gratuita" className="mt-6 inline-block rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white">Analisar minhas avaliações</Link></section>
      <nav className="mt-12 flex flex-wrap gap-4 text-sm"><Link href="/analise-de-avaliacoes-com-ia" className="underline">Análise de avaliações com IA</Link><Link href="/gestao-de-reputacao-online" className="underline">Gestão de reputação online</Link><Link href="/auditoria-gratuita" className="underline">Auditoria gratuita</Link></nav>
    </main>
  );
}
