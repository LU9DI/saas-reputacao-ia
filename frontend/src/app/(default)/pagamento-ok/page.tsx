'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function Conteudo() {
  const sp = useSearchParams();
  const sessionId = sp.get('session_id');
  const empresa = sp.get('empresa_id') || sp.get('empresa');
  const plano = sp.get('plano');

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-4 text-center">
        <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide">Pagamento confirmado</p>
        <h1 className="text-2xl font-bold">Plano ativo</h1>
        <p className="text-sm text-zinc-400">
          {plano ? `Plano ${plano} ` : 'Sua assinatura '}foi processada. Em instantes o painel reflete o novo
          plano.
        </p>
        <div className="text-left text-xs text-zinc-400 space-y-2 bg-zinc-950/80 border border-zinc-800 rounded-xl p-3">
          <p>
            Você pode consultar a qualquer momento os{' '}
            <Link href="/termos" className="text-indigo-400 underline">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link href="/privacidade" className="text-indigo-400 underline">
              Política de Privacidade
            </Link>
            .
          </p>
          <p>
            Cancelamento: pelo painel da empresa ou pelo e-mail{' '}
            <a href="mailto:projetosaas1@gmail.com" className="text-indigo-400 underline">
              projetosaas1@gmail.com
            </a>
            . O acesso permanece até o fim do período já pago, observadas as regras legais de reembolso.
          </p>
        </div>
        {sessionId && (
          <p className="text-[11px] text-zinc-600 font-mono break-all">Sessão: {sessionId}</p>
        )}
        <div className="flex flex-col gap-2 pt-2">
          {empresa ? (
            <Link
              href={`/painel/${empresa}`}
              className="py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
            >
              Abrir painel
            </Link>
          ) : (
            <Link
              href="/login"
              className="py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
            >
              Fazer login no painel
            </Link>
          )}
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PagamentoOkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <Conteudo />
    </Suspense>
  );
}
