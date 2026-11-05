/**
 * Política de mensuração do GA4 no frontend público.
 *
 * Este arquivo é puro (sem imports, sem DOM) de propósito: é a única fonte de
 * verdade sobre (a) quais caminhos podem gerar `page_view`, (b) quais eventos
 * existem, (c) quais parâmetros cada evento aceita e (d) quais valores nunca
 * podem sair do navegador. Assim ele pode ser testado direto com `node --test`.
 *
 * Regras de privacidade aplicadas aqui:
 * - nenhum parâmetro fora da allowlist do evento é enviado;
 * - valores que parecem e-mail, telefone, token, CPF/CNPJ, UUID ou hash são
 *   descartados;
 * - páginas administrativas/autenticadas não geram `page_view` nem eventos
 *   livres (apenas os eventos explicitamente liberados, sem identificadores).
 */

/** Hosts canônicos que podem enviar dados. Qualquer outro host fica silencioso. */
export const CANONICAL_HOSTS: readonly string[] = ['filtraai.com', 'www.filtraai.com'];

/** Host canônico usado em `page_location`. `www` é redirecionado para o apex. */
export const CANONICAL_ORIGIN = 'https://filtraai.com';

/** Prefixos de caminho que nunca geram `page_view`. */
export const PAGE_VIEW_EXCLUDED_PREFIXES: readonly string[] = [
  '/admin',
  '/painel',
  '/dot',
  '/login',
  '/recuperar-senha',
  '/pagamento-ok',
  '/avaliacao',
  '/widget',
  '/api',
  '/preview',
];

/**
 * Prefixos de caminho tratados como área privada: nenhum evento é enviado
 * a partir deles, exceto os liberados em `PRIVATE_PAGES_ALLOWED_EVENTS`.
 */
export const PRIVATE_PATH_PREFIXES: readonly string[] = [
  '/admin',
  '/painel',
  '/dot',
  '/avaliacao',
  '/widget',
  '/api',
  '/login',
  '/recuperar-senha',
  '/pagamento-ok',
];

/** Eventos permitidos em área privada: nome fixo e parâmetros sem identificadores. */
export const PRIVATE_PAGES_ALLOWED_EVENTS: readonly string[] = [
  'login',
  'sign_up',
  'purchase',
  'report_generated',
  'cta_click',
];

export type Ga4ParamType = 'string' | 'number' | 'boolean';

export interface Ga4EventSpec {
  /** O que o evento mede. */
  readonly description: string;
  /** Se deve ser marcado como conversão no GA4 (evento-chave). */
  readonly conversion: boolean;
  /** Allowlist de parâmetros. Qualquer outro parâmetro é descartado. */
  readonly params: Readonly<Record<string, Ga4ParamType>>;
}

/**
 * Catálogo canônico de eventos. Nomes seguem a nomenclatura recomendada do GA4
 * (`sign_up`, `login`, `generate_lead`, `purchase`, `page_view`) para não
 * fragmentar relatórios.
 */
export const GA4_EVENTS: Readonly<Record<string, Ga4EventSpec>> = {
  page_view: {
    description: 'Visualização de página em rota pública (SPA incl.).',
    conversion: false,
    params: {}, // página é definida internamente (page_location/page_path)
  },
  sign_up: {
    description: 'Conta de trial criada com sucesso (resposta OK do backend).',
    conversion: true,
    params: { method: 'string', plan: 'string' },
  },
  login: {
    description: 'Login concluído. Nunca envia credenciais, e-mail ou token.',
    conversion: false,
    params: { method: 'string' },
  },
  generate_lead: {
    description: 'Lead identificado (e-mail/consentimento registrado no backend).',
    conversion: true,
    params: { form: 'string', locale: 'string' },
  },
  form_submit: {
    description: 'Formulário público concluído com resposta OK do backend.',
    conversion: false,
    params: { form: 'string', locale: 'string' },
  },
  purchase: {
    description: 'Pagamento confirmado por status aprovado do provedor.',
    conversion: true,
    params: { plan: 'string', value: 'number', currency: 'string', method: 'string' },
  },
  report_generated: {
    description: 'Relatório/diagnóstico concluído e entregue ao usuário.',
    conversion: true,
    params: { tool: 'string', plan: 'string' },
  },
  contact: {
    description: 'Intenção explícita de contato (e-mail, telefone, WhatsApp).',
    conversion: true,
    params: { channel: 'string' },
  },
  cta_click: {
    description: 'Clique em CTA de navegação. Não é conversão.',
    conversion: false,
    params: { cta: 'string', placement: 'string' },
  },
};

export const EVENT_NAMES: readonly string[] = Object.keys(GA4_EVENTS);

/** Eventos que devem ser marcados como eventos-chave (conversões) no GA4. */
export const CONVERSION_EVENTS: readonly string[] = EVENT_NAMES.filter(
  (name) => GA4_EVENTS[name].conversion
);

/** Um Measurement ID válido sempre começa com `G-`. */
export function isValidMeasurementId(value: unknown): value is string {
  return typeof value === 'string' && /^G-[A-Z0-9]{4,20}$/.test(value.trim());
}

export function normalizeMeasurementId(value: unknown): string | null {
  if (!isValidMeasurementId(value)) return null;
  return value.trim();
}

/**
 * Measurement ID real da propriedade GA4 `filtraai` (conta 414880880,
 * propriedade 562518631, stream web `properties/562518631/dataStreams/16279145684`).
 *
 * Não é segredo: o próprio snippet do GA4 publica esse ID no HTML de qualquer
 * site que o use. Fica como padrão para a tag funcionar no domínio canônico
 * mesmo que a variável de ambiente não exista no build, e pode ser trocado por
 * `NEXT_PUBLIC_GA_MEASUREMENT_ID` sem alterar código.
 */
export const DEFAULT_MEASUREMENT_ID = 'G-DCY9RH8NPJ';

/**
 * Resolve o ID efetivo: variável de ambiente válida > ID padrão da propriedade.
 * Sem ID válido em nenhum dos dois, devolve `null` e a instrumentação fica inerte.
 */
export function resolveMeasurementId(envValue: unknown): string | null {
  return normalizeMeasurementId(envValue) ?? normalizeMeasurementId(DEFAULT_MEASUREMENT_ID);
}

function stripHost(host: string): string {
  return host.toLowerCase().replace(/:\d+$/, '');
}

/**
 * Só envia dados do domínio canônico. `debug` existe para validar a tag em
 * preview/local sem poluir a propriedade por acidente.
 */
export function isTrackableHost(host: string, debug = false): boolean {
  const clean = stripHost(host);
  if (debug) return clean.length > 0;
  return CANONICAL_HOSTS.includes(clean);
}

/** Remove query string/fragmento e normaliza barras. */
export function normalizePath(path: string): string {
  if (!path) return '/';
  const withoutQuery = path.split('#')[0].split('?')[0];
  const withSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withSlash.replace(/\/{2,}/g, '/');
}

/** Normaliza `www` para o apex para que o GA4 veja um único host. */
export function canonicalPageLocation(origin: string, path: string): string {
  let base = origin;
  try {
    const url = new URL(origin);
    if (stripHost(url.host) === 'www.filtraai.com') base = CANONICAL_ORIGIN;
    if (!base) base = CANONICAL_ORIGIN;
  } catch {
    base = CANONICAL_ORIGIN;
  }
  return `${base.replace(/\/+$/, '')}${normalizePath(path)}`;
}

function matchesPrefix(path: string, prefixes: readonly string[]): boolean {
  const normalized = normalizePath(path).toLowerCase();
  return prefixes.some((prefix) => {
    const p = prefix.toLowerCase();
    return normalized === p || normalized.startsWith(`${p}/`);
  });
}

/** `page_view` só em páginas públicas da jornada. */
export function isPageViewPath(path: string): boolean {
  return !matchesPrefix(path, PAGE_VIEW_EXCLUDED_PREFIXES);
}

/** Área autenticada/administrativa: nenhuma automação livre. */
export function isPrivatePath(path: string): boolean {
  return matchesPrefix(path, PRIVATE_PATH_PREFIXES);
}

/** Decide se um evento pode sair a partir do caminho atual. */
export function isEventAllowedOnPath(eventName: string, path: string): boolean {
  if (!(eventName in GA4_EVENTS)) return false;
  if (eventName === 'page_view') return isPageViewPath(path);
  if (!isPrivatePath(path)) return true;
  return PRIVATE_PAGES_ALLOWED_EVENTS.includes(eventName);
}

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\s().-]?){9,}/;
const TOKEN_RE = /(?:eyJ[A-Za-z0-9_-]{5,}|bearer\s+\S+|[a-f0-9]{32,}|[A-Za-z0-9_-]{40,})/;
const DOC_RE = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const UNSAFE_CHARS_RE = /[{}<>\n\r\t]/;

/** Heurística conservadora: na dúvida, não envia. */
export function looksLikePersonalData(value: string): boolean {
  const candidate = value.trim();
  if (!candidate) return false;
  return (
    EMAIL_RE.test(candidate) ||
    PHONE_RE.test(candidate) ||
    TOKEN_RE.test(candidate) ||
    DOC_RE.test(candidate) ||
    UUID_RE.test(candidate) ||
    UNSAFE_CHARS_RE.test(candidate)
  );
}

function sanitizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const clean = value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || clean.length > 64) return null;
  if (looksLikePersonalData(clean)) return null;
  return clean;
}

/**
 * Filtra parâmetros pelo catálogo do evento e descarta qualquer valor que
 * possa carregar dado pessoal. Função pura: é o ponto coberto por
 * `scripts/test-analytics.mjs`.
 */
export function sanitizeEventParams(
  eventName: string,
  params: Record<string, unknown> | null | undefined
): Record<string, string | number | boolean> {
  const spec = GA4_EVENTS[eventName];
  if (!spec || !params) return {};
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, type] of Object.entries(spec.params)) {
    const raw = params[key];
    if (raw === undefined || raw === null) continue;
    if (type === 'number') {
      const num = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isFinite(num) && Math.abs(num) <= 1_000_000) clean[key] = num;
      continue;
    }
    if (type === 'boolean') {
      if (typeof raw === 'boolean') clean[key] = raw;
      continue;
    }
    const str = sanitizeString(raw);
    if (str) clean[key] = str;
  }
  return clean;
}

/** Chave de deduplicação: mesmo evento + mesmos parâmetros + mesma página. */
export function dedupeKey(
  eventName: string,
  params: Record<string, unknown>,
  path: string
): string {
  const ordered = Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key])}`)
    .join('&');
  return `${eventName}|${normalizePath(path)}|${ordered}`;
}

/** Identifica links de contato para o evento `contact`. */
export function contactChannelFromHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const value = href.trim().toLowerCase();
  if (value.startsWith('mailto:')) return 'email';
  if (value.startsWith('tel:')) return 'phone';
  if (value.includes('wa.me') || value.includes('api.whatsapp.com') || value.includes('whatsapp://')) {
    return 'whatsapp';
  }
  if (value.startsWith('https://t.me/')) return 'telegram';
  return null;
}

/**
 * Cria o shim de `gtag` que alimenta o `dataLayer`.
 *
 * ARMADILHA CRÍTICA: `gtag.js` só processa entradas **array-like**
 * (`arguments`), exatamente como o snippet oficial faz com
 * `dataLayer.push(arguments)`. Empurrar `Array` puro (`push([...])`) faz a tag
 * baixar com HTTP 200 e **não enviar nenhum hit** — o site parece instrumentado
 * e a propriedade fica vazia. Validado em 05/11/2026 no navegador contra a
 * propriedade real (variantes Array = 0 hits; variantes `arguments` = hit
 * enviado). Coberto por `scripts/test-analytics.mjs`.
 */
export function createGtagShim(dataLayer: unknown[]): (...args: unknown[]) => void {
  return function gtagShim(this: unknown) {
    // eslint-disable-next-line prefer-rest-params -- gtag.js exige array-like (`arguments`); rest params geram Array e a tag não envia hit
    dataLayer.push(arguments as unknown as unknown[]);
  } as unknown as (...args: unknown[]) => void;
}
