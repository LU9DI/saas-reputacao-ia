'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/apiFailover';
import { persistFiltraToken } from '../../utils/persistToken';

/** Confirma e-mail do trial e redireciona ao painel. */
export default function VerifyTrialEmail() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando seu e-mail…');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    if (!token) {
      setStatus('error');
      setMessage('Link de confirmação inválido.');
      return;
    }

    (async () => {
      try {
        const response = await apiFetch(
          '/api/trial/verificar?token=' + encodeURIComponent(token),
          { credentials: 'include', timeoutMs: 15000 }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível confirmar o e-mail.');
        if (data.token) persistFiltraToken(data.token);
        setStatus('ok');
        setMessage('E-mail confirmado. Seu teste de 7 dias está ativo.');
        window.setTimeout(() => {
          window.location.href = data.link_painel || '/login';
        }, 900);
      } catch (error: any) {
        setStatus('error');
        setMessage(error?.message || 'Não foi possível confirmar o e-mail.');
      }
    })();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#050507] px-6 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <div className="text-xs uppercase tracking-widest text-indigo-300">Filtra.AI</div>
        <h1 className="mt-3 text-2xl font-semibold">
          {status === 'loading' ? 'Confirmando e-mail' : status === 'ok' ? 'Tudo certo' : 'Não foi possível confirmar'}
        </h1>
        <p className="mt-3 text-zinc-400">{message}</p>
      </div>
    </main>
  );
}
