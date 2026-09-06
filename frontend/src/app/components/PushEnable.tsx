'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getEnv } from '../utils/env';
import { enablePush, sendTestPush } from '../utils/pushClient';

export function PushEnable() {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const api = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('filtra_token') || '' : '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${api}/api/push/vapid-public-key`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setConfigured(Boolean(data.configured || data.publicKey));
        if (!res.ok && !cancelled) {
          setMsg(data.error || 'Push não configurado no servidor (VAPID).');
        }
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-100 flex items-center gap-2">
          <Bell size={16} className="text-indigo-400" /> Alertas no celular/PC
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Receba aviso quando entrar avaliação crítica (1–3★).
        </p>
        {configured === false && (
          <p className="text-xs text-amber-400 mt-1">
            Push não configurado. No backend/.env defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY
            (gere com: npx web-push generate-vapid-keys).
          </p>
        )}
        {msg && <p className="text-xs text-zinc-400 mt-1">{msg}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading || configured === false}
          className="text-sm px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
          onClick={async () => {
            setLoading(true);
            setMsg('');
            const r = await enablePush(api, token);
            setMsg(r.ok ? 'Notificações ativadas neste dispositivo.' : r.error || 'Erro');
            setLoading(false);
          }}
        >
          Ativar
        </button>
        <button
          type="button"
          disabled={loading || configured === false}
          className="text-sm px-3 py-2 rounded-xl border border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
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
