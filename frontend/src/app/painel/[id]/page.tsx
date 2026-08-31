'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  ai_reply: string | null;
  ai_tags: string[];
  createdAt: string;
}

interface PainelData {
  empresa: {
    id: string;
    nome_empresa: string;
    status: string;
    expira_em: string;
    voice_style?: string;
  };
  reviews: Review[];
  metricas: {
    total: number;
    media: number;
    negativas: number;
    positivas: number;
    alerta_crise: boolean;
    crises_24h: number;
  };
  top_tags: { tag: string; count: number }[];
  links?: {
    avaliacao: string;
    painel: string;
    widget: string;
    embed: string;
  };
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 tracking-tight text-sm" aria-label={`${n} de 5`}>
      {'★'.repeat(n)}
      <span className="text-slate-200">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export default function PainelEmpresa() {
  const params = useParams();
  const empresaId = String(params?.id || '');

  const [data, setData] = useState<PainelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const carregar = async () => {
    if (!empresaId) {
      setErro('ID da empresa inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaId}/painel`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
      setData(json);
      setVoiceStyle(json.empresa?.voice_style || '');
    } catch (e: any) {
      setErro(
        e.message === 'Failed to fetch'
          ? 'Não foi possível conectar à API. Confirme se o backend está em http://localhost:5000'
          : e.message || 'Erro ao carregar.'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const salvarVoz = async () => {
    setSalvando(true);
    setMsg('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaId}/voice-style`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_style: voiceStyle }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      setMsg('Estilo salvo.');
    } catch {
      setMsg('Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setMsg('Copiado!');
      setTimeout(() => setMsg(''), 2000);
    } catch {
      setMsg('Não foi possível copiar.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Carregando painel…
      </div>
    );
  }

  if (erro || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-slate-600 max-w-sm">{erro || 'Painel indisponível.'}</p>
        <p className="text-xs text-slate-400 font-mono break-all">ID: {empresaId || '(vazio)'}</p>
        <button
          type="button"
          onClick={carregar}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const { empresa, reviews, metricas, top_tags, links } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="max-w-3xl mx-auto px-5 py-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-600 mb-1">
              Painel
            </p>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              {empresa.nome_empresa}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Trial até {new Date(empresa.expira_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button
            type="button"
            onClick={carregar}
            className="text-sm text-slate-500 hover:text-slate-800 shrink-0"
          >
            Atualizar
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {msg && (
          <p className="text-sm text-center text-emerald-600 font-medium">{msg}</p>
        )}

        {metricas.alerta_crise && (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-800">
            <strong>Alerta:</strong> {metricas.crises_24h} notas baixas (1–2★) nas últimas 24h.
          </div>
        )}

        {/* Métricas */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: metricas.total },
            { label: 'Média', value: metricas.total ? metricas.media.toFixed(1) : '—' },
            { label: 'Positivas', value: metricas.positivas },
            { label: 'Negativas', value: metricas.negativas },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-white rounded-2xl border border-slate-100 shadow-soft px-4 py-4 text-center"
            >
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">{m.value}</p>
              <p className="text-xs text-slate-500 mt-1">{m.label}</p>
            </div>
          ))}
        </section>

        {/* Links úteis */}
        {links && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Links</h2>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-slate-500 w-24 shrink-0">Avaliação</span>
                <a href={links.avaliacao} className="text-indigo-600 hover:underline break-all">
                  {links.avaliacao}
                </a>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-slate-500 w-24 shrink-0">Widget</span>
                <a href={links.widget} className="text-indigo-600 hover:underline break-all">
                  {links.widget}
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Código para o site</p>
              <pre className="text-[11px] leading-relaxed bg-slate-900 text-slate-100 rounded-xl p-3 overflow-x-auto">
                {links.embed}
              </pre>
              <button
                type="button"
                onClick={() => copiar(links.embed)}
                className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
              >
                Copiar código
              </button>
            </div>
          </section>
        )}

        {/* Voz do dono */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Estilo de resposta (IA)</h2>
          <p className="text-sm text-slate-500">
            Cole exemplos de como você responde clientes. A IA usa esse tom nas sugestões.
          </p>
          <textarea
            value={voiceStyle}
            onChange={(e) => setVoiceStyle(e.target.value.slice(0, 3000))}
            rows={4}
            placeholder="Ex.: Obrigado pelo feedback. Lamento o ocorrido e já estamos resolvendo…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={salvarVoz}
            disabled={salvando}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </section>

        {/* Tags */}
        {top_tags.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Temas</h2>
            <div className="flex flex-wrap gap-2">
              {top_tags.map(({ tag, count }) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full"
                >
                  {tag}
                  <span className="text-slate-400">{count}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Avaliações</h2>
          </div>
          {reviews.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500 text-center">
              Nenhuma avaliação ainda. Compartilhe o link ou o QR Code.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <li key={r.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Stars n={r.rating} />
                    <time className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleString('pt-BR')}
                    </time>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{r.name}</p>
                  {r.comment ? (
                    <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Sem comentário</p>
                  )}
                  {r.ai_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.ai_tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.ai_reply && (
                    <div className="mt-2 rounded-xl bg-indigo-50/80 border border-indigo-100 px-3 py-2.5">
                      <p className="text-[11px] font-medium text-indigo-600 mb-1">Sugestão da IA</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{r.ai_reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
