'use client';

import Link from 'next/link';
import { BrandMark } from '../components/BrandMark';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const SUPORTE_EMAIL = 'projetosaas1@gmail.com';

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
        <BrandMark size="md" subtitle="Reputation" href="/" />
        <LanguageSwitcher />
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Termos de Uso e Contrato de Assinatura SaaS</h1>
          <p className="text-sm text-zinc-400">FILTRA.AI — Versão 15 de setembro de 2026</p>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">
          O texto integral dos Termos está disponível no repositório do produto e será mantido atualizado
          nesta página. Meios de pagamento previstos: <strong className="text-zinc-100">PayPal</strong> e{' '}
          <strong className="text-zinc-100">Mercado Pago</strong>. Planos de autoatendimento: Inicial, Pro,
          Ultra, Corporativo e Rei.
        </p>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3 text-sm text-zinc-300 leading-relaxed">
          <p>
            Ao cadastrar-se ou contratar, você deverá escolher de forma expressa{' '}
            <strong className="text-zinc-100">Aceito</strong> ou <strong className="text-zinc-100">Não aceito</strong>{' '}
            (opções não pré-marcadas). Somente <strong className="text-zinc-100">Aceito</strong> permite concluir o
            cadastro ou a assinatura.
          </p>
          <p>
            <strong className="text-zinc-100">Suporte:</strong>{' '}
            <a href={`mailto:${SUPORTE_EMAIL}`} className="text-indigo-400 underline">
              {SUPORTE_EMAIL}
            </a>
          </p>
          <p>
            Documento completo (Markdown):{' '}
            <code className="text-xs text-indigo-300">docs/TERMOS_DE_USO.md</code> no repositório do projeto.
          </p>
          <p className="text-xs text-zinc-500">
            Este material não substitui a Política de Privacidade. Em caso de divergência, prevalece a versão
            publicada com data de atualização.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 underline">
            Voltar ao início
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-zinc-200 underline">
            Login
          </Link>
          <a href={`mailto:${SUPORTE_EMAIL}`} className="text-zinc-400 hover:text-zinc-200 underline">
            Contato / suporte
          </a>
        </div>
      </main>
    </div>
  );
}
