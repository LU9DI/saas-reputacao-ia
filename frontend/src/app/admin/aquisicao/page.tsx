'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ExternalLink, RefreshCw, Send, Sparkles, Trash2 } from 'lucide-react';
import { getEnv } from '../../utils/env';

const TOKEN_KEY = 'admin_saas_token';
const apiUrl = () => getEnv('NEXT_PUBLIC_API_URL').replace(/\/$/, '');

type ContentItem = {
  id: string;
  campaign_id: string;
  platform: 'linkedin' | 'instagram' | 'x';
  title: string;
  body: string;
  status: string;
  utm_content: string | null;
  source_url: string | null;
  metadata: Record<string, unknown>;
  claim_flags: string[];
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
};

type Overview = {
  pending_review?: number;
  approved?: number;
  published?: number;
  rejected?: number;
  total?: number;
  eligible_leads?: number;
  diagnostics?: number;
  publish_configured?: boolean;
  ai_configured?: boolean;
};

const CHANNEL_LABEL: Record<ContentItem['platform'], string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X',
};

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* localStorage can be unavailable */
  }
  return headers;
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiUrl()}${path}`, {
    credentials: 'include',
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
  });
}

export default function AdminAquisicaoPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview>({});
  const [pending, setPending] = useState<ContentItem[]>([]);
  const [approved, setApproved] = useState<ContentItem[]>([]);
  const [edits, setEdits] = useState<Record<string, { title: string; body: string }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const cards = useMemo(
    () => [
      { label: 'Leads com consentimento', value: overview.eligible_leads ?? 0 },
      { label: 'Diagnósticos registrados', value: overview.diagnostics ?? 0 },
      { label: 'Rascunhos pendentes', value: overview.pending_review ?? 0 },
      { label: 'Aprovados', value: overview.approved ?? 0 },
      { label: 'Publicados', value: overview.published ?? 0 },
    ],
    [overview],
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const me = await api('/api/admin/me');
      if (!me.ok) {
        try { localStorage.removeItem(TOKEN_KEY); } catch { /* */ }
        router.replace('/admin/login');
        return;
      }
      const [rOverview, rPending, rApproved] = await Promise.all([
        api('/api/admin/acquisition/overview'),
        api('/api/admin/acquisition/content?status=pending_review&limit=50'),
        api('/api/admin/acquisition/content?status=approved&limit=50'),
      ]);
      if (rOverview.ok) setOverview(await rOverview.json());
      if (rPending.ok) {
        const data = await rPending.json();
        const items: ContentItem[] = Array.isArray(data.items) ? data.items : [];
        setPending(items);
        setEdits((current) => {
          const next = { ...current };
          for (const item of items) {
            if (!next[item.id]) next[item.id] = { title: item.title, body: item.body };
          }
          return next;
        });
      }
      if (rApproved.ok) {
        const data = await rApproved.json();
        setApproved(Array.isArray(data.items) ? data.items : []);
      }
      if (!rOverview.ok && !rPending.ok && !rApproved.ok) {
        setError('Não foi possível carregar a fila de aquisição.');
      }
    } catch {
      setError('Falha de rede ao carregar a automação de conteúdo.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial do painel (fetch)
    load();
  }, [load]);

  async function generate() {
    setBusy('generate');
    setMessage('');
    setError('');
    try {
      const res = await api('/api/admin/acquisition/content/generate', {
        method: 'POST',
        body: JSON.stringify({ limit: 2 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Falha ao gerar rascunhos.');
      setMessage(
        data.generated
          ? `${data.generated} rascunho(s) gerado(s). Revise antes de aprovar.`
          : data.reason || 'Nenhum rascunho novo gerado.',
      );
      await load();
    } catch (err: unknown) {
      setError(errorText(err, 'Falha ao gerar rascunhos.'));
    } finally {
      setBusy('');
    }
  }

  async function approve(item: ContentItem) {
    const edit = edits[item.id] || { title: item.title, body: item.body };
    setBusy(item.id);
    setMessage('');
    setError('');
    try {
      const res = await api(`/api/admin/acquisition/content/${encodeURIComponent(item.id)}/approve`, {
        method: 'POST',
        body: JSON.stringify(edit),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Falha ao aprovar.');
      setMessage('Conteúdo aprovado. A publicação externa continua dependendo do webhook configurado.');
      await load();
    } catch (err: unknown) {
      setError(errorText(err, 'Falha ao aprovar.'));
    } finally {
      setBusy('');
    }
  }

  async function reject(item: ContentItem) {
    const reason = window.prompt('Motivo da rejeição (opcional):') || '';
    setBusy(item.id);
    setMessage('');
    setError('');
    try {
      const res = await api(`/api/admin/acquisition/content/${encodeURIComponent(item.id)}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Falha ao rejeitar.');
      setMessage('Rascunho rejeitado.');
      await load();
    } catch (err: unknown) {
      setError(errorText(err, 'Falha ao rejeitar.'));
    } finally {
      setBusy('');
    }
  }

  async function publish(item: ContentItem) {
    if (!window.confirm(`Publicar este conteúdo no canal ${CHANNEL_LABEL[item.platform]}?`)) return;
    setBusy(item.id);
    setMessage('');
    setError('');
    try {
      const res = await api(`/api/admin/acquisition/content/${encodeURIComponent(item.id)}/publish`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Falha ao publicar.');
      setMessage('Conteúdo enviado ao webhook de publicação.');
      await load();
    } catch (err: unknown) {
      setError(errorText(err, 'Falha ao publicar.'));
    } finally {
      setBusy('');
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
              <ArrowLeft size={16} /> Voltar ao painel
            </Link>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Aquisição e conteúdo</h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              Fila de divulgação orgânica baseada em páginas reais da Filtra.AI. Nenhum post é publicado sem aprovação humana e sem webhook configurado.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading || Boolean(busy)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
            >
              <RefreshCw size={16} /> Atualizar
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={busy === 'generate'}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-500 bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              <Sparkles size={16} /> {busy === 'generate' ? 'Gerando...' : 'Gerar 2 rascunhos'}
            </button>
          </div>
        </header>

        {message ? <p className="rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p> : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs text-zinc-500">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className={`rounded-full border px-3 py-1 ${overview.ai_configured ? 'border-emerald-800 text-emerald-300' : 'border-amber-800 text-amber-300'}`}>
            IA: {overview.ai_configured ? 'configurada' : 'fallback seguro'}
          </span>
          <span className={`rounded-full border px-3 py-1 ${overview.publish_configured ? 'border-emerald-800 text-emerald-300' : 'border-zinc-700 text-zinc-400'}`}>
            Publicação externa: {overview.publish_configured ? 'configurada' : 'desativada'}
          </span>
          <span className="rounded-full border border-zinc-700 px-3 py-1">Sem cold outreach · sem publicação automática</span>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Aguardando revisão</h2>
            <span className="text-sm text-zinc-500">{pending.length} item(ns)</span>
          </div>
          {loading ? <p className="text-sm text-zinc-400">Carregando...</p> : null}
          {!loading && pending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
              Nenhum rascunho pendente. Use “Gerar 2 rascunhos” para criar uma nova leva.
            </div>
          ) : null}
          {pending.map((item) => {
            const edit = edits[item.id] || { title: item.title, body: item.body };
            const source = String(item.metadata?.source_path || item.source_url || '');
            const flags = item.claim_flags || [];
            return (
              <article key={item.id} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-950 px-3 py-1 text-xs font-medium text-indigo-300">{CHANNEL_LABEL[item.platform]}</span>
                  {source ? (
                    <a
                      href={`https://filtraai.com${source}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                    >
                      {source} <ExternalLink size={12} />
                    </a>
                  ) : null}
                  <span className="text-xs text-zinc-600">{item.campaign_id}</span>
                </div>
                <input
                  value={edit.title}
                  onChange={(e) => setEdits((current) => ({ ...current, [item.id]: { ...edit, title: e.target.value } }))}
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm outline-hidden focus:border-indigo-500"
                  aria-label="Título interno"
                />
                <textarea
                  value={edit.body}
                  onChange={(e) => setEdits((current) => ({ ...current, [item.id]: { ...edit, body: e.target.value } }))}
                  rows={8}
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm leading-relaxed outline-hidden focus:border-indigo-500"
                  aria-label="Texto do post"
                />
                {flags.length ? (
                  <p className="rounded-xl border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
                    Conferir antes de aprovar: {flags.join(', ')}.
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">Nenhum alerta automático de métrica ou promessa. A revisão humana continua obrigatória.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => approve(item)}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <Check size={16} /> Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(item)}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-800 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                  >
                    <Trash2 size={16} /> Rejeitar
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Aprovados para publicação</h2>
            <span className="text-sm text-zinc-500">{approved.length} item(ns)</span>
          </div>
          {approved.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
              Aprove um rascunho para liberar a publicação no webhook.
            </div>
          ) : null}
          {approved.map((item) => (
            <article key={item.id} className="space-y-3 rounded-2xl border border-emerald-900/60 bg-emerald-950/10 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-300">{CHANNEL_LABEL[item.platform]}</span>
                <span className="text-sm text-zinc-300">{item.title}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-400">{item.body}</p>
              <button
                type="button"
                onClick={() => publish(item)}
                disabled={Boolean(busy) || !overview.publish_configured}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                <Send size={16} /> Publicar via webhook
              </button>
              {!overview.publish_configured ? (
                <p className="text-xs text-zinc-500">Configure `ACQUISITION_PUBLISH_ENABLED=true` e `ACQUISITION_PUBLISH_WEBHOOK_URL` para ativar.</p>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
