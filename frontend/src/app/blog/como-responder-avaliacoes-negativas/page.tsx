import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '../../components/BrandMark';

const canonical = 'https://filtraai.com/blog/como-responder-avaliacoes-negativas';

export const metadata: Metadata = {
  title: 'Como responder avaliações negativas',
  description: 'Aprenda a responder avaliações negativas com contexto e profissionalismo, transformar reclamações em aprendizado e acompanhar temas recorrentes.',
  alternates: { canonical },
  openGraph: {
    title: 'Como responder avaliações negativas',
    description: 'Um método prático para responder críticas públicas sem transformar o problema em disputa.',
    url: canonical,
    type: 'article',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Como responder avaliações negativas: guia para empresas',
  description: 'Um método prático para responder críticas públicas sem transformar o problema em disputa.',
  mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  datePublished: '2026-09-30',
  dateModified: '2026-09-30',
  author: { '@type': 'Organization', name: 'Filtra.AI', url: 'https://filtraai.com' },
  image: 'https://filtraai.com/icons/icon-512.png',
  publisher: { '@type': 'Organization', name: 'Filtra.AI', url: 'https://filtraai.com', logo: { '@type': 'ImageObject', url: 'https://filtraai.com/icons/icon-512.png' } },
};

export default function BlogComoResponderAvaliacaoNegativaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="min-h-screen bg-black text-zinc-100 font-sans">
        <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
          <BrandMark size="md" subtitle="Blog" href="/" />
          <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">Trial 7 dias</Link>
        </header>
        <article className="max-w-3xl mx-auto px-4 pb-16 space-y-7 text-sm text-zinc-300 leading-relaxed">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Guia · Avaliações</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">Como responder avaliações negativas: guia para empresas</h1>
            <p className="text-zinc-400">Uma crítica pública não precisa virar uma discussão pública. O objetivo da resposta é atender o caso, demonstrar responsabilidade e aprender com o padrão por trás da reclamação.</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-100">1. Leia antes de responder</h2>
            <p>Separe fatos, emoção e pedido do cliente. Verifique o atendimento ou pedido relacionado antes de publicar uma resposta. Quando a informação não puder ser confirmada, evite assumir culpa ou contradizer o cliente sem evidência.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-100">2. Responda com contexto, não com uma defesa longa</h2>
            <p>Uma boa resposta pública costuma reconhecer a experiência relatada, agradecer o contato quando apropriado e indicar o próximo passo. Dados pessoais, valores, documentos e detalhes do atendimento devem ficar fora da resposta pública.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-100">3. Não discuta a nota</h2>
            <p>O foco deve ser o problema relatado, não convencer o autor a mudar estrelas. Evite pressionar o cliente, oferecer benefício em troca de alteração da avaliação ou publicar respostas agressivas.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-100">4. Crie um padrão para a equipe</h2>
            <p>Defina responsáveis, prazo de resposta e critérios para escalar casos sensíveis. Um roteiro ajuda a manter consistência, mas não deve produzir respostas idênticas para situações diferentes.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identifique o tema principal.</li>
              <li>Confirme o que pode ser confirmado.</li>
              <li>Reconheça a experiência relatada.</li>
              <li>Mostre o próximo passo.</li>
              <li>Leve informações privadas para um canal adequado.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-100">5. A resposta é só o começo</h2>
            <p>Se dez clientes reclamam de espera, responder dez comentários não resolve o problema operacional. Agrupe avaliações por temas e acompanhe se a frequência de cada assunto muda depois das ações internas.</p>
            <p>É nesse ponto que <Link href="/analise-de-avaliacoes-com-ia" className="text-indigo-400 underline">análise de avaliações com IA</Link> pode ajudar a encontrar padrões em grande volume de comentários.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-100">Checklist antes de publicar</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>A resposta está relacionada ao problema real?</li>
              <li>Há informações privadas que deveriam ser removidas?</li>
              <li>O tom é profissional?</li>
              <li>Existe um próximo passo claro?</li>
              <li>O caso foi registrado para acompanhamento?</li>
            </ul>
          </section>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
            <p className="text-zinc-100 font-medium">Transforme avaliações em rotina de gestão</p>
            <p>O Filtra.AI ajuda equipes a organizar feedback, analisar avaliações e identificar padrões de reputação. Conheça a <Link href="/gestao-de-reputacao-online" className="text-indigo-400 underline">gestão de reputação online</Link> ou faça uma <Link href="/auditoria-gratuita" className="text-indigo-400 underline">auditoria gratuita</Link>.</p>
            <Link href="/" className="inline-flex rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 text-sm">Começar teste de 7 dias</Link>
          </div>

          <nav className="flex flex-wrap gap-3 text-xs text-zinc-500 pt-4 border-t border-zinc-800">
            <Link href="/blog/gestao-reputacao-online-guia">Guia de reputação</Link>
            <Link href="/feedback-de-clientes">Feedback de clientes</Link>
            <Link href="/analise-de-avaliacoes-com-ia">Análise com IA</Link>
            <Link href="/auditoria-gratuita">Auditoria gratuita</Link>
          </nav>
        </article>
      </div>
    </>
  );
}
