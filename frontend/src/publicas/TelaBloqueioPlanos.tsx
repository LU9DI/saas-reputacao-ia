'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { PlanCards } from '../app/components/PlanCards';

type Props = {
  empresaId?: string | null;
};

/**
 * Tela quando trial/assinatura expirou.
 * Usa o mesmo checkout Stripe do PlanCards (não é mais TODO).
 */
export default function TelaBloqueioPlanos({ empresaId = null }: Props) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-6 font-sans text-zinc-100">
      <div className="w-full max-w-7xl space-y-10 py-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="mx-auto w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 border border-amber-500/20">
            <ShieldAlert size={32} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Período de testes encerrado
          </h1>
          <p className="text-base text-zinc-400 leading-relaxed">
            Escolha um plano para reativar o QR Code e continuar recebendo avaliações. Pagamento
            seguro via Stripe.
          </p>
        </div>

        <PlanCards empresaId={empresaId} requireEmpresa={Boolean(empresaId)} showComoFunciona={false} />
      </div>
    </div>
  );
}
