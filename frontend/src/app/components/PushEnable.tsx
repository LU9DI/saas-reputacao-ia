'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { getEnv } from '../utils/env';
import { apiFetch } from '../utils/apiFailover';
import { enablePush, sendTestPush } from '../utils/pushClient';

export function PushEnable() {
  const { t } = useLanguage();
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
        const res = await apiFetch('/api/push/vapid-public-key');
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setConfigured(Boolean(data.configured || data.publicKey));
        if (!res.ok && !cancelled) {
          setMsg(data.error || t.push_config_error);
          setMsgType('err');
        }
      } catch {
        if (!cancelled) {
          setConfigured(false);
          setMsg(t.push_api_error);
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
          <Bell size={16} className="text-indigo-400 shrink-0" /> {t.push_title}
          {active && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Ativo
            </span>
          )}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {t.push_desc}
        </p>
        {configured === false && (
          <p className="text-xs text-amber-400 mt-1">
            {t.push_config_error}
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
                setMsg(r.error || t.push_api_error);
                setMsgType('err');
                setActive(false);
                return;
              }
              setActive(true);
              setMsg(
                r.already
                  ? t.push_already
                  : t.push_enabled
              );
              setMsgType('ok');

              // tenta um push de confirmação (não bloqueia a mensagem de sucesso)
              try {
                const tst = await sendTestPush(api, token);
                if ((tst.sent ?? 0) > 0) {
                  setMsg(
                    t.push_test_ok
                  );
                } else if ((tst.subscriptions ?? 0) === 0) {
                  setMsg(t.push_no_sub.replace('{n}', String(tst.subscriptions ?? 0)));
                  setMsgType('err');
                }
              } catch {
                /* ativação ok; teste pode falhar se token cookie-only */
              }
            } catch (e: any) {
              setMsg(e?.message || t.push_api_error);
              setMsgType('err');
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? t.push_enabling : active ? t.push_reactivate : t.push_activate}
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
                setMsg(en.error || t.push_activate);
                setMsgType('err');
                return;
              }
              const r = await sendTestPush(api, token);
              const sent = r.sent ?? 0;
              if (sent > 0) {
                setMsg(t.push_test_sent.replace('{n}', String(sent)));
                setMsgType('ok');
                setActive(true);
              } else {
                setMsg(
                  t.push_no_sub.replace('{n}', String(r.subscriptions ?? 0))
                );
                setMsgType('err');
              }
            } catch (e: any) {
              setMsg(e?.message || t.push_api_error);
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
