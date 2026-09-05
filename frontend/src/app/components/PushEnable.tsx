'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { getEnv } from '../utils/env';
import { enablePush, sendTestPush } from '../utils/pushClient';

export function PushEnable() {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const api = getEnv('NEXT_PUBLIC_API_URL');

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('filtra_token') || '' : '';

  if (!token) return null;

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-100 flex items-center gap-2">
          <Bell size={16} /> Alertas no celular/PC
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">
          Receba aviso quando entrar avaliação crítica (1–3★).
        </p>
        {msg && <p className="text-xs text-zinc-300 mt-1">{msg}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          className="text-sm px-3 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
          onClick={async () => {
            setLoading(true);
            setMsg('');
            const r = await enablePush(api, token);
            setMsg(r.ok ? 'Notificações ativadas.' : r.error || 'Erro');
            setLoading(false);
          }}
        >
          Ativar
        </button>
        <button
          type="button"
          disabled={loading}
          className="text-sm px-3 py-2 rounded-xl border border-zinc-600 text-zinc-200 disabled:opacity-50"
          onClick={async () => {
            setLoading(true);
            setMsg('');
            try {
              await enablePush(api, token);
              const r = await sendTestPush(api, token);
              setMsg(`Teste: enviados ${r.sent ?? 0}`);
            } catch (e: any) {
              setMsg(e.message || 'Falha');
            }
            setLoading(false);
          }}
        >
          Testar
        </button>
      </div>
    </div>
  );
}
