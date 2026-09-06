'use client';

import { useState } from 'react';
import { getEnv } from '../utils/env';

type Props = {
  empresaRef: string;
  cancelAtPeriodEnd?: boolean;
  expiraEm?: string | null;
  status?: string;
};

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const t = localStorage.getItem('filtra_token');
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* */
  }
  return h;
}

export function SubscriptionActions({
  empresaRef,
  cancelAtPeriodEnd,
  expiraEm,
  status,
}: Props) {
  const api = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (status !== 'ativo' && status !== 'trial') return null;

  const cancelar = async () => {
    if (!confirm('Cancelar no fim do período já pago? Você continua usando até a data de validade.')) {
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaRef}/cancelar-assinatura`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setMsg(data.mensagem || 'Cancelamento agendado.');
      if (data.portal_url && confirm('Abrir portal Stripe para gerenciar cartão/faturas?')) {
        window.location.assign(data.portal_url);
      }
    } catch (e: any) {
      setMsg(e.message || 'Falha ao cancelar');
    } finally {
      setLoading(false);
    }
  };

  const reativar = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaRef}/reativar-assinatura`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setMsg(data.mensagem || 'Reativado.');
    } catch (e: any) {
      setMsg(e.message || 'Falha');
    } finally {
      setLoading(false);
    }
  };

  const portal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api}/api/empresa/${empresaRef}/billing-portal`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      if (data.url) window.location.assign(data.url);
    } catch (e: any) {
      setMsg(e.message || 'Portal indisponível');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 space-y-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">Assinatura</p>
      {cancelAtPeriodEnd ? (
        <p className="text-sm text-amber-300">
          Cancelamento agendado{expiraEm ? ` · acesso até ${expiraEm}` : ''}.
        </p>
      ) : (
        <p className="text-sm text-zinc-400">Cancele a qualquer momento. Uso até o fim do período pago.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {!cancelAtPeriodEnd ? (
          <button
            type="button"
            disabled={loading}
            onClick={cancelar}
            className="text-sm px-4 py-2 rounded-xl border border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancelar no fim do período
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={reativar}
            className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Desfazer cancelamento
          </button>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={portal}
          className="text-sm px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 underline disabled:opacity-50"
        >
          Portal Stripe (cartão)
        </button>
      </div>
      {msg && <p className="text-xs text-zinc-500">{msg}</p>}
    </section>
  );
}
