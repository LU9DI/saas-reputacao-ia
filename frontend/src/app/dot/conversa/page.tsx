'use client';

/**
 * Filtra Dot — conversa do cliente (`/dot/conversa`).
 *
 * Separado do painel administrativo `/dot`. Cada mensagem lógica recebe uma
 * chave de idempotência própria, persistida ANTES do envio junto com o payload
 * exato. Retry, failover e recarregamento da página reutilizam a mesma chave e
 * o mesmo corpo — nunca geram uma chave nova para "contornar" um erro.
 */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AlertTriangle, Bot, Loader2, RotateCcw, Send, ShieldAlert, Trash2 } from 'lucide-react';
import { apiFetch } from '../../utils/apiFailover';
import { readFiltraToken } from '../../utils/persistToken';
import { BrandMark } from '../../components/BrandMark';

const SESSION_KEY = 'filtra_dot_session_id';
const HISTORY_KEY = 'filtra_dot_conversa_history_v1';
const OUTBOX_KEY = 'filtra_dot_conversa_outbox_v1';
const MAX_HISTORY = 60;

type StorageKeys = { session: string; history: string; outbox: string };

/** Fallback curto apenas para navegadores sem Web Crypto; não é controle de autorização. */
function fallbackScopeHash(value: string): string {
  let first = 2166136261;
  let second = 2246822519;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ (code + index), 3266489917);
  }
  return `${(first >>> 0).toString(16)}${(second >>> 0).toString(16)}`;
}

async function digestScope(value: string): Promise<string> {
  try {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch {
    // Web Crypto pode não existir em contextos legados/inseguros. A separação
    // local continua funcional, mas a autorização real permanece no backend.
    return fallbackScopeHash(value);
  }
}

/**
 * Escopo local derivado da identidade autenticada (empresa + usuário do JWT
 * `filtra_token`). SHA-256 evita colisões práticas entre contas; o escopo é
 * apenas isolamento de armazenamento, nunca uma fronteira de autorização.
 */
async function tokenScope(token: string | null): Promise<string> {
  if (!token) return 'anon';
  let identity = `token:${token}`;
  try {
    const segment = token.split('.')[1];
    if (segment) {
      const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const claims = JSON.parse(atob(padded)) as { empresa_id?: unknown; id?: unknown };
      const empresa = String(claims?.empresa_id ?? '').trim();
      const user = String(claims?.id ?? '').trim();
      if (empresa || user) identity = `identity:${JSON.stringify([empresa, user])}`;
    }
  } catch {
    /* Token opaco ou payload indisponível: usa o próprio token como identidade. */
  }
  return `scope-${await digestScope(identity)}`;
}

function storageKeys(scope: string): StorageKeys {
  return {
    session: `${SESSION_KEY}:${scope}`,
    history: `${HISTORY_KEY}:${scope}`,
    outbox: `${OUTBOX_KEY}:${scope}`,
  };
}

type ChatMessage = {
  id: string;
  role: 'user' | 'dot';
  text: string;
  at: number;
  provider?: string | null;
  tokensUsed?: number | null;
  latencyMs?: number | null;
};

type OutboxStatus = 'sending' | 'retryable' | 'ambiguous' | 'failed';

type Outbox = {
  key: string;
  payload: { message: string; session_id: string };
  status: OutboxStatus;
  code?: string;
  detail?: string;
  createdAt: number;
};

type AccessState = 'checking' | 'allowed' | 'denied' | 'expired';

type Banner = { tone: 'error' | 'warning' | 'info'; text: string } | null;

/** localStorage pode conter JSON antigo/corrompido: validar evita quebrar a tela. */
function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ChatMessage>;
  return (
    typeof item.id === 'string' &&
    (item.role === 'user' || item.role === 'dot') &&
    typeof item.text === 'string' &&
    typeof item.at === 'number'
  );
}

function isOutbox(value: unknown): value is Outbox {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Outbox>;
  return (
    typeof item.key === 'string' &&
    item.key.length > 0 &&
    typeof item.payload === 'object' &&
    item.payload !== null &&
    typeof item.payload.message === 'string' &&
    typeof item.payload.session_id === 'string' &&
    (item.status === 'sending' ||
      item.status === 'retryable' ||
      item.status === 'ambiguous' ||
      item.status === 'failed') &&
    typeof item.createdAt === 'number'
  );
}

function newUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback para navegadores antigos (não é usado em produção moderna).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado / cota */
  }
}

function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function ensureSessionId(key: string): string {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = newUuid();
    localStorage.setItem(key, created);
    return created;
  } catch {
    return newUuid();
  }
}

function resetSessionId(key: string): string {
  const created = newUuid();
  try {
    localStorage.setItem(key, created);
  } catch {
    /* modo privado */
  }
  return created;
}

function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Dot-Csrf': '1',
  };
}

function formatTime(at: number): string {
  try {
    return new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

type DotStatus = {
  access?: boolean;
  enabled?: boolean;
  plan?: string | null;
  plan_label?: string | null;
  plan_identified?: boolean;
  error?: string;
};

type DotChatBody = {
  ok?: boolean;
  message?: string;
  provider?: string | null;
  tokens_used?: number;
  latency_ms?: number;
  token_warning?: boolean;
  code?: string;
  error?: string;
};

type Classified =
  | { kind: 'expired' }
  | { kind: 'in_progress' }
  | { kind: 'ambiguous' }
  | { kind: 'result_expired' }
  | { kind: 'key_reused' }
  | { kind: 'budget' }
  | { kind: 'validation' }
  | { kind: 'retryable'; detail: string };

function classify(status: number, body: DotChatBody): Classified {
  const code = String(body?.code || '');
  if (status === 401) return { kind: 'expired' };
  if (status === 403) return { kind: 'validation' };
  if (code === 'DOT_REQUEST_IN_PROGRESS') return { kind: 'in_progress' };
  if (code === 'DOT_REQUEST_AMBIGUOUS') return { kind: 'ambiguous' };
  if (code === 'DOT_IDEMPOTENCY_RESULT_EXPIRED') return { kind: 'result_expired' };
  if (code === 'DOT_IDEMPOTENCY_KEY_REUSED') return { kind: 'key_reused' };
  if (code === 'DOT_TOKEN_LIMIT') return { kind: 'budget' };
  if (
    code === 'DOT_IDEMPOTENCY_KEY_REQUIRED' ||
    code === 'DOT_IDEMPOTENCY_KEY_INVALID' ||
    status === 400
  ) {
    return { kind: 'validation' };
  }
  return {
    kind: 'retryable',
    detail: String(body?.error || `Falha temporária (HTTP ${status}).`),
  };
}

const panel = 'rounded-2xl border border-white/10 bg-white/[0.03]';
const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50';
const ghostButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50';

export default function DotConversaPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [outbox, setOutbox] = useState<Outbox | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [accessState, setAccessState] = useState<AccessState>('checking');
  const [accessDetail, setAccessDetail] = useState('');
  const [banner, setBanner] = useState<Banner>(null);
  const [status, setStatus] = useState<DotStatus | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sessionIdRef = useRef<string>('');
  const storageRef = useRef<StorageKeys>(storageKeys('anon'));
  const tokenRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const persistMessages = useCallback((next: ChatMessage[]) => {
    const capped = next.slice(-MAX_HISTORY);
    setMessages(capped);
    writeJson(storageRef.current.history, capped);
  }, []);

  const persistOutbox = useCallback((next: Outbox | null) => {
    setOutbox(next);
    if (next) writeJson(storageRef.current.outbox, next);
    else removeKey(storageRef.current.outbox);
  }, []);

  const loadAccess = useCallback(async () => {
    const token = readFiltraToken();
    tokenRef.current = token;
    if (!token) {
      setAccessState('expired');
      setAccessDetail('Sua sessão não foi encontrada. Entre novamente para conversar com o Dot.');
      return;
    }
    try {
      const response = await apiFetch('/api/dot/status', {
        method: 'GET',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        timeoutMs: 12_000,
      });
      const body = (await response.json().catch(() => ({}))) as DotStatus;
      if (response.status === 401) {
        setAccessState('expired');
        setAccessDetail('Sua sessão expirou. Entre novamente para continuar.');
        return;
      }
      if (response.status === 403) {
        setAccessState('denied');
        setAccessDetail(body?.error || 'Acesso ao Filtra Dot não autorizado para esta conta.');
        return;
      }
      if (!response.ok) {
        setAccessState('denied');
        setAccessDetail(body?.error || 'Não foi possível verificar o acesso ao Filtra Dot.');
        return;
      }
      setStatus(body);
      if (body?.access && body?.enabled === false) {
        setAccessState('denied');
        setAccessDetail('O Filtra Dot ainda não está habilitado para esta empresa.');
        return;
      }
      if (!body?.access) {
        setAccessState('denied');
        setAccessDetail(
          body?.plan_identified
            ? 'O plano da sua empresa não inclui o Filtra Dot (disponível nos planos Rei e Corporativo).'
            : 'O plano da sua empresa ainda não foi identificado. O acesso ao Dot permanece bloqueado.',
        );
        return;
      }
      setAccessState('allowed');
      setAccessDetail('');
    } catch {
      setAccessState('denied');
      setAccessDetail('Não foi possível falar com a API do Filtra Dot. Tente novamente em instantes.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      // SHA-256 é assíncrono; só hidratar depois de resolver a identidade para
      // não mostrar por um instante o histórico de outra conta.
      const keys = storageKeys(await tokenScope(readFiltraToken()));
      if (cancelled) return;
      storageRef.current = keys;
      sessionIdRef.current = ensureSessionId(keys.session);
      /* eslint-disable react-hooks/set-state-in-effect -- hidratação única do localStorage; não há estado derivado em render */
      const storedMessages = readJson<unknown>(keys.history, []);
      setMessages(Array.isArray(storedMessages) ? storedMessages.filter(isChatMessage) : []);
      const storedOutbox = readJson<unknown>(keys.outbox, null);
      const restored = isOutbox(storedOutbox) ? storedOutbox : null;
      if (storedOutbox !== null && restored === null) {
        // Formato desconhecido: não pode ser reenviado com segurança.
        removeKey(keys.outbox);
      }
      if (restored && restored.status === 'sending') {
        // O envio foi interrompido por reload/fechamento da aba. A chave e o
        // payload são preservados: retomar é seguro e NÃO cria uma nova chave.
        const interrupted: Outbox = {
          ...restored,
          status: 'retryable',
          code: 'INTERRUPTED',
          detail: 'Envio interrompido antes da confirmação.',
        };
        setOutbox(interrupted);
        writeJson(keys.outbox, interrupted);
        setBanner({
          tone: 'info',
          text: 'Havia uma mensagem pendente quando a página foi recarregada. Use "Tentar novamente" para retomá-la com a mesma chave.',
        });
      } else {
        setOutbox(restored);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
      void loadAccess();
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [loadAccess]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, outbox, busy]);

  const send = useCallback(
    async (pending: Outbox) => {
      const token = tokenRef.current || readFiltraToken();
      if (!token) {
        setAccessState('expired');
        setAccessDetail('Sua sessão expirou. Entre novamente para continuar.');
        return;
      }
      tokenRef.current = token;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setBusy(true);
      setBanner(null);
      const sending: Outbox = { ...pending, status: 'sending', code: undefined, detail: undefined };
      persistOutbox(sending);

      try {
        const response = await apiFetch('/api/dot/chat', {
          method: 'POST',
          credentials: 'include',
          headers: { ...authHeaders(token), 'X-Idempotency-Key': pending.key },
          body: JSON.stringify(pending.payload),
          // Chat é uma operação financeira: não repetir em outra base,
          // pois ela pode apontar para outro banco/ledger. A chave idempotente
          // protege retries no backend canônico; failover entre bancos não é seguro.
          noFailover: true,
          timeoutMs: 45_000,
          deadlineMs: 60_000,
        });
        const body = (await response.json().catch(() => ({}))) as DotChatBody;

        if (response.ok && body?.ok) {
          const now = Date.now();
          const next: ChatMessage[] = [
            ...messages,
            { id: newUuid(), role: 'user', text: pending.payload.message, at: pending.createdAt },
            {
              id: newUuid(),
              role: 'dot',
              text: String(body.message || ''),
              at: now,
              provider: body.provider ?? null,
              tokensUsed: typeof body.tokens_used === 'number' ? body.tokens_used : null,
              latencyMs: typeof body.latency_ms === 'number' ? body.latency_ms : null,
            },
          ];
          persistMessages(next);
          persistOutbox(null);
          setInput((current) => (current.trim() === pending.payload.message.trim() ? '' : current));
          if (body.token_warning) {
            setBanner({
              tone: 'warning',
              text: 'O orçamento de IA do Dot está próximo do limite do seu plano.',
            });
          }
          return;
        }

        const result = classify(response.status, body);
        if (result.kind === 'expired') {
          persistOutbox({ ...pending, status: 'retryable', code: 'SESSION_EXPIRED' });
          setAccessState('expired');
          setAccessDetail('Sua sessão expirou. Entre novamente para continuar.');
          return;
        }
        if (result.kind === 'in_progress') {
          persistOutbox({ ...pending, status: 'retryable', code: 'DOT_REQUEST_IN_PROGRESS' });
          setBanner({
            tone: 'info',
            text: 'O Dot ainda está processando esta mensagem. Aguarde alguns segundos e tente novamente — a mesma chave será reutilizada.',
          });
          return;
        }
        if (result.kind === 'ambiguous') {
          persistOutbox({ ...pending, status: 'ambiguous', code: 'DOT_REQUEST_AMBIGUOUS' });
          setBanner({
            tone: 'warning',
            text: 'O resultado desta mensagem é incerto e exige reconciliação. Ela não será reenviada automaticamente.',
          });
          return;
        }
        if (result.kind === 'result_expired') {
          persistOutbox({ ...pending, status: 'failed', code: 'DOT_IDEMPOTENCY_RESULT_EXPIRED' });
          setBanner({
            tone: 'error',
            text: 'O prazo para recuperar a resposta expirou. Esta mensagem permanece bloqueada no servidor para evitar uma segunda execução; não a reenvie com uma nova chave.',
          });
          return;
        }
        if (result.kind === 'key_reused') {
          persistOutbox({ ...pending, status: 'failed', code: 'DOT_IDEMPOTENCY_KEY_REUSED' });
          setBanner({
            tone: 'error',
            text: 'Esta chave já foi usada com outro conteúdo. Descarte a mensagem pendente para escrever uma nova.',
          });
          return;
        }
        if (result.kind === 'budget') {
          // Recusa definitiva antes do provedor: seguro começar uma nova mensagem.
          persistOutbox(null);
          setBanner({
            tone: 'warning',
            text: String(body?.error || 'O orçamento de IA do plano para este período foi atingido.'),
          });
          return;
        }
        if (result.kind === 'validation') {
          persistOutbox(null);
          setBanner({ tone: 'error', text: String(body?.error || 'A mensagem não pôde ser validada.') });
          return;
        }
        const detail = result.kind === 'retryable' ? result.detail : 'Falha temporária.';
        persistOutbox({ ...pending, status: 'retryable', code: 'RETRYABLE', detail });
        setBanner({
          tone: 'error',
          text: 'Não foi possível confirmar a resposta. Tente novamente com a mesma chave — nada será cobrado duas vezes.',
        });
      } catch {
        persistOutbox({ ...pending, status: 'retryable', code: 'NETWORK', detail: 'Falha de rede.' });
        setBanner({
          tone: 'error',
          text: 'A conexão falhou antes de confirmar a resposta. Tente novamente; a mesma chave será reutilizada.',
        });
      } finally {
        inFlightRef.current = false;
        setBusy(false);
      }
    },
    [messages, persistMessages, persistOutbox],
  );

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || busy || inFlightRef.current) return;
    if (outbox) {
      setBanner({
        tone: 'warning',
        text: 'Resolva a mensagem pendente antes de enviar uma nova.',
      });
      return;
    }
    const pending: Outbox = {
      key: newUuid(),
      payload: {
        message: text,
        session_id: sessionIdRef.current || ensureSessionId(storageRef.current.session),
      },
      status: 'sending',
      createdAt: Date.now(),
    };
    // Persistir chave + payload ANTES do envio: um reload ou retry mantém
    // exatamente a mesma dupla (chave, corpo).
    persistOutbox(pending);
    void send(pending);
  }, [busy, input, outbox, persistOutbox, send]);

  const retryPending = useCallback(() => {
    // Somente falhas transitórias podem ser retomadas com a MESMA chave. Uma
    // chave reutilizada com outro conteúdo é recusa definitiva: reenviar só
    // repetiria o erro; o caminho é descartar e escrever uma nova mensagem.
    if (!outbox || busy || outbox.status !== 'retryable') return;
    void send(outbox);
  }, [busy, outbox, send]);

  const discardPending = useCallback(() => {
    if (busy) return;
    if (outbox?.status === 'ambiguous') {
      const confirmed =
        typeof window !== 'undefined' &&
        window.confirm(
          'Esta mensagem pode ter sido processada e está aguardando reconciliação. Descartar remove apenas o aviso local; o registro no servidor permanece. Continuar?',
        );
      if (!confirmed) return;
    }
    persistOutbox(null);
    setBanner({
      tone: 'info',
      text: 'Mensagem pendente descartada. A próxima mensagem receberá uma nova chave.',
    });
    if (outbox?.payload.message) setInput(outbox.payload.message);
  }, [busy, outbox, persistOutbox]);

  const newConversation = useCallback(() => {
    if (busy) return;
    if (outbox) {
      setBanner({
        tone: 'warning',
        text: 'Resolva a mensagem pendente antes de iniciar uma nova conversa.',
      });
      return;
    }
    persistMessages([]);
    persistOutbox(null);
    setBanner(null);
    setInput('');
    sessionIdRef.current = resetSessionId(storageRef.current.session);
  }, [busy, outbox, persistMessages, persistOutbox]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  if (accessState === 'checking') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-black px-6 text-zinc-200">
        <div className="flex items-center gap-3 text-sm" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Verificando o acesso ao Filtra Dot…
        </div>
      </main>
    );
  }

  if (accessState === 'expired' || accessState === 'denied') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-black px-6 py-12 text-zinc-100">
        <section className={`${panel} w-full max-w-lg p-6`} aria-labelledby="dot-access-title">
          <BrandMark size="sm" href="/" subtitle={null} />
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.26em] text-zinc-400">
            Filtra Dot
          </p>
          <h1 id="dot-access-title" className="mt-2 flex items-center gap-2 text-xl font-semibold">
            <ShieldAlert className="h-5 w-5 text-amber-400" aria-hidden="true" />
            {accessState === 'expired' ? 'Sessão expirada' : 'Filtra Dot indisponível'}
          </h1>
          <p className="mt-3 text-sm text-zinc-300">{accessDetail}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {accessState === 'denied' && !status ? (
              <>
                {/* Falha de rede/API não é sessão expirada: permitir nova checagem. */}
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => {
                    setAccessState('checking');
                    void loadAccess();
                  }}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Tentar novamente
                </button>
                <Link href="/" className={ghostButton}>
                  Voltar ao site
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className={primaryButton}>
                  Entrar novamente
                </Link>
                <Link href="/" className={ghostButton}>
                  Voltar ao site
                </Link>
              </>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-black px-3 py-4 text-zinc-100 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandMark size="sm" href="/" subtitle={null} />
          <nav aria-label="Navegação do Filtra Dot" className="flex items-center gap-2">
            {status?.plan_label ? (
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                Plano {status.plan_label}
              </span>
            ) : null}
            <Link href="/dot" className={ghostButton}>
              Administração
            </Link>
          </nav>
        </header>

        <section
          className={`${panel} flex min-h-0 flex-1 flex-col overflow-hidden`}
          aria-labelledby="dot-conversa-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div>
              <h1 id="dot-conversa-title" className="flex items-center gap-2 text-base font-semibold">
                <Bot className="h-4 w-4 text-brand-500" aria-hidden="true" />
                Conversa com o Filtra Dot
              </h1>
              <p className="mt-0.5 text-xs text-zinc-400">
                Cada mensagem é protegida contra cobrança duplicada.
              </p>
            </div>
            <button
              type="button"
              onClick={newConversation}
              className={ghostButton}
              disabled={busy || Boolean(outbox)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Nova conversa
            </button>
          </div>

          {banner ? (
            <div
              role={banner.tone === 'error' ? 'alert' : 'status'}
              className={`mx-4 mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                banner.tone === 'error'
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : banner.tone === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                    : 'border-sky-500/30 bg-sky-500/10 text-sky-100'
              }`}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{banner.text}</span>
            </div>
          ) : null}

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={busy}
            className="min-h-[16rem] flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && !outbox ? (
              <p className="mx-auto mt-8 max-w-md text-center text-sm text-zinc-400">
                Pergunte sobre reputação, avaliações, tendências ou próximos passos. O Dot usa os dados
                verificados da sua empresa.
              </p>
            ) : null}

            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'border border-white/10 bg-white/[0.04] text-zinc-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <p
                    className={`mt-1.5 text-[10px] ${
                      message.role === 'user' ? 'text-white' : 'text-zinc-400'
                    }`}
                  >
                    {formatTime(message.at)}
                    {message.role === 'dot' && message.provider ? ` · ${message.provider}` : ''}
                    {message.role === 'dot' && typeof message.tokensUsed === 'number'
                      ? ` · ${message.tokensUsed} tokens`
                      : ''}
                  </p>
                </div>
              </article>
            ))}

            {outbox ? (
              <article className="flex justify-end" aria-label="Mensagem pendente">
                <div className="max-w-[85%] rounded-2xl bg-brand-600/80 px-4 py-2.5 text-sm text-white">
                  <p className="whitespace-pre-wrap break-words">{outbox.payload.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    {outbox.status === 'sending' ? (
                      <span className="inline-flex items-center gap-1.5" role="status" aria-live="polite">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        Enviando…
                      </span>
                    ) : outbox.status === 'ambiguous' ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-100">
                        <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                        Resultado incerto — não reenviado
                      </span>
                    ) : outbox.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1.5 text-red-100">
                        <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                        Bloqueada — não será reenviada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-white">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        Não confirmada
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ) : null}

            {busy && !outbox ? (
              <p className="flex items-center gap-2 text-xs text-zinc-400" role="status" aria-live="polite">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                O Dot está pensando…
              </p>
            ) : null}
          </div>

          {outbox && outbox.status !== 'sending' ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3">
              {outbox.status === 'ambiguous' ? (
                <p className="text-xs text-amber-200">
                  Esta mensagem não pode ser reenviada automaticamente. Aguarde a reconciliação ou
                  descarte-a explicitamente.
                </p>
              ) : outbox.status === 'failed' ? (
                <p className="text-xs text-red-200">
                  Esta mensagem foi bloqueada porque a chave já foi usada com outro conteúdo.
                  Descarte-a para escrever uma nova mensagem.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={retryPending}
                  className={primaryButton}
                  disabled={busy}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Tentar novamente
                </button>
              )}
              <button
                type="button"
                onClick={discardPending}
                className={ghostButton}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Descartar pendente
              </button>
            </div>
          ) : null}

          <form
            className="border-t border-white/10 px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label htmlFor="dot-message" className="sr-only">
              Mensagem para o Filtra Dot
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="dot-message"
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                maxLength={4000}
                placeholder="Pergunte ao Dot sobre a reputação da sua empresa…"
                className="max-h-40 min-h-[2.75rem] flex-1 resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
                aria-describedby="dot-composer-hint"
                disabled={busy || Boolean(outbox)}
              />
              <button
                type="submit"
                className={primaryButton}
                disabled={busy || !input.trim() || Boolean(outbox)}
                aria-label="Enviar mensagem"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </div>
            <p id="dot-composer-hint" className="mt-2 text-[11px] text-zinc-400">
              Enter envia · Shift+Enter quebra linha · {input.length}/4000
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
