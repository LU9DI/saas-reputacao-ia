import Link from 'next/link';
import { BrandMark } from './BrandMark';
import { LanguageSwitcher } from './LanguageSwitcher';

export function BlogArticle({
  kicker,
  title,
  lead,
  children,
}: {
  kicker: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
        <BrandMark size="md" subtitle="Blog" href="/" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          Trial 7 dias
          </Link>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-4 pb-16 space-y-6 text-sm text-zinc-300 leading-relaxed">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-zinc-500">{kicker}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">{title}</h1>
          <p className="text-zinc-400">{lead}</p>
        </div>
        {children}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <p className="text-zinc-100 font-medium">Teste o Filtra.AI por 7 dias</p>
          <p>Feedback estruturado, análise de avaliações e convite para avaliações genuínas. Sem cartão no trial.</p>
          <Link
            href="/"
            className="inline-flex rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 text-sm"
          >
            Começar teste gratuito
          </Link>
        </div>
        <nav className="flex flex-wrap gap-3 text-xs text-zinc-500 pt-4 border-t border-zinc-800">
          <Link href="/filtra-ai" className="hover:text-zinc-300">
            Filtra.AI
          </Link>
          <Link href="/avaliacoes-google" className="hover:text-zinc-300">
            Avaliações Google
          </Link>
          <Link href="/calculadora-nota-google" className="hover:text-zinc-300">
            Calculadora de nota do Google
          </Link>
          <Link href="/feedback-de-clientes" className="hover:text-zinc-300">
            Feedback de clientes
          </Link>
          <Link href="/analise-de-avaliacoes-com-ia" className="hover:text-zinc-300">
            Análise de avaliações com IA
          </Link>
          <Link href="/gestao-de-reputacao-online" className="hover:text-zinc-300">
            Gestão de reputação online
          </Link>
          <Link href="/blog/gestao-reputacao-online-guia" className="hover:text-zinc-300">
            Guia de reputação online
          </Link>
          <Link href="/blog/seo-local-avaliacoes-local-pack" className="hover:text-zinc-300">
            Pacotes de SEO local
          </Link>
          <Link href="/blog/avaliacoes-google-restaurantes" className="hover:text-zinc-300">
            Avaliações em restaurantes
          </Link>
          <Link href="/blog/reputacao-online-clinicas" className="hover:text-zinc-300">
            Reputação em clínicas
          </Link>
          <Link href="/blog/reputacao-franquias-multilocal" className="hover:text-zinc-300">
            Redes e franquias
          </Link>
          <Link href="/blog/google-business-profile-avaliacoes" className="hover:text-zinc-300">
            Google Business Profile
          </Link>
          <Link href="/auditoria-gratuita" className="hover:text-zinc-300">
            Auditoria gratuita
          </Link>
          <Link href="/blog" className="hover:text-zinc-300">
            Todos os artigos
          </Link>
          <Link href="/como-funciona" className="hover:text-zinc-300">
            Como funciona
          </Link>
          <Link href="/restaurantes" className="hover:text-zinc-300">
            Restaurantes
          </Link>
          <Link href="/clinicas" className="hover:text-zinc-300">
            Clínicas
          </Link>
        </nav>
      </article>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-zinc-100 pt-2">{children}</h2>;
}
