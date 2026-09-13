'use client';

import { useEffect, useState } from 'react';
import { getEnv } from '../utils/env';

type Canal = 'whatsapp' | 'sms' | 'wechat' | 'email';

type Destinatario = {
  id: string;
  canal: Canal;
  destino: string;
  nome?: string | null;
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

const canais: { value: Canal; label: string; placeholder: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', placeholder: '+55 11 99999-8888' },
  { value: 'sms', label: 'SMS', placeholder: '+55 11 99999-8888' },
  { value: 'wechat', label: 'WeChat', placeholder: 'ID do WeChat' },
  { value: 'email', label: 'E-mail', placeholder: 'nome@empresa.com' },
];

export function RelatorioDestinatariosPanel({ empresaRef }: { empresaRef: string }) {
  const api = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [canal, setCanal] = useState<Canal>('whatsapp');
  const [destino, setDestino] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState(true);
  const [message, setMessage] = useState('');

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api}/api/empresa/${empresaRef}/relatorio-destinatarios`, {
        credentials: 'include',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data.code === 'REPORT_NOT_AVAILABLE') {
        setAvailable(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setAvailable(true);
      setDestinatarios(Array.isArray(data.destinatarios) ? data.destinatarios : []);
    } catch (e: any) {
      setMessage(e.message || 'Não foi possível carregar os destinatários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaRef]);

  const adicionar = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaRef}/relatorio-destinatarios`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ canal, destino, nome }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setDestino('');
      setNome('');
      setMessage('Destinatário adicionado.');
      await carregar();
    } catch (e: any) {
      setMessage(e.message || 'Falha ao adicionar.');
    } finally {
      setSaving(false);
    }
  };

  const remover = async (id: string) => {
    setMessage('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaRef}/relatorio-destinatarios/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setDestinatarios((items) => items.filter((item) => item.id !== id));
      setMessage('Destinatário removido.');
    } catch (e: any) {
      setMessage(e.message || 'Falha ao remover.');
    }
  };

  if (!available || loading) return null;

  const canalAtual = canais.find((item) => item.value === canal) || canais[0];

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Destinatários do relatório mensal</p>
        <p className="text-sm text-zinc-400 mt-1">
          O mesmo relatório pode ser enviado para até 20 destinatários por WhatsApp, SMS, WeChat e e-mail.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr_160px_auto] gap-3">
        <select
          value={canal}
          onChange={(e) => setCanal(e.target.value as Canal)}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
          aria-label="Canal"
        >
          {canais.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <input
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          placeholder={canalAtual.placeholder}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
          aria-label="Destino"
        />
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome (opcional)"
          maxLength={100}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
          aria-label="Nome"
        />
        <button
          type="button"
          onClick={adicionar}
          disabled={saving || !destino.trim()}
          className="px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {saving ? '…' : 'Adicionar'}
        </button>
      </div>

      {destinatarios.length > 0 && (
        <div className="space-y-2">
          {destinatarios.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-zinc-200">
                  {item.nome || item.destino}
                  <span className="ml-2 text-xs text-zinc-500 uppercase">{item.canal}</span>
                </p>
                {item.nome && <p className="text-xs text-zinc-500 break-all">{item.destino}</p>}
              </div>
              <button
                type="button"
                onClick={() => remover(item.id)}
                className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-300 hover:border-red-900"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {message && <p className="text-xs text-zinc-500">{message}</p>}
    </section>
  );
}
