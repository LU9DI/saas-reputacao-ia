'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEnv } from '../../utils/env';

const TOKEN_KEY = 'admin_saas_token';
const apiUrl = () => getEnv('NEXT_PUBLIC_API_URL').replace(/\/$/, '');

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* */
  }
  return h;
}

function fmtMoney(n: number) {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Pill({ ok, label }: { ok: boolean | null; label?: string }) {
  const color =
    ok === true
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : ok === false
        ? 'bg-red-500/15 text-red-300 border-red-500/30'
        : 'bg-zinc-700/40 text-zinc-400 border-zinc-600/40';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${color}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          ok === true ? 'bg-emerald-400' : ok === false ? 'bg-red-400' : 'bg-zinc-500'
        }`}
      />
      {label || (ok === true ? 'OK' : ok === false ? 'Falha' : 'Sem dados')}
    </span>
  );
}

const card = 'bg-zinc-900 border border-zinc-800 rounded-2xl';

export default function AdminNegocioPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [planos, setPlanos] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const base = apiUrl();
      const headers = authHeaders();
      const me = await fetch(`${base}/api/admin/me`, { credentials: 'include', headers });
      if (!me.ok) {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* */
        }
        router.replace('/admin/login');
        return;
      }
      const res = await fetch(`${base}/api/admin/negocio`, { credentials: 'include', headers });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Erro ${res.status}`);
      }
      const j = await res.json();
      setData(j);
      setPlanos(
        (j.precos?.planos || []).map((p: any) => ({
          plan: p.plan,
          month_brl: p.month_brl,
          year_monthly_brl: p.year_monthly_base ?? p.year_monthly_brl,
          review_limit: p.review_limit,
        }))
      );
      setDiscount(Number(j.precos?.annual_discount_pct || 0));
    } catch (e: any) {
      setErro(e.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvarPrecos = async () => {
    setSaving(true);
    setMsg('');
    setErro('');
    try {
      const res = await fetch(`${apiUrl()}/api/admin/planos-precos`, {
        method: 'PUT',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({
          planos,
          annual_discount_pct: discount,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Erro ${res.status}`);
      setMsg('Preços atualizados. Checkout e /api/planos passam a usar os novos valores.');
      await carregar();
    } catch (e: any) {
      setErro(e.message || 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-sm">
        Carregando gestão de negócio…
      </div>
    );
  }

  const ia = data?.ia;
  const wpp = data?.whatsapp;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Admin · Negócio</p>
            <h1 className="text-xl font-bold tracking-tight">Preços, IA e WhatsApp</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={carregar}
              className="text-sm px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
            >
              Atualizar
            </button>
            <Link
              href="/admin"
              className="text-sm px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
            >
              ← Painel
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {erro && (
          <div className="text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
            {erro}
          </div>
        )}
        {msg && (
          <div className="text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-900 rounded-xl px-4 py-3">
            {msg}
          </div>
        )}

        {/* 1. Preços */}
        <section className={`${card} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold">Gestão rápida de planos e preços</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Altere valores sem abrir o SQLite. O desconto anual agressivo recalcula o mensal do
              plano anual a partir do mensal.
            </p>
          </div>
          <div className="px-5 py-4 border-b border-zinc-800 flex flex-wrap items-end gap-4">
            <label className="text-sm text-zinc-400">
              Desconto agressivo mensal → anual (%)
              <input
                type="number"
                min={0}
                max={50}
                step={1}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="mt-1 block w-28 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <p className="text-xs text-zinc-600 max-w-md">
              Ex.: 20% sobre o mensal define o valor mensal-equivalente do anual. Deixe 0 para usar o
              preço anual base de cada plano.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-2 text-left">Plano</th>
                  <th className="px-4 py-2 text-right">Mensal (R$)</th>
                  <th className="px-4 py-2 text-right">Anual /mês base</th>
                  <th className="px-4 py-2 text-right">Reviews/mês</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {planos.map((p, idx) => (
                  <tr key={p.plan}>
                    <td className="px-4 py-3 font-medium capitalize">{p.plan}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.1"
                        min={1}
                        value={p.month_brl}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setPlanos((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, month_brl: v } : x))
                          );
                        }}
                        className="w-28 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.1"
                        min={1}
                        value={p.year_monthly_brl}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setPlanos((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, year_monthly_brl: v } : x))
                          );
                        }}
                        className="w-28 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step={1}
                        min={1}
                        value={p.review_limit}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setPlanos((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, review_limit: v } : x))
                          );
                        }}
                        className="w-24 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-zinc-800 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={salvarPrecos}
              className="text-sm px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar preços'}
            </button>
          </div>
        </section>

        {/* 2. IA */}
        <section className={`${card} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Monitoramento de limites e custos de IA</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Contadores globais e alerta de rate limit (RPM/TPM) da Groq
              </p>
            </div>
            <Pill
              ok={ia?.rate_limit?.alerta ? false : true}
              label={ia?.rate_limit?.alerta ? 'Rate limit' : 'Estável'}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
            {[
              { l: 'Req. hoje', v: ia?.requests?.hoje ?? 0 },
              { l: 'Req. mês', v: ia?.requests?.mes ?? 0 },
              { l: 'Tokens hoje', v: ia?.requests?.tokens_hoje ?? 0 },
              { l: 'Tokens mês', v: ia?.requests?.tokens_mes ?? 0 },
            ].map((x) => (
              <div key={x.l} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
                <p className="text-[11px] uppercase text-zinc-500">{x.l}</p>
                <p className="text-xl font-bold tabular-nums mt-1">
                  {Number(x.v).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
          {ia?.rate_limit?.alerta && (
            <div className="mx-5 mb-4 text-sm text-amber-200 bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3">
              {ia.rate_limit.mensagem}
              <span className="block text-xs text-amber-500/80 mt-1">
                Hits 15 min: {ia.rate_limit.hits_15min} · 24h: {ia.rate_limit.hits_24h}
              </span>
            </div>
          )}
          {(ia?.rate_limit?.recentes || []).length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-[11px] uppercase text-zinc-500 mb-2">Últimos rate limits</p>
              <ul className="space-y-1 text-xs text-zinc-400 max-h-32 overflow-y-auto">
                {ia.rate_limit.recentes.map((h: any, i: number) => (
                  <li key={i} className="font-mono">
                    [{h.provider}] {h.detail?.slice(0, 120)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-500">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <p className="text-zinc-400 mb-1">Groq</p>
              <p>
                ok {ia?.providers?.stats?.groq?.success ?? 0} / fail{' '}
                {ia?.providers?.stats?.groq?.fail ?? 0}
                {ia?.providers?.stats?.groq?.cooling ? ' · em cooldown' : ''}
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <p className="text-zinc-400 mb-1">Gemini (failover)</p>
              <p>
                ok {ia?.providers?.stats?.gemini?.success ?? 0} / fail{' '}
                {ia?.providers?.stats?.gemini?.fail ?? 0}
              </p>
            </div>
          </div>
        </section>

        {/* 3. WhatsApp */}
        <section className={`${card} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Painel WhatsApp (operação)</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Canal usado para avisar empresários sobre críticas retidas
              </p>
            </div>
            <Pill
              ok={wpp?.ok ?? null}
              label={
                wpp?.ok === true ? 'Verde · online' : wpp?.ok === false ? 'Vermelho · offline' : 'Cinza'
              }
            />
          </div>
          <div className="px-5 py-5 space-y-2 text-sm">
            <p className="text-zinc-300">{wpp?.detalhe || '—'}</p>
            <p className="text-xs text-zinc-600">
              Fonte: {wpp?.fonte || '—'} · Configure{' '}
              <code className="text-zinc-400">N8N_WHATSAPP_STATUS_URL</code> no n8n para status
              connected/ok.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
