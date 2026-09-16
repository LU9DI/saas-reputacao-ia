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
          Contrato de prestação de serviços SaaS. Planos: Inicial, Pro, Ultra, Corporativo e Rei. Meios de
          pagamento: <strong className="text-zinc-100">PayPal</strong> e{' '}
          <strong className="text-zinc-100">Mercado Pago</strong>.
        </p>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3 text-sm text-zinc-300 leading-relaxed">
          <p>
            O aceite vinculante ocorre no <strong className="text-zinc-100">checkout</strong> (compra) ou no
            cadastro do trial, com caixa <strong className="text-zinc-100">não pré-marcada</strong>.
          </p>
          <p>
            <strong className="text-zinc-100">Cancelamento:</strong> pelo painel ou suporte. O acesso permanece até o
            fim do período já pago, observadas as regras legais de reembolso e o direito de arrependimento (CDC)
            quando aplicável.
          </p>
          <p>
            <strong className="text-zinc-100">Suporte:</strong>{' '}
            <a href={`mailto:${SUPORTE_EMAIL}`} className="text-indigo-400 underline">
              {SUPORTE_EMAIL}
            </a>
          </p>
          <p className="text-xs text-zinc-500">
            Texto integral em <code className="text-indigo-300">docs/TERMOS_DE_USO.md</code>. Em caso de
            divergência, prevalece a versão publicada com data de atualização.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 underline">
            Voltar ao início
          </Link>
          <Link href="/privacidade" className="text-zinc-400 hover:text-zinc-200 underline">
            Política de Privacidade
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-zinc-200 underline">
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}
