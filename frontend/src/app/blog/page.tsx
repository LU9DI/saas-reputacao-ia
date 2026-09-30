import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '../components/BrandMark';

export const metadata: Metadata = {
  title: 'Blog | Reputação, Google Reviews e SEO local',
  description:
    'Artigos Filtra.AI sobre avaliações Google, SEO local, restaurantes, clínicas e gestão de reputação online.',
  alternates: { canonical: '/blog' },
};

const posts = [
  {
    href: '/blog/gestao-reputacao-online-guia',
    title: 'Gestão de reputação online: guia prático para empresas',
    intent: 'Guia · Reputação',
  },
  {
    href: '/blog/como-conseguir-avaliacoes-google',
    title: 'Como conseguir mais avaliações no Google (sem parecer spam)',
    intent: 'Guia prático',
  },
  {
    href: '/blog/velocity-reviews-google-maps-2026',
    title: 'Por que a velocidade de reviews importa no Google Maps em 2026',
    intent: 'Tendência / SEO local',
  },
  {
    href: '/blog/review-1-estrela-primeiras-24-horas',
    title: 'Review 1★: o que fazer nas primeiras 24 horas',
    intent: 'Operação',
  },
  {
    href: '/blog/qr-code-balcao-reviews',
    title: 'QR Code no balcão: fluxo que aumenta reviews 4–5★',
    intent: 'Implementação',
  },
  {
    href: '/blog/seo-local-avaliacoes-local-pack',
    title: 'SEO local e avaliações: o que realmente ranqueia no Local Pack',
    intent: 'SEO',
  },
  {
    href: '/blog/clinica-checklist-avaliacoes-google',
    title: 'Clínica e reputação online: checklist de avaliações Google',
    intent: 'Segmento',
  },
  {
    href: '/blog/agencia-vender-gestao-reputacao',
    title: 'Agência: como vender gestão de reputação como serviço recorrente',
    intent: 'B2B',
  },
  {
    href: '/blog/whatsapp-pedir-estrela-vs-filtrar-qr',
    title: 'Pedir estrela no WhatsApp vs filtrar no QR: comparativo',
    intent: 'Comparação',
  },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
        <BrandMark size="md" subtitle="Blog" href="/" />
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          Trial 7 dias
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-50">Blog Filtra.AI</h1>
          <p className="text-sm text-zinc-400">
            Reputação, Google Reviews e SEO local para negócios que dependem de nota pública.
          </p>
        </div>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-zinc-100">Ferramentas e guias de reputação</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Vá direto para os conteúdos centrais do Filtra.AI sobre feedback, avaliações, reputação e diagnóstico.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['/feedback-de-clientes', 'Feedback de clientes'],
              ['/analise-de-avaliacoes-com-ia', 'Análise de avaliações com IA'],
              ['/gestao-de-reputacao-online', 'Gestão de reputação online'],
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
            <li key={p.href} className="border border-zinc-800 rounded-xl p-4 hover:border-zinc-700">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">{p.intent}</p>
              <Link href={p.href} className="text-base font-medium text-indigo-300 hover:text-indigo-200">
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
