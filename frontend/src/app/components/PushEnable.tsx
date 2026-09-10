'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { getEnv } from '../utils/env';
import { enablePush, sendTestPush } from '../utils/pushClient';

export function PushEnable() {
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err' | ''>('');
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [active, setActive] = useState(false);
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
          setMsgType('err');
        }
      } catch {
        if (!cancelled) {
          setConfigured(false);
          setMsg('Não foi possível contactar a API de push.');
          setMsgType('err');
        }
      }

      // se já tem permissão + subscription, marca como ativo na UI
      try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = reg ? await reg.pushManager.getSubscription() : null;
          if (!cancelled && Notification.permission === 'granted' && sub) {
            setActive(true);
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 flex items-center gap-2">
          <Bell size={16} className="text-indigo-400 shrink-0" /> Alertas no celular/PC
          {active && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Ativo
            </span>
          )}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Receba aviso quando entrar avaliação crítica (1–3★).
        </p>
        {configured === false && (
          <p className="text-xs text-amber-400 mt-1">
            Push não configurado no servidor (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).
          </p>
        )}
        {msg && (
          <p
            className={`text-xs mt-1.5 flex items-start gap-1.5 ${
              msgType === 'ok'
                ? 'text-emerald-400'
                : msgType === 'err'
                  ? 'text-rose-400'
                  : 'text-zinc-400'
            }`}
          >
            {msgType === 'ok' ? (
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            ) : msgType === 'err' ? (
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
            ) : null}
            <span>{msg}</span>
          </p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          disabled={loading || configured === false}
          className="text-sm px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
          onClick={async () => {
            setLoading(true);
            setMsg('');
            setMsgType('');
            try {
              const r = await enablePush(api, token);
              if (!r.ok) {
                setMsg(r.error || 'Não foi possível ativar.');
                setMsgType('err');
                setActive(false);
                return;
              }
              setActive(true);
              setMsg(
                r.already
                  ? 'Alertas já estavam ativos neste dispositivo. Você receberá avisos de críticas 1–3★.'
                  : 'Alertas ativados neste dispositivo. Você receberá avisos de críticas 1–3★.'
              );
              setMsgType('ok');

              // tenta um push de confirmação (não bloqueia a mensagem de sucesso)
              try {
                const t = await sendTestPush(api, token);
                if ((t.sent ?? 0) > 0) {
                  setMsg(
                    'Alertas ativados! Enviamos uma notificação de teste — confira a bandeja do sistema.'
                  );
                } else if ((t.subscriptions ?? 0) === 0) {
                  setMsg(
                    'Registro OK, mas o servidor ainda não viu a subscription. Clique em Testar ou ative de novo.'
                  );
                  setMsgType('err');
                }
              } catch {
                /* ativação ok; teste pode falhar se token cookie-only */
              }
            } catch (e: any) {
              setMsg(e?.message || 'Erro ao ativar alertas.');
              setMsgType('err');
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? 'Ativando…' : active ? 'Reativar' : 'Ativar'}
        </button>
        <button
          type="button"
          disabled={loading || configured === false}
          className="text-sm px-3 py-2 rounded-xl border border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          onClick={async () => {
            setLoading(true);
            setMsg('');
            setMsgType('');
            try {
              const en = await enablePush(api, token);
              if (!en.ok) {
                setMsg(en.error || 'Ative os alertas antes de testar.');
                setMsgType('err');
                return;
              }
              const r = await sendTestPush(api, token);
              const sent = r.sent ?? 0;
              if (sent > 0) {
                setMsg(`Teste enviado (${sent}). Deve aparecer uma notificação agora.`);
                setMsgType('ok');
                setActive(true);
              } else {
                setMsg(
                  `Nenhuma notificação enviada (subs=${r.subscriptions ?? 0}). Clique em Ativar neste aparelho.`
                );
                setMsgType('err');
              }
            } catch (e: any) {
              setMsg(e?.message || 'Falha no teste');
              setMsgType('err');
            } finally {
              setLoading(false);
            }
          }}
        >
          Testar
        </button>
      </div>
    </div>
  );
}
