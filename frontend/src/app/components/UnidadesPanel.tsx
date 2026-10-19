'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { apiFetch } from '../utils/apiFailover';

type Unidade = {
  id: string;
  nome: string;
  endereco?: string | null;
  cidade?: string | null;
};

type Props = {
  empresaRef: string;
  enabled: boolean;
};

function authHeaders(json = true): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  try {
    const t = localStorage.getItem('filtra_token');
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* */
  }
  return h;
}

export function UnidadesPanel({ empresaRef, enabled }: Props) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Unidade[]>([]);
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    if (!enabled) return;
    setLoadError('');
    try {
      const res = await apiFetch(`/api/empresa/${empresaRef}/unidades`, {
        credentials: 'include',
        headers: authHeaders(false),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setLoadError(data.error || t.units_login);
        return;
      }
      if (!res.ok) {
        setLoadError(data.detail || data.error || `Erro ${res.status}`);
        return;
      }
      setItems(data.items || []);
    } catch {
      setLoadError(t.units_load_error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial via API (padrão de montagem)
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaRef, enabled]);

  if (!enabled) return null;

  const add = async () => {
    if (!nome.trim()) {
      setMsg(t.units_required);
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await apiFetch(`/api/empresa/${empresaRef}/unidades`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ nome: nome.trim(), cidade: cidade.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.error || `Erro ${res.status}`);
      }
      setNome('');
      setCidade('');
      setMsg(t.units_added);
      await load();
    } catch (e: any) {
      setMsg(e.message || t.units_load_error);
    } finally {
      setLoading(false);
    }
  };

  const evaluationLink = (id: string) => {
    if (typeof window === 'undefined') return `/avaliacao/${empresaRef}?unidade_id=${encodeURIComponent(id)}`;
    return `${window.location.origin}/avaliacao/${encodeURIComponent(empresaRef)}?unidade_id=${encodeURIComponent(id)}`;
  };

  const copyEvaluationLink = async (id: string) => {
    const link = evaluationLink(id);
    try {
      await navigator.clipboard.writeText(link);
      setMsg('Link da unidade copiado.');
    } catch {
      setMsg(link);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t.units_confirm_remove)) return;
    try {
      const res = await apiFetch(`/api/empresa/${empresaRef}/unidades/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders(false),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.units_remove_error);
      await load();
    } catch (e: any) {
      setMsg(e.message || t.units_load_error);
    }
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">{t.units_title}</p>
        <p className="text-xs text-zinc-500 mt-1">
          {t.units_desc}
        </p>
      </div>

      {loadError && <p className="text-xs text-red-400">{loadError}</p>}

      <ul className="space-y-2">
        {items.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between gap-3 text-sm border border-zinc-800 rounded-xl px-3 py-2"
          >
            <span className="min-w-0">
              <strong className="text-zinc-100">{u.nome}</strong>
              {u.cidade ? <span className="text-zinc-500"> · {u.cidade}</span> : null}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => void copyEvaluationLink(u.id)} className="text-xs text-indigo-400 hover:text-indigo-300">
                Copiar link
              </button>
              <a href={evaluationLink(u.id)} target="_blank" rel="noreferrer" className="text-xs text-zinc-400 hover:text-zinc-200">
                Abrir
              </a>
              <button type="button" onClick={() => remove(u.id)} className="text-xs text-red-400">
                {t.units_remove}
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && !loadError && (
          <li className="text-xs text-zinc-600">{t.units_empty}</li>
        )}
      </ul>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={t.units_name}
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
        <input
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder={t.units_city}
          className="sm:w-40 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
        <button
          type="button"
          disabled={loading}
          onClick={add}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? t.units_saving : t.units_add}
        </button>
      </div>
      {msg && (
        <p
          className={`text-xs ${
            msg.includes('adicionada') ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {msg}
        </p>
      )}
    </section>
  );
}
