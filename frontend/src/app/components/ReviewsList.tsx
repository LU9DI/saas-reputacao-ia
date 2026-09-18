'use client';

import { useState } from 'react';
import { apiFetch } from '../utils/apiFailover';

export type ReviewItem = {
  id: number;
  name: string;
  rating: number;
  comment: string;
  ai_reply: string | null;
  is_test?: boolean;
  client_whatsapp?: string | null;
  client_whatsapp_url?: string | null;
  client_whatsapp_anon?: boolean;
  treated?: boolean;
};

type Props = {
  reviews: ReviewItem[];
  showCopiar?: boolean;
  showTratar?: boolean;
  apiBase: string;
  authHeaders: (json?: boolean) => HeadersInit;
  onRefresh: () => Promise<void> | void;
};

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-[13px]" aria-hidden>
      {'★'.repeat(Math.min(5, Math.max(0, n)))}
      <span className="text-zinc-700">{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

const card = 'bg-zinc-900 border border-zinc-800 rounded-2xl';

export function ReviewsList({
  reviews,
  showCopiar = true,
  showTratar = true,
  apiBase,
  authHeaders,
  onRefresh,
}: Props) {
  const criticas = (reviews || []).filter((r) => r.rating <= 3 && !r.is_test);
  const [drafts, setDrafts] = useState<Record<number, string>>(() => {
    const d: Record<number, string> = {};
    for (const r of criticas) {
      d[r.id] =
        r.ai_reply ||
        `Olá${r.name && r.name !== 'Anônimo' ? ` ${r.name}` : ''}, obrigado pelo feedback. Vamos analisar e retornar o mais breve possível.`;
    }
    return d;
  });
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [tratandoId, setTratandoId] = useState<number | null>(null);

  const marcarCopiado = (key: string) => {
    setCopiadoId(key);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const marcarTratada = async (id: number, undo = false) => {
    setTratandoId(id);
    try {
      const res = await fetch(`${apiBase}/api/reviews/${id}/tratar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ undo }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Falha ao atualizar');
      await onRefresh();
    } catch (e: any) {
      alert(e.message || 'Erro ao marcar como tratada');
    } finally {
      setTratandoId(null);
    }
  };

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="px-6 py-5 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-200">Feedbacks privados</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Resposta da IA, botão copiar e WhatsApp do cliente — marque como tratada após responder
        </p>
      </div>
      {criticas.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm text-zinc-500">
          Nenhuma crítica no momento. Avaliações 1–3★ aparecem aqui.
        </div>
      ) : (
        <ul>
          {criticas.map((r, i) => {
            const keyCopy = `copy-${r.id}`;
            const keyWa = `wa-${r.id}`;
            const waCliente = r.client_whatsapp_url;
            const draft =
              drafts[r.id] ??
              r.ai_reply ??
              `Olá${r.name && r.name !== 'Anônimo' ? ` ${r.name}` : ''}, obrigado pelo feedback.`;
            return (
              <li
                key={r.id}
                className={`px-6 py-6 ${i < criticas.length - 1 ? 'border-b border-zinc-800' : ''} ${
                  r.treated ? 'opacity-75' : ''
                }`}
              >
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-zinc-200">{r.name}</span>
                  <Stars n={r.rating} />
                  {r.treated && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Tratada
                    </span>
                  )}
                </div>
                {r.comment && <p className="text-sm text-zinc-400 whitespace-pre-wrap">{r.comment}</p>}

                <div className="mt-3 pl-3 border-l-2 border-indigo-500/40 space-y-2">
                  <p className="text-[11px] uppercase text-zinc-500">
                    {r.ai_reply ? 'Resposta IA (editável)' : 'Resposta sugerida (editável)'}
                  </p>
                  <textarea
                    value={draft}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {showCopiar && (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copiarTexto(draft);
                          if (ok) marcarCopiado(keyCopy);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500"
                      >
                        {copiadoId === keyCopy ? 'Copiado!' : 'Copiar resposta'}
                      </button>
                    )}

                    {waCliente ? (
                      <>
                        <a
                          href={
                            draft
                              ? `${waCliente}${waCliente.includes('?') ? '&' : '?'}text=${encodeURIComponent(draft)}`
                              : waCliente
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500"
                        >
                          WhatsApp do cliente
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await copiarTexto(r.client_whatsapp || '');
                            if (ok) marcarCopiado(keyWa);
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700"
                        >
                          {copiadoId === keyWa ? 'Número copiado!' : 'Copiar número'}
                        </button>
                        <span className="text-xs text-zinc-500 font-mono">{r.client_whatsapp}</span>
                      </>
                    ) : r.client_whatsapp_anon ? (
                      <span className="text-xs text-zinc-500">WhatsApp anonimizado (LGPD)</span>
                    ) : (
                      <span className="text-xs text-amber-600/80">
                        WhatsApp do cliente não informado neste feedback
                      </span>
                    )}

                    {showTratar && (
                      <button
                        type="button"
                        disabled={tratandoId === r.id}
                        onClick={() => marcarTratada(r.id, Boolean(r.treated))}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${
                          r.treated
                            ? 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                            : 'bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700'
                        } disabled:opacity-50`}
                      >
                        {tratandoId === r.id
                          ? '…'
                          : r.treated
                            ? 'Desfazer tratada'
                            : 'Marcar como tratada'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
