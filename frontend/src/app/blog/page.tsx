import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '../components/BrandMark';

export const metadata: Metadata = {
  title: 'Blog | Reputação, Google Reviews e SEO local',
  description:
    'Guias da Filtra.AI sobre gestão de reputação online, avaliações Google, feedback de clientes, SEO local e crescimento para empresas e agências.',
  alternates: { canonical: 'https://filtraai.com/blog' },
};

const posts = [
  { href: '/blog/gestao-reputacao-online-guia', title: 'Gestão de reputação online: guia prático para empresas', intent: 'Guia · Reputação' },
  { href: '/blog/como-responder-avaliacoes-negativas', title: 'Como responder avaliações negativas: guia para empresas', intent: 'Guia · Avaliações' },
  { href: '/blog/como-conseguir-avaliacoes-google', title: 'Como conseguir mais avaliações no Google (sem parecer spam)', intent: 'Guia prático' },
  { href: '/blog/velocity-reviews-google-maps-2026', title: 'Como manter avaliações recentes no Google Maps em 2026', intent: 'Tendência / SEO local' },
  { href: '/blog/review-1-estrela-primeiras-24-horas', title: 'Review 1★: o que fazer nas primeiras 24 horas', intent: 'Operação' },
  { href: '/blog/qr-code-balcao-reviews', title: 'QR Code no balcão para avaliações Google: guia prático', intent: 'Implementação' },
  { href: '/blog/seo-local-avaliacoes-local-pack', title: 'Pacotes de SEO local: o que incluir para gerar crescimento', intent: 'SEO local' },
  { href: '/blog/clinica-checklist-avaliacoes-google', title: 'Clínica e reputação online: checklist de avaliações Google', intent: 'Segmento' },
  { href: '/blog/agencia-vender-gestao-reputacao', title: 'Agência: como vender gestão de reputação como serviço recorrente', intent: 'B2B' },
  { href: '/blog/whatsapp-pedir-estrela-vs-filtrar-qr', title: 'WhatsApp ou QR Code para pedir avaliações Google: comparativo', intent: 'Comparação' },
  { href: '/blog/google-business-profile-avaliacoes', title: 'Google Business Profile e avaliações: como criar uma rotina que funciona', intent: 'Google Business Profile' },
  { href: '/blog/reputacao-online-clinicas', title: 'Reputação online para clínicas: guia prático de avaliações e feedback', intent: 'Segmento · Clínicas' },
  { href: '/blog/reputacao-online-hoteis', title: 'Reputação online para hotéis: como aprender com avaliações de hóspedes', intent: 'Segmento · Hotéis' },
  { href: '/blog/reputacao-franquias-multilocal', title: 'Reputação para franquias multilocal: como comparar unidades', intent: 'Segmento · Franquias' },
  { href: '/blog/avaliacoes-google-restaurantes', title: 'Avaliações Google para restaurantes: rotina prática de feedback', intent: 'Segmento · Restaurantes' },
  { href: '/blog/feedback-cliente-para-reputacao', title: 'Feedback do cliente para reputação: como fechar o ciclo', intent: 'Framework · Feedback' },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
        <BrandMark size="md" subtitle="Blog" href="/" />
        <Link href="/preview/teste" className="text-sm text-indigo-400 hover:text-indigo-300">Começar 7 dias grátis</Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-400">Filtra.AI</p>
          <h1 className="text-2xl font-bold text-zinc-50">Blog Filtra.AI</h1>
          <p className="text-sm leading-6 text-zinc-400">
            Reputação, avaliações Google, feedback de clientes e SEO local para negócios que dependem de confiança e presença nas buscas.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-zinc-100">Hub de gestão de reputação</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            A Filtra.AI conecta gestão de reputação online, avaliações Google, feedback de clientes e análise com IA.
            Para operações que atendem vários clientes, veja também a{' '}
            <Link href="/agencias" className="text-indigo-300 underline">
              gestão de reputação para agências de SEO local
            </Link>
            . Para a estratégia de busca local, aprofunde o guia de{' '}
            <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-300 underline">
              pacotes de SEO local e Local Pack
            </Link>
            .
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['/agencias', 'Agências de SEO local'],
              ['/feedback-de-clientes', 'Feedback de clientes'],
              ['/analise-de-avaliacoes-com-ia', 'Análise de avaliações com IA'],
              ['/gestao-de-reputacao-online', 'Gestão de reputação online'],
              ['/avaliacoes-google', 'Avaliações Google'],
              ['/auditoria-gratuita', 'Auditoria gratuita'],
            ].map(([href, title]) => (
              <Link key={href} href={href} className="rounded-xl border border-zinc-800 px-4 py-3 text-sm text-indigo-300 hover:border-indigo-500/40 hover:text-indigo-200">
                {title} →
              </Link>
            ))}
          </div>
        </section>

        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.href} className="rounded-xl border border-zinc-800 p-4 hover:border-zinc-700">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-zinc-500">{p.intent}</p>
              <Link href={p.href} className="text-base font-medium text-indigo-300 hover:text-indigo-200">{p.title}</Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
