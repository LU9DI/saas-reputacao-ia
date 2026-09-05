'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Star,
  LogOut,
  RefreshCw,
  AlertCircle,
  Bot,
  DollarSign,
  Clock,
  Cpu,
  FlaskConical,
  Workflow,
  Download,
  ExternalLink,
} from 'lucide-react';

interface Empresa {
  id: string;
  slug?: string;
  cnpj: string;
  nome_empresa: string;
  status: string;
  plan?: string;
  billing_cycle?: string;
  google_review_url: string | null;
  whatsapp_suporte?: string | null;
  criado_em: string;
  expira_em: string;
  cancel_at_period_end?: boolean;
  total_tokens?: number;
  atrasado?: boolean;
  mrr_estimado?: number;
  painel_path?: string;
}

interface Dashboard {
  kpis: {
    total_empresas: number;
    clientes_ativos: number;
    em_trial: number;
    planos_pagos: number;
    faturas_atrasadas: number;
    cancelamento_pendente: number;
    mrr_estimado_brl: number;
    arr_estimado_brl: number;
    tokens_mes: number;
    reviews_mes: number;
  };
  top_tokens: {
    empresa_id: string;
    nome_empresa: string;
    cnpj: string | null;
    plan: string | null;
    total_tokens: number;
  }[];
  faturas_atrasadas: {
    id: string;
    nome_empresa: string;
    cnpj: string;
    plan: string;
    expira_em: string;
    dias_atraso: number;
  }[];
}

interface Integracoes {
  n8n: { configurado: boolean; url_mascarada: string | null; ok: boolean | null; detalhe: string };
  google_maps: { api_key_env: boolean; empresas_com_link_google: number; ok: boolean; detalhe: string };
  whatsapp: { api_env: boolean; empresas_com_wpp: number; ok: boolean; detalhe: string };
}

interface StripeInv {
  id: string;
  number: string | null;
  status: string;
  customer_email: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: string | null;
  hosted_invoice_url: string | null;
}

interface Review {
  id: number;
  nome_empresa?: string;
  name: string;
  rating: number;
  comment: string;
  ai_reply: string | null;
  createdAt: string;
}

const TOKEN_KEY = 'admin_saas_token';
const apiUrl = () => (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

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
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDt(s: string) {
  try {
    return new Date(s).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
}

function StatusDot({ ok }: { ok: boolean | null }) {
  const c = ok === true ? 'bg-emerald-500' : ok === false ? 'bg-red-500' : 'bg-zinc-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${c}`} />;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [integ, setInteg] = useState<Integracoes | null>(null);
  const [stripeInv, setStripeInv] = useState<{
    configured: boolean;
    invoices: StripeInv[];
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [filtro, setFiltro] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const base = apiUrl();
      const headers = authHeaders();

      const meRes = await fetch(`${base}/api/admin/me`, { credentials: 'include', headers });
      if (!meRes.ok) {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* */
        }
        router.replace('/admin/login');
        return;
      }

      const [rDash, rEmp, rRev, rInt, rStripe] = await Promise.all([
        fetch(`${base}/api/admin/dashboard`, { credentials: 'include', headers }),
        fetch(`${base}/api/admin/empresas`, { credentials: 'include', headers }),
        fetch(`${base}/api/admin/reviews`, { credentials: 'include', headers }),
        fetch(`${base}/api/admin/integracoes`, { credentials: 'include', headers }),
        fetch(`${base}/api/admin/stripe/invoices`, { credentials: 'include', headers }),
      ]);

      if (rDash.ok) setDash(await rDash.json());
      if (rEmp.ok) setEmpresas(await rEmp.json());
      if (rRev.ok) setReviews(await rRev.json());
      if (rInt.ok) setInteg(await rInt.json());
      if (rStripe.ok) setStripeInv(await rStripe.json());

      if (!rDash.ok && !rEmp.ok) {
        setErro('Falha ao carregar dados do admin.');
      }
    } catch {
      setErro(`Falha de rede. API em ${apiUrl()} online?`);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const empresasFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter(
      (e) =>
        e.nome_empresa?.toLowerCase().includes(q) ||
        e.cnpj?.includes(q) ||
        e.plan?.toLowerCase().includes(q) ||
        e.status?.toLowerCase().includes(q)
    );
  }, [empresas, filtro]);

  const acao = async (id: string, path: string, body: object) => {
    setBusyId(id);
    setMsg('');
    try {
      const res = await fetch(`${apiUrl()}/api/admin/empresas/${id}/${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setMsg(data.mensagem || 'OK');
      await carregarDados();
    } catch (e: any) {
      setMsg(e.message || 'Falha');
    } finally {
      setBusyId(null);
    }
  };

  const baixarCsv = async () => {
    try {
      const res = await fetch(`${apiUrl()}/api/admin/empresas.csv`, {
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Falha no CSV');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'empresas-filtra.csv';
      a.click();
      URL.revokeObjectURL(url);
      setMsg('CSV baixado.');
    } catch (e: any) {
      setMsg(e.message || 'Erro CSV');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl()}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
      });
    } catch {
      /* */
    }
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* */
    }
    window.location.assign('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const k = dash?.kpis;

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel Admin</h1>
            <p className="text-sm text-zinc-500">Faturamento, clientes, tokens e integrações</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={baixarCsv}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-sm py-2 px-4 rounded-xl border border-zinc-800"
            >
              <Download size={16} /> CSV
            </button>
            <button
              type="button"
              onClick={carregarDados}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-sm py-2 px-4 rounded-xl border border-zinc-800"
            >
              <RefreshCw size={16} /> Atualizar
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-sm py-2 px-4 rounded-xl border border-zinc-800"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-3 bg-red-950/50 text-red-300 p-4 rounded-xl border border-red-900 text-sm">
            <AlertCircle size={18} /> {erro}
          </div>
        )}
        {msg && (
          <div className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-xl px-4 py-2">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: Building2, label: 'Ativos', value: k?.clientes_ativos ?? '—', sub: `${k?.total_empresas ?? 0} total` },
            { icon: FlaskConical, label: 'Em trial', value: k?.em_trial ?? '—', sub: 'período teste' },
            { icon: DollarSign, label: 'MRR est.', value: k ? fmtMoney(k.mrr_estimado_brl) : '—', sub: k ? `ARR ${fmtMoney(k.arr_estimado_brl)}` : '' },
            { icon: Clock, label: 'Atrasados', value: k?.faturas_atrasadas ?? '—', sub: 'vencidos' },
            { icon: Cpu, label: 'Tokens/mês', value: k?.tokens_mes ?? '—', sub: `${k?.reviews_mes ?? 0} reviews` },
            { icon: Star, label: 'Pagos', value: k?.planos_pagos ?? '—', sub: `${k?.cancelamento_pendente ?? 0} cancel. pend.` },
          ].map((x) => (
            <div key={x.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-zinc-500 mb-2">
                <x.icon size={14} className="text-indigo-400" /> {x.label}
              </div>
              <p className="text-xl font-bold tabular-nums">{x.value}</p>
              {x.sub && <p className="text-[11px] text-zinc-500 mt-1">{x.sub}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden lg:col-span-2">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
              <Cpu size={16} className="text-amber-400" />
              <h2 className="font-semibold text-sm">Top 10 — tokens IA</h2>
            </div>
            {!dash?.top_tokens?.length ? (
              <p className="p-5 text-sm text-zinc-500">Sem uso de tokens ainda (gera com reviews + IA).</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-zinc-500 uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Empresa</th>
                      <th className="px-4 py-2 text-left">Plano</th>
                      <th className="px-4 py-2 text-right">Tokens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {dash.top_tokens.map((t, i) => (
                      <tr key={t.empresa_id}>
                        <td className="px-4 py-2.5 text-zinc-500">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{t.nome_empresa}</div>
                          <div className="text-xs text-zinc-500">{t.cnpj}</div>
                        </td>
                        <td className="px-4 py-2.5 uppercase text-xs">{t.plan || '—'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-amber-300">
                          {t.total_tokens.toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
              <Workflow size={16} /> Integrações
            </div>
            {integ ? (
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <StatusDot ok={integ.n8n.ok} />
                  <div>
                    <p className="font-medium">n8n</p>
                    <p className="text-xs text-zinc-500">{integ.n8n.detalhe}</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <StatusDot ok={integ.google_maps.ok} />
                  <div>
                    <p className="font-medium">Google Maps</p>
                    <p className="text-xs text-zinc-500">{integ.google_maps.detalhe}</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <StatusDot ok={integ.whatsapp.ok} />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-xs text-zinc-500">{integ.whatsapp.detalhe}</p>
                  </div>
                </li>
              </ul>
            ) : (
              <p className="text-xs text-zinc-500">Sem dados.</p>
            )}
          </div>
        </div>

        {/* Stripe */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" />
            <h2 className="font-semibold text-sm">Faturas Stripe</h2>
            {stripeInv && !stripeInv.configured && (
              <span className="text-xs text-zinc-500">· STRIPE_SECRET_KEY não configurada</span>
            )}
            {stripeInv?.error && <span className="text-xs text-red-400">· {stripeInv.error}</span>}
          </div>
          {!stripeInv?.invoices?.length ? (
            <p className="p-5 text-sm text-zinc-500">Nenhuma fatura retornada pelo Stripe.</p>
          ) : (
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead className="text-xs text-zinc-500 uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Nº</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-right">Pago</th>
                    <th className="px-4 py-2 text-left">Data</th>
                    <th className="px-4 py-2 text-right">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {stripeInv.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-2 font-mono text-xs">{inv.number || inv.id.slice(-8)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            inv.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : inv.status === 'open'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-zinc-700 text-zinc-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-zinc-400 text-xs">{inv.customer_email || '—'}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {fmtMoney(inv.amount_paid || inv.amount_due)}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {inv.created ? fmtDt(inv.created) : '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {inv.hosted_invoice_url && (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 text-xs hover:underline"
                          >
                            abrir
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!!dash?.faturas_atrasadas?.length && (
          <div className="bg-red-950/20 border border-red-900/40 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 text-sm font-semibold text-red-300">Acessos atrasados (banco)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-red-900/20">
                  {dash.faturas_atrasadas.map((f) => (
                    <tr key={f.id}>
                      <td className="px-4 py-2">{f.nome_empresa}</td>
                      <td className="px-4 py-2 text-zinc-400">{f.cnpj}</td>
                      <td className="px-4 py-2 uppercase text-xs">{f.plan}</td>
                      <td className="px-4 py-2 text-red-400 text-right">{f.dias_atraso}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-sm">Empresas</h2>
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar…"
              className="text-sm px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 w-full sm:w-64 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {empresasFiltradas.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">Nenhuma empresa.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-950/80 text-zinc-500 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3 text-left">Empresa</th>
                    <th className="px-4 py-3 text-left">Cadastro</th>
                    <th className="px-4 py-3 text-left">Plano</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Expira</th>
                    <th className="px-4 py-3 text-right">Tokens</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {empresasFiltradas.map((e) => {
                    const path = e.painel_path || `/painel/${e.slug || e.id}`;
                    return (
                      <tr key={e.id} className="hover:bg-zinc-800/40">
                        <td className="px-4 py-3">
                          <div className="font-medium">{e.nome_empresa}</div>
                          <div className="text-xs text-zinc-500 font-mono">{e.cnpj}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                          {fmtDt(e.criado_em)}
                        </td>
                        <td className="px-4 py-3 uppercase text-xs text-indigo-300">{e.plan || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              e.atrasado
                                ? 'bg-red-500/20 text-red-300'
                                : e.status === 'ativo'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {e.atrasado ? 'atrasado' : e.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">{fmtDt(e.expira_em)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {(e.total_tokens || 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-1">
                            <a
                              href={path}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] px-2 py-1 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 inline-flex items-center gap-1"
                            >
                              <ExternalLink size={10} /> Painel
                            </a>
                            <button
                              type="button"
                              disabled={busyId === e.id}
                              onClick={() => acao(e.id, 'renovar', { ciclo: 'month' })}
                              className="text-[10px] px-2 py-1 rounded-lg bg-indigo-600/80 text-white disabled:opacity-50"
                            >
                              +1 mês
                            </button>
                            <button
                              type="button"
                              disabled={busyId === e.id}
                              onClick={() => acao(e.id, 'renovar', { ciclo: 'year' })}
                              className="text-[10px] px-2 py-1 rounded-lg bg-indigo-900 text-indigo-100 disabled:opacity-50"
                            >
                              +1 ano
                            </button>
                            <button
                              type="button"
                              disabled={busyId === e.id}
                              onClick={() => {
                                if (confirm(`Cancelar ${e.nome_empresa}?`))
                                  acao(e.id, 'cancelar', { imediato: true });
                              }}
                              className="text-[10px] px-2 py-1 rounded-lg bg-red-950 text-red-300 border border-red-900/50 disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="font-semibold text-sm">Últimas avaliações</h2>
          </div>
          {reviews.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">Nenhuma.</p>
          ) : (
            <div className="divide-y divide-zinc-800 max-h-80 overflow-y-auto">
              {reviews.slice(0, 30).map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                    <span className="text-amber-400">{'★'.repeat(r.rating)}</span>
                    <span className="text-zinc-200">{r.name}</span>
                    {r.nome_empresa && <span>· {r.nome_empresa}</span>}
                    <span>· {fmtDt(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-zinc-400 mt-1">{r.comment}</p>}
                  {r.ai_reply && (
                    <p className="text-sm text-zinc-300 mt-2 border-l-2 border-indigo-500/40 pl-3">
                      <Bot size={12} className="inline text-indigo-400" /> {r.ai_reply}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
