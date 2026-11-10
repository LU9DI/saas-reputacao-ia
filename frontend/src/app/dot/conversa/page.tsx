'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../utils/apiFailover';

type ChatMessage = {
  id: string;
  role: 'user' | 'dot';
  text: string;
  createdAt: number;
};

type PendingMessage = {
  id: string;
  idempotencyKey: string;
  text: string;
  createdAt: number;
};

const SESSION_KEY = 'filtra_dot_chat_session_v1';
const TRANSCRIPT_KEY = 'filtra_dot_chat_transcript_v1';
const PENDING_KEY = 'filtra_dot_chat_pending_v1';

function storageGet<T>(key: string, fallback: T): T {
  try {
    const value = sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = localStorage.getItem('filtra_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Cookies remain available when localStorage is unavailable.
  }
  return headers;
}

export default function DotConversationPage() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<PendingMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id = '';
    try {
      id = sessionStorage.getItem(SESSION_KEY) || '';
      if (!id) {
        id = makeId();
        sessionStorage.setItem(SESSION_KEY, id);
      }
    } catch {
      id = makeId();
    }
    setSessionId(id);
    setMessages(storageGet<ChatMessage[]>(TRANSCRIPT_KEY, []));
    setPending(storageGet<PendingMessage | null>(PENDING_KEY, null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  function persistMessages(next: ChatMessage[]) {
    setMessages(next);
    try {
      sessionStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(next.slice(-80)));
    } catch {
      // The current conversation remains usable if browser storage is full.
    }
  }

  function persistPending(next: PendingMessage | null) {
    setPending(next);
    try {
      if (next) sessionStorage.setItem(PENDING_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(PENDING_KEY);
    } catch {
      // The request can still be sent; persistence is best-effort on this device.
    }
  }

  async function sendPending(item: PendingMessage) {
    if (!sessionId || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await apiFetch('/api/dot/chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...authHeaders(),
          // Reused for every retry of this exact logical message.
          'Idempotency-Key': item.idempotencyKey,
          'X-Idempotency-Key': item.idempotencyKey,
        },
        body: JSON.stringify({ message: item.text, session_id: sessionId }),
        deadlineMs: 30_000,
        timeoutMs: 12_000,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok === false) {
        throw new Error(body?.error || `Não foi possível enviar (HTTP ${response.status}).`);
      }
      const answer = typeof body?.message === 'string'
        ? body.message
        : typeof body?.response === 'string'
          ? body.response
          : '';
      if (!answer) throw new Error('A API respondeu sem o texto da resposta. A tentativa foi mantida para reconciliação.');
      persistMessages([
        ...messages.filter((message) => message.id !== item.id),
        { id: item.id, role: 'user', text: item.text, createdAt: item.createdAt },
        { id: makeId(), role: 'dot', text: answer, createdAt: Date.now() },
      ]);
      persistPending(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha de comunicação com o Filtra Dot.');
      // Keep the exact payload and key. Retry must not become a new logical send.
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending || pending || !sessionId) return;
    const item: PendingMessage = {
      id: makeId(),
      idempotencyKey: makeId(),
      text,
      createdAt: Date.now(),
    };
    persistPending(item);
    setDraft('');
    void sendPending(item);
  }

  function discardPending() {
    if (sending) return;
    persistPending(null);
    setError('');
  }

  return (
    <main className="min-h-screen bg-[#050507] text-zinc-100">
      <header className="border-b border-white/10 bg-[#050507]/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <Link href="/dot" className="text-xs text-indigo-300 hover:text-indigo-200">← Centro do Filtra Dot</Link>
            <h1 className="mt-1 text-lg font-semibold">Conversa com o Filtra Dot</h1>
            <p className="text-xs text-zinc-500">Assistente operacional da sua empresa</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400">Sessão protegida</span>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-77px)] max-w-4xl flex-col px-4 py-5 sm:px-6">
        <div className="mb-4 rounded-2xl border border-indigo-400/15 bg-indigo-400/5 p-4 text-sm leading-6 text-zinc-300">
          Faça perguntas sobre sinais, avaliações e decisões da sua operação. O acesso depende da autenticação, do plano da empresa e da habilitação do Filtra Dot na API.
        </div>

        <div className="flex-1 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5" aria-live="polite">
          {!messages.length && !pending && (
            <div className="mx-auto max-w-md py-16 text-center">
              <div className="text-sm font-medium text-zinc-200">Como posso ajudar?</div>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Pergunte sobre tendências, problemas recorrentes ou próximos passos com base nos dados disponíveis para sua empresa.</p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <article className={message.role === 'user'
                ? 'max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-indigo-500/20 px-4 py-3 text-sm leading-6 text-indigo-50'
                : 'max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-zinc-200'}>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{message.role === 'user' ? 'Você' : 'Filtra Dot'}</div>
                {message.text}
              </article>
            </div>
          ))}
          {pending && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100">
              <div className="font-medium">{sending ? 'Enviando mensagem…' : 'Mensagem aguardando confirmação'}</div>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-amber-100/75">{pending.text}</p>
              {!sending && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void sendPending(pending)} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-950">Tentar novamente</button>
                  <button type="button" onClick={discardPending} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300">Descartar tentativa</button>
                </div>
              )}
            </div>
          )}
          {sending && <div className="text-xs text-zinc-500">O Dot está processando sua mensagem…</div>}
          <div ref={bottomRef} />
        </div>

        {error && <div role="alert" className="mt-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">{error}</div>}

        <form onSubmit={submit} className="mt-4 flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          <label className="sr-only" htmlFor="dot-message">Sua mensagem</label>
          <textarea
            id="dot-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={sending || !!pending}
            rows={2}
            maxLength={4000}
            placeholder="Escreva sua pergunta…"
            className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-50"
          />
          <button type="submit" disabled={!draft.trim() || sending || !!pending || !sessionId} className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">Enviar</button>
        </form>
        <p className="mt-2 text-center text-[11px] text-zinc-600">Shift + Enter para nova linha. Uma tentativa pendente deve ser retomada antes de iniciar outra mensagem.</p>
      </section>
    </main>
  );
}
