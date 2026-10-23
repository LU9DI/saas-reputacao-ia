import crypto from 'crypto';
import type { Database } from 'sqlite';
import { callAI, type AiCallResult } from '../groqService.js';

export type AcquisitionChannel = 'linkedin' | 'instagram' | 'x';

export type ContentSource = {
  path: string;
  ctaPath?: string;
  title: string;
  description: string;
  audience: string;
  angle: string;
  priority: number;
};

export type AcquisitionContentRow = {
  id: string;
  campaign_id: string;
  platform: AcquisitionChannel;
  title: string;
  body: string;
  status: string;
  utm_content: string | null;
  metadata_json: string | null;
  source_url: string | null;
  approved_at: string | null;
  published_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ParsedAcquisitionContentRow = AcquisitionContentRow & {
  metadata: Record<string, unknown>;
  claim_flags: string[];
};

export type DraftSet = Record<AcquisitionChannel, string>;

type RecentContentRow = { source_url?: string | null; created_at?: string | Date | null };

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 30;
const MAX_BATCH = 5;
const schemaReady = new WeakSet<Database>();

export const ACQUISITION_CHANNELS: AcquisitionChannel[] = ['linkedin', 'instagram', 'x'];

export const CHANNEL_META: Record<
  AcquisitionChannel,
  { label: string; maxChars: number; instruction: string }
> = {
  linkedin: {
    label: 'LinkedIn',
    maxChars: 1500,
    instruction:
      'Texto profissional para LinkedIn, com uma ideia central, um ponto prático e um convite discreto. Pode usar até 3 hashtags.',
  },
  instagram: {
    label: 'Instagram',
    maxChars: 1200,
    instruction:
      'Legenda para Instagram, em tom humano e direto, com quebras de linha curtas e até 5 hashtags. Não use linguagem de anúncio agressivo.',
  },
  x: {
    label: 'X',
    maxChars: 280,
    instruction:
      'Post curto para X, com uma constatação útil e um convite. O texto inteiro, incluindo a URL, deve caber em 280 caracteres.',
  },
};

/**
 * Páginas reais e públicas da Filtra.AI. O gerador não cria artigos novos:
 * ele reaproveita conteúdo já publicado, com ângulo e público definidos.
 */
export const CONTENT_SOURCES: ContentSource[] = [
  {
    path: '/auditoria-gratuita',
    title: 'Auditoria gratuita de avaliações e reputação online',
    description:
      'Faça uma auditoria gratuita das avaliações da sua empresa. Identifique pontos fortes, riscos e temas recorrentes e veja oportunidades de melhoria.',
    audience: 'empresas que recebem avaliações e querem um diagnóstico inicial',
    angle: 'Um diagnóstico organizado transforma comentários soltos em prioridades claras.',
    priority: 1,
  },
  {
    path: '/gestao-de-reputacao-online',
    title: 'Software de gestão de reputação online para empresas',
    description:
      'Software para monitorar avaliações Google, analisar feedback com IA e transformar temas recorrentes em ações de melhoria.',
    audience: 'gestores e donos de pequenas e médias empresas',
    angle: 'Reputação não é só acompanhar a nota; é conectar feedback recorrente à operação.',
    priority: 2,
  },
  {
    path: '/avaliacoes-google',
    title: 'Gestão de avaliações Google com IA',
    description:
      'Organize avaliações Google, entenda os temas dos clientes e conecte feedback à operação. Transforme reviews em decisões com análise, contexto e acompanhamento.',
    audience: 'equipes de atendimento, marketing e operações',
    angle: 'Avaliações são um canal de escuta contínua, não apenas uma vitrine de estrelas.',
    priority: 3,
  },
  {
    path: '/como-melhorar-avaliacoes-google',
    ctaPath: '/auditoria-gratuita',
    title: 'Como melhorar as avaliações Google da sua empresa',
    description:
      'Estratégias práticas para aumentar o volume de avaliações Google honestas, entender feedback e melhorar a experiência do cliente.',
    audience: 'donos de negócios locais que querem construir confiança',
    angle: 'Pedir avaliações com transparência é diferente de pressionar o cliente por uma nota.',
    priority: 4,
  },
  {
    path: '/reputacao-google',
    ctaPath: '/auditoria-gratuita',
    title: 'Reputação no Google: transforme avaliações em gestão',
    description:
      'Como gerir reputação no Google, organizar avaliações e transformar feedback em ações de crescimento com a Filtra.AI.',
    audience: 'gestores responsáveis por presença digital e reputação',
    angle: 'A reputação no Google é construída pela experiência real e pela forma como a empresa responde.',
    priority: 5,
  },
  {
    path: '/gestao-de-feedback',
    ctaPath: '/auditoria-gratuita',
    title: 'Gestão de feedback de clientes: da opinião à ação',
    description:
      'Como estruturar coleta, análise e acompanhamento de feedback de clientes para transformar opiniões em melhoria operacional.',
    audience: 'times de experiência do cliente e operações',
    angle: 'Feedback sem acompanhamento vira arquivo; feedback com dono e prazo vira melhoria.',
    priority: 6,
  },
  {
    path: '/blog/review-1-estrela-primeiras-24-horas',
    title: 'Review 1★: o que fazer nas primeiras 24 horas',
    description:
      'Checklist operacional quando chega uma avaliação negativa: investigar, responder com calma, corrigir processo e acompanhar a reputação.',
    audience: 'gestores que precisam responder a uma avaliação negativa',
    angle: 'A primeira resposta importa, mas a correção do processo importa ainda mais.',
    priority: 7,
  },
  {
    path: '/blog/whatsapp-pedir-estrela-vs-filtrar-qr',
    title: 'WhatsApp ou QR Code para pedir avaliações Google',
    description:
      'Compare WhatsApp e QR Code para convidar clientes a deixar avaliações honestas, organizar feedback e acompanhar a reputação sem pressão por nota.',
    audience: 'restaurantes, clínicas e negócios de atendimento',
    angle: 'A ferramenta de convite é secundária; o critério é convidar sem filtrar quem está insatisfeito.',
    priority: 8,
  },
  {
    path: '/blog/velocity-reviews-google-maps-2026',
    title: 'Como manter avaliações recentes no Google Maps em 2026',
    description:
      'Entenda por que uma rotina consistente de pedidos honestos, respostas e acompanhamento ajuda na gestão de avaliações e no SEO local.',
    audience: 'negócios locais que dependem do Google Maps',
    angle: 'Consistência é mais sustentável do que um pico isolado de avaliações.',
    priority: 9,
  },
  {
    path: '/blog/reputacao-online-hoteis',
    title: 'Reputação online para hotéis: aprender com avaliações de hóspedes',
    description:
      'Como hotéis podem analisar avaliações de hóspedes, identificar padrões de experiência e transformar feedback em prioridades operacionais.',
    audience: 'hotéis, pousadas e operações de hospedagem',
    angle: 'Avaliações de hóspedes apontam padrões de experiência que uma nota média não mostra.',
    priority: 10,
  },
  {
    path: '/blog/clinica-checklist-avaliacoes-google',
    title: 'Clínicas: checklist de avaliações Google',
    description:
      'Checklist prático para clínicas: feedback do paciente, avaliações Google, respostas, indicadores e ações para melhorar a reputação local.',
    audience: 'clínicas e consultórios',
    angle: 'A rotina de avaliações precisa respeitar privacidade e contexto do atendimento em saúde.',
    priority: 11,
  },
  {
    path: '/agencias',
    title: 'Gestão de reputação para agências de SEO local',
    description:
      'Gestão de reputação e avaliações Google para agências de SEO local. Estruture uma oferta recorrente e acompanhe clientes com a Filtra.AI.',
    audience: 'agências de SEO local e marketing digital',
    angle: 'Reputação pode ser uma oferta recorrente dentro do serviço de SEO local.',
    priority: 12,
  },
  {
    path: '/clinicas',
    ctaPath: '/auditoria-gratuita',
    title: 'Gestão de avaliações Google para clínicas',
    description:
      'Organize avaliações Google, feedback de pacientes e sinais de experiência para clínicas e redes com o Filtra.AI.',
    audience: 'clínicas e redes de saúde',
    angle: 'Ouvir o paciente de forma estruturada ajuda a melhorar a experiência e a reputação local.',
    priority: 13,
  },
  {
    path: '/hoteis',
    title: 'Hotéis: transforme avaliações de hóspedes em melhoria',
    description:
      'Organize avaliações de hóspedes, identifique padrões de experiência e transforme feedback em ações para melhorar a reputação do hotel.',
    audience: 'hotéis e operações de hospedagem',
    angle: 'A experiência do hóspede começa antes do check-in e continua depois do check-out.',
    priority: 14,
  },
  {
    path: '/restaurantes',
    ctaPath: '/auditoria-gratuita',
    title: 'Reputação no Google para restaurantes e food service',
    description:
      'QR na mesa, pedido de feedback e convite para avaliações genuínas no Google. Organize comentários, identifique padrões e transforme a experiência do cliente em ações.',
    audience: 'restaurantes, bares e food service',
    angle: 'A avaliação é consequência da experiência; o convite deve ser simples e sem pressão.',
    priority: 15,
  },
  {
    path: '/calculadora-nota-google',
    title: 'Calculadora de nota do Google: quantas avaliações faltam?',
    description:
      'Calcule quantas avaliações seriam necessárias para alcançar uma nota desejada no Google. Simule cenários com nota atual, volume e média futura.',
    audience: 'negócios locais que querem planejar a evolução da nota',
    angle: 'Simular cenários ajuda a definir expectativas realistas sobre a nota do Google.',
    priority: 16,
  },
];

function clean(value: unknown, max = 500): string {
  return String(value ?? '').trim().slice(0, max);
}

function clampLimit(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 2;
  return Math.min(MAX_BATCH, Math.max(1, Math.floor(n)));
}

export function siteBaseUrl(): string {
  return (process.env.PUBLIC_SITE_URL || process.env.APP_URL || 'https://filtraai.com')
    .trim()
    .replace(/\/$/, '');
}

export function campaignIdFor(now = new Date()): string {
  return `organic-content-${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function slugForPath(path: string): string {
  return path
    .replace(/^\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'home';
}

export function buildUtmUrl(
  source: ContentSource,
  channel: AcquisitionChannel,
  campaignId = campaignIdFor(),
): string {
  const destination = source.ctaPath || source.path;
  const url = new URL(destination, `${siteBaseUrl()}/`);
  url.searchParams.set('utm_source', channel);
  url.searchParams.set('utm_medium', 'social');
  url.searchParams.set('utm_campaign', campaignId);
  url.searchParams.set('utm_content', `${slugForPath(source.path)}-${channel}`);
  return url.toString();
}

export function buildDraftId(campaignId: string, sourcePath: string, channel: AcquisitionChannel): string {
  return crypto
    .createHash('sha256')
    .update(`${campaignId}:${sourcePath}:${channel}`)
    .digest('hex')
    .slice(0, 64);
}

export function parseDraftJson(text: string): Partial<Record<AcquisitionChannel, unknown>> | null {
  const cleaned = String(text || '')
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function trimToLimit(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, Math.max(0, max - 1));
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function withoutExternalUrls(text: string): string {
  return text
    .replace(/https?:\/\/[^\s)]+/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function ensureCta(text: string, url: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.includes(url)) return trimToLimit(trimmed, max);
  const withCta = `${trimmed}\n\n${url}`;
  if (withCta.length <= max) return withCta;
  // Keep the URL intact; cut the body, not the link.
  const room = Math.max(0, max - url.length - 2);
  return `${trimToLimit(trimmed, room)}\n${url}`;
}

export function fallbackDrafts(source: ContentSource, campaignId = campaignIdFor()): DraftSet {
  const linkedinUrl = buildUtmUrl(source, 'linkedin', campaignId);
  const instagramUrl = buildUtmUrl(source, 'instagram', campaignId);
  const xUrl = buildUtmUrl(source, 'x', campaignId);
  return {
    linkedin: ensureCta(
      `${source.title}\n\n${source.description}\n\n${source.angle}\n\nDiagnóstico gratuito:`,
      linkedinUrl,
      CHANNEL_META.linkedin.maxChars,
    ),
    instagram: ensureCta(
      `${source.title}\n\n${source.description}\n\n${source.angle}\n\nLink na bio ou no texto:`,
      instagramUrl,
      CHANNEL_META.instagram.maxChars,
    ),
    x: ensureCta(`${source.title}: ${source.description}`, xUrl, CHANNEL_META.x.maxChars),
  };
}

/**
 * Sinaliza trechos que exigem conferência humana. O conteúdo não é bloqueado
 * automaticamente: fica pendente de revisão, com os alertas visíveis.
 */
export function findClaimFlags(text: string): string[] {
  const flags = new Set<string>();
  const checks: Array<[string, RegExp]> = [
    ['percentual', /\b\d+(?:[.,]\d+)?\s*%/g],
    ['valor em reais', /R\$\s?\d/g],
    ['promessa de garantia', /\b(garantimos|garantido|garantia de|100%)\b/gi],
    ['superlativo', /\b(melhor|nº\s?1|numero 1|número 1|líder|primeiro lugar)\b/gi],
    ['resultado numérico', /\b(aument\w*|reduz\w*|cres\w*|melhor\w*)\s+(em\s+)?\d/gi],
    ['prazo prometido', /\b(em\s+\d+\s+(dias|semanas|meses)|resultado em)\b/gi],
  ];
  for (const [label, regex] of checks) {
    if (regex.test(text)) flags.add(label);
    regex.lastIndex = 0;
  }
  return [...flags];
}

export function normalizeDrafts(
  parsed: Partial<Record<AcquisitionChannel, unknown>> | null,
  source: ContentSource,
  campaignId = campaignIdFor(),
): DraftSet {
  const fallback = fallbackDrafts(source, campaignId);
  const output = { ...fallback };
  for (const channel of ACQUISITION_CHANNELS) {
    const candidate = parsed?.[channel];
    if (typeof candidate !== 'string') continue;
    const text = withoutExternalUrls(candidate.trim());
    if (!text || text.length < 40) continue;
    const url = buildUtmUrl(source, channel, campaignId);
    const withCta = ensureCta(text, url, CHANNEL_META[channel].maxChars);
    if (withCta.length >= 40) output[channel] = withCta;
  }
  return output;
}

export function selectSourcesForBatch(
  sources: ContentSource[],
  recent: RecentContentRow[],
  limit: unknown,
  now = new Date(),
): ContentSource[] {
  const cutoff = now.getTime() - RECENT_WINDOW_DAYS * DAY_MS;
  const recentPaths = new Set(
    recent
      .filter((row) => {
        if (!row.source_url) return false;
        const ts = row.created_at ? new Date(row.created_at).getTime() : 0;
        return Number.isFinite(ts) && ts >= cutoff;
      })
      .map((row) => String(row.source_url)),
  );
  return [...sources]
    .filter((source) => !recentPaths.has(source.path))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, clampLimit(limit));
}

function buildPrompt(source: ContentSource, campaignId: string): string {
  const urls = ACQUISITION_CHANNELS.map((channel) => `${channel}: ${buildUtmUrl(source, channel, campaignId)}`).join('\n');
  return [
    'Produza três rascunhos de divulgação para a Filtra.AI, em português do Brasil.',
    'Use SOMENTE as informações fornecidas abaixo. Não invente números, percentuais, preços, clientes, resultados, parcerias, prêmios, prazos ou promessas.',
    'Não prometa nota, remoção de avaliação, ranking, vendas ou resultado garantido. Não peça avaliação em troca de benefício.',
    'Não use urgência falsa, linguagem de spam, ataques a concorrentes ou generalizações sobre setores.',
    '',
    `Página: ${source.title}`,
    `Descrição: ${source.description}`,
    `Público: ${source.audience}`,
    `Ângulo editorial: ${source.angle}`,
    '',
    'URLs finais (use exatamente uma por canal, sem alterar parâmetros):',
    urls,
    '',
    'Formato de saída: JSON válido, sem markdown, com as chaves "linkedin", "instagram" e "x".',
    'Cada valor deve ser somente o texto do post, já incluindo a URL final do canal.',
    'Instruções por canal:',
    ...ACQUISITION_CHANNELS.map(
      (channel) => `- ${CHANNEL_META[channel].label}: ${CHANNEL_META[channel].instruction}`,
    ),
    `Limites: LinkedIn até ${CHANNEL_META.linkedin.maxChars} caracteres; Instagram até ${CHANNEL_META.instagram.maxChars}; X até ${CHANNEL_META.x.maxChars} incluindo a URL.`,
  ].join('\n');
}

export async function ensureAcquisitionContentSchema(db: Database): Promise<void> {
  if (schemaReady.has(db)) return;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS acquisition_content (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      platform TEXT NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      utm_content TEXT,
      metadata_json TEXT,
      source_url TEXT,
      approved_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      review_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  for (const sql of [
    'ALTER TABLE acquisition_content ADD COLUMN source_url TEXT',
    'ALTER TABLE acquisition_content ADD COLUMN approved_at TIMESTAMPTZ',
    'ALTER TABLE acquisition_content ADD COLUMN published_at TIMESTAMPTZ',
    'ALTER TABLE acquisition_content ADD COLUMN review_notes TEXT',
  ]) {
    try { await db.exec(sql); } catch { /* column already exists / engine-specific */ }
  }
  await db.exec('CREATE INDEX IF NOT EXISTS idx_acq_content_status ON acquisition_content(status, created_at)').catch(() => undefined);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_acq_content_source ON acquisition_content(source_url, created_at)').catch(() => undefined);
  schemaReady.add(db);
}

export function parseContentRow(row: any): ParsedAcquisitionContentRow {
  let metadata: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(String(row?.metadata_json || '{}'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) metadata = parsed;
  } catch { /* keep empty */ }
  const claimFlags = Array.isArray(metadata.claim_flags)
    ? metadata.claim_flags.map((x) => String(x)).filter(Boolean)
    : [];
  return {
    ...row,
    metadata,
    claim_flags: claimFlags,
  } as ParsedAcquisitionContentRow;
}

export async function listAcquisitionContent(
  db: Database,
  options: { status?: string; limit?: number } = {},
): Promise<ParsedAcquisitionContentRow[]> {
  await ensureAcquisitionContentSchema(db);
  const allowedStatuses = new Set(['pending_review', 'approved', 'rejected', 'published', 'draft']);
  const status = options.status && allowedStatuses.has(options.status) ? options.status : null;
  const limit = Math.min(100, Math.max(1, Math.floor(Number(options.limit || 50) || 50)));
  const rows = status
    ? await db.all(
        `SELECT * FROM acquisition_content WHERE status=? ORDER BY created_at DESC LIMIT ${limit}`,
        [status],
      )
    : await db.all(`SELECT * FROM acquisition_content ORDER BY created_at DESC LIMIT ${limit}`);
  return (rows || []).map(parseContentRow);
}

export async function generateAcquisitionContent(options: {
  db: Database;
  limit?: unknown;
  channels?: AcquisitionChannel[];
  now?: Date;
  ai?: (system: string, user: string, maxTokens?: number, temperature?: number, opts?: Record<string, unknown>) => Promise<AiCallResult>;
}): Promise<{
  campaign_id: string;
  generated: number;
  skipped: number;
  sources: string[];
  channels: AcquisitionChannel[];
  provider: string;
  reason?: string;
}> {
  const { db } = options;
  await ensureAcquisitionContentSchema(db);
  const now = options.now || new Date();
  const campaignId = campaignIdFor(now);
  const channels = (options.channels?.length ? options.channels : ACQUISITION_CHANNELS)
    .filter((channel): channel is AcquisitionChannel => ACQUISITION_CHANNELS.includes(channel));
  const cutoff = new Date(now.getTime() - RECENT_WINDOW_DAYS * DAY_MS).toISOString();
  const recent = (await db.all(
    `SELECT source_url, created_at FROM acquisition_content
     WHERE source_url IS NOT NULL AND created_at >= ?`,
    [cutoff],
  )) as RecentContentRow[];
  const sources = selectSourcesForBatch(CONTENT_SOURCES, recent || [], options.limit, now);
  if (!sources.length) {
    return {
      campaign_id: campaignId,
      generated: 0,
      skipped: 0,
      sources: [],
      channels,
      provider: 'none',
      reason: 'Todas as fontes foram promovidas nos últimos 30 dias.',
    };
  }

  const ai = options.ai || callAI;
  const system =
    'Você é redator de conteúdo orgânico da Filtra.AI. Escreva com precisão, sem inventar fatos, métricas ou promessas. Responda somente JSON válido.';
  let generated = 0;
  let skipped = 0;
  let provider = 'fallback';

  for (const source of sources) {
    let parsed: Partial<Record<AcquisitionChannel, unknown>> | null = null;
    let sourceProvider = 'fallback';
    try {
      const result = await ai(system, buildPrompt(source, campaignId), 900, 0.45, {
        tipo: 'acquisition_content',
        feature: 'organic_social',
      });
      sourceProvider = result.provider;
      provider = result.provider;
      parsed = parseDraftJson(result.text);
    } catch {
      parsed = null;
    }
    const drafts = normalizeDrafts(parsed, source, campaignId);
    for (const channel of channels) {
      const body = drafts[channel];
      if (!body) continue;
      const id = buildDraftId(campaignId, source.path, channel);
      const metadata = {
        source_path: source.path,
        source_title: source.title,
        audience: source.audience,
        angle: source.angle,
        utm_url: buildUtmUrl(source, channel, campaignId),
        claim_flags: findClaimFlags(body),
        review_required: true,
        generated_at: new Date().toISOString(),
        ai_provider: sourceProvider,
      };
      const result = await db.run(
        `INSERT INTO acquisition_content
          (id,campaign_id,platform,title,body,status,utm_content,metadata_json,source_url,updated_at)
         VALUES (?,?,?,?,?,'pending_review',?,?,?,CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO NOTHING`,
        [
          id,
          campaignId,
          channel,
          `${source.title} — ${CHANNEL_META[channel].label}`,
          body,
          `${slugForPath(source.path)}-${channel}`,
          JSON.stringify(metadata).slice(0, 20000),
          source.path,
        ],
      );
      if (Number(result?.changes || 0) > 0) generated++;
      else skipped++;
    }
  }

  return { campaign_id: campaignId, generated, skipped, sources: sources.map((s) => s.path), channels, provider };
}

export async function getAcquisitionContent(db: Database, id: string): Promise<ParsedAcquisitionContentRow | null> {
  await ensureAcquisitionContentSchema(db);
  const row = await db.get('SELECT * FROM acquisition_content WHERE id=?', [id]);
  return row ? parseContentRow(row) : null;
}

export async function approveAcquisitionContent(
  db: Database,
  id: string,
  edits: { title?: string; body?: string } = {},
): Promise<ParsedAcquisitionContentRow> {
  const current = await getAcquisitionContent(db, id);
  if (!current) throw new AcquisitionContentError('Conteúdo não encontrado.', 404);
  if (!['pending_review', 'draft', 'approved'].includes(String(current.status))) {
    throw new AcquisitionContentError('Somente rascunhos pendentes podem ser aprovados.', 409);
  }
  const body = clean(edits.body ?? current.body, 50000);
  if (body.length < 40) throw new AcquisitionContentError('O texto aprovado é muito curto.', 400);
  const title = clean(edits.title ?? current.title, 500);
  const flags = findClaimFlags(body);
  let metadata: Record<string, unknown> = current.metadata || {};
  metadata = { ...metadata, claim_flags: flags, reviewed_at: new Date().toISOString() };
  await db.run(
    `UPDATE acquisition_content
     SET title=?, body=?, status='approved', approved_at=CURRENT_TIMESTAMP,
         metadata_json=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`,
    [title, body, JSON.stringify(metadata).slice(0, 20000), id],
  );
  return (await getAcquisitionContent(db, id))!;
}

export async function rejectAcquisitionContent(
  db: Database,
  id: string,
  reason = '',
): Promise<ParsedAcquisitionContentRow> {
  const current = await getAcquisitionContent(db, id);
  if (!current) throw new AcquisitionContentError('Conteúdo não encontrado.', 404);
  if (String(current.status) === 'published') {
    throw new AcquisitionContentError('Conteúdo já publicado não pode ser rejeitado.', 409);
  }
  await db.run(
    `UPDATE acquisition_content
     SET status='rejected', review_notes=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`,
    [clean(reason, 1000), id],
  );
  return (await getAcquisitionContent(db, id))!;
}

export function publishConfigured(): boolean {
  return Boolean(
    process.env.ACQUISITION_PUBLISH_ENABLED === 'true' &&
      String(process.env.ACQUISITION_PUBLISH_WEBHOOK_URL || '').trim(),
  );
}

export async function publishAcquisitionContent(
  db: Database,
  id: string,
): Promise<{ published: boolean; already_published?: boolean; response?: unknown }> {
  const current = await getAcquisitionContent(db, id);
  if (!current) throw new AcquisitionContentError('Conteúdo não encontrado.', 404);
  if (String(current.status) === 'published' || current.published_at) {
    return { published: true, already_published: true };
  }
  if (String(current.status) !== 'approved') {
    throw new AcquisitionContentError('Aprove o conteúdo antes de publicar.', 409);
  }
  if (!publishConfigured()) {
    throw new AcquisitionContentError(
      'Publicação externa desativada. Defina ACQUISITION_PUBLISH_ENABLED=true e ACQUISITION_PUBLISH_WEBHOOK_URL.',
      409,
    );
  }
  const webhookUrl = String(process.env.ACQUISITION_PUBLISH_WEBHOOK_URL || '').trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(webhookUrl);
  } catch {
    throw new AcquisitionContentError('ACQUISITION_PUBLISH_WEBHOOK_URL inválida.', 500);
  }
  if (parsedUrl.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && parsedUrl.hostname === 'localhost')) {
    throw new AcquisitionContentError('O webhook de publicação deve usar HTTPS.', 500);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = String(process.env.ACQUISITION_PUBLISH_WEBHOOK_SECRET || '').trim();
  if (secret) headers['X-Filtra-Secret'] = secret;
  const payload = {
    id: current.id,
    channel: current.platform,
    title: current.title,
    body: current.body,
    source_url: current.source_url,
    utm_content: current.utm_content,
    approved_at: current.approved_at,
    campaign_id: current.campaign_id,
  };

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error: any) {
    throw new AcquisitionContentError(`Falha ao chamar o webhook: ${clean(error?.message, 300)}`, 502);
  }
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new AcquisitionContentError(`Webhook recusou a publicação (HTTP ${response.status}).`, 502);
  }
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 1000) }; }
  let metadata: Record<string, unknown> = current.metadata || {};
  metadata = { ...metadata, publish_response: body, published_at: new Date().toISOString() };
  await db.run(
    `UPDATE acquisition_content
     SET status='published', published_at=CURRENT_TIMESTAMP, metadata_json=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=? AND status='approved'`,
    [JSON.stringify(metadata).slice(0, 20000), id],
  );
  return { published: true, response: body };
}

export async function acquisitionContentOverview(db: Database): Promise<Record<string, unknown>> {
  await ensureAcquisitionContentSchema(db);
  const row = await db.get(
    `SELECT
       (SELECT COUNT(*) FROM acquisition_content WHERE status='pending_review') AS pending_review,
       (SELECT COUNT(*) FROM acquisition_content WHERE status='approved') AS approved,
       (SELECT COUNT(*) FROM acquisition_content WHERE status='published') AS published,
       (SELECT COUNT(*) FROM acquisition_content WHERE status='rejected') AS rejected,
       (SELECT COUNT(*) FROM acquisition_content) AS total`,
  );
  let eligibleLeads = 0;
  let diagnostics = 0;
  try {
    eligibleLeads = Number(
      (await db.get(
        `SELECT COUNT(*) AS count FROM acquisition_leads
         WHERE consent=1 AND COALESCE(acquisition_suppressed,0)=0`,
      ))?.count || 0,
    );
    diagnostics = Number(
      (await db.get(`SELECT COUNT(*) AS count FROM acquisition_events WHERE event_type='diagnostic.completed'`))?.count || 0,
    );
  } catch { /* acquisition schema may not exist yet */ }
  const counts = (row || {}) as Record<string, unknown>;
  return {
    pending_review: Number(counts.pending_review || 0),
    approved: Number(counts.approved || 0),
    published: Number(counts.published || 0),
    rejected: Number(counts.rejected || 0),
    total: Number(counts.total || 0),
    eligible_leads: eligibleLeads,
    diagnostics,
    publish_configured: publishConfigured(),
    ai_configured: Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY),
    channels: ACQUISITION_CHANNELS,
  };
}

export class AcquisitionContentError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AcquisitionContentError';
    this.statusCode = statusCode;
  }
}
