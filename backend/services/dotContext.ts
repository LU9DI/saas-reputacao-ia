import { getDb, findEmpresa } from '../lib/db.js';

export type DotContextMode = 'cached' | 'refresh' | 'live_ai';
export type DotContextDecision = {
  mode: DotContextMode;
  dataSource: 'cache' | 'database';
  reasoningRequired: boolean;
  refreshRequired: boolean;
  reason: string;
};

type Snapshot = {
  empresa: { id: string; nome: string; plan: string };
  metrics: { review_count: number; average: number; positive: number; critical: number };
  themes: Array<{ tag: string; count: number }>;
  recent_reviews: Array<{ id: number | string; rating: number; comment: string; created_at: string | null }>;
  alerts: any[];
  decisions: any[];
  actions: any[];
  followups: any[];
};

const CACHE_TTL_MS = Math.max(30_000, Number(process.env.DOT_CONTEXT_CACHE_TTL_MS || 300_000));

function normalize(value: string) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function classifyDotRequest(message: string): DotContextDecision {
  const q = normalize(message);
  const live = [
    /\b(agora|neste momento|hoje|acabou de|recente|recentes|ultima|ultimas|atual|atualmente|tempo real)\b/,
    /\b(caiu|subiu|mudou|piorou|melhorou|nova|novas|novo|novos)\b/,
  ].some((p) => p.test(q));
  const reasoning = [
    /\b(por que|porque|causa|origem|explica|explique|investigue)\b/,
    /\b(o que devo|o que fazer|como agir|recomende|recomendacao|sugira|priorize|prioridade|estrategia|plano|planeje|decida|decisao)\b/,
    /\b(compare|comparar|diferenca|impacto|risco|preveja|previsao|analise|analisar|avalie|diagnostique|interprete)\b/,
  ].some((p) => p.test(q));
  const cached = [
    /\b(qual|quanto|quantas|quantos|numero|total|media|nota|rating)\b/,
    /\b(principais temas|temas principais|elogios|reclamacoes|historico|decisoes|acoes preparadas|acompanhamentos|alertas|resumo|briefing)\b/,
  ].some((p) => p.test(q));

  if (live || reasoning) return {
    mode: 'live_ai', dataSource: 'database', reasoningRequired: true, refreshRequired: true,
    reason: reasoning ? 'A pergunta exige interpretação ou decisão nova.' : 'A pergunta exige estado temporal atual.',
  };
  if (cached) return {
    mode: 'cached', dataSource: 'cache', reasoningRequired: false, refreshRequired: false,
    reason: 'A pergunta pode usar fatos persistidos já calculados.',
  };
  return {
    mode: 'refresh', dataSource: 'database', reasoningRequired: true, refreshRequired: true,
    reason: 'A pergunta não é segura para responder apenas com cache.',
  };
}

async function all(db: any, sql: string, params: any[] = []) {
  try { return (await db.all(sql, params)) || []; } catch { return []; }
}
async function one(db: any, sql: string, params: any[] = []) {
  try { return (await db.get(sql, params)) || null; } catch { return null; }
}

async function fingerprint(empresaId: string) {
  const db = getDb();
  const review = await one(db, 'SELECT COUNT(*) c, MAX(id) max_id, MAX(createdAt) max_created FROM reviews WHERE empresa_id = ? AND COALESCE(is_test,0)=0', [empresaId])
    || await one(db, 'SELECT COUNT(*) c, MAX(id) max_id, MAX(created_at) max_created FROM reviews WHERE empresa_id = ? AND COALESCE(is_test,0)=0', [empresaId])
    || {};
  const parts: string[] = [
    `reviews:${review.c || 0}:${review.max_id || 0}:${review.max_created || ''}`,
  ];
  for (const table of ['dot_events','dot_decisions','dot_action_queue','dot_followups']) {
    const row = await one(db, `SELECT COUNT(*) c, MAX(id) max_id FROM ${table} WHERE empresa_id = ?`, [empresaId]);
    parts.push(`${table}:${row?.c || 0}:${row?.max_id || 0}`);
  }
  return parts.join('|');
}

async function ensureCache(db: any) {
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_context_cache (
    empresa_id TEXT PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    payload TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`);
}

async function getCached(db: any, empresaId: string, fp: string): Promise<Snapshot | null> {
  await ensureCache(db);
  const row = await db.get('SELECT payload, fingerprint, expires_at FROM dot_context_cache WHERE empresa_id = ? LIMIT 1', [empresaId]);
  if (!row || String(row.fingerprint) !== fp || new Date(String(row.expires_at)).getTime() <= Date.now()) return null;
  try { return JSON.parse(String(row.payload)); } catch { return null; }
}

async function putCached(db: any, empresaId: string, fp: string, snapshot: Snapshot) {
  await ensureCache(db);
  const now = Date.now();
  await db.run(`INSERT INTO dot_context_cache (empresa_id,fingerprint,payload,generated_at,expires_at)
    VALUES (?,?,?,?,?) ON CONFLICT(empresa_id) DO UPDATE SET
    fingerprint=excluded.fingerprint,payload=excluded.payload,generated_at=excluded.generated_at,expires_at=excluded.expires_at`,
    [empresaId, fp, JSON.stringify(snapshot), new Date(now).toISOString(), new Date(now + CACHE_TTL_MS).toISOString()]);
}

export async function invalidateDotContextCache(empresaId: string) {
  try {
    const db = getDb();
    await ensureCache(db);
    await db.run('DELETE FROM dot_context_cache WHERE empresa_id = ?', [empresaId]);
  } catch {
    // Cache is optional and can never block Feedback.
  }
}

async function buildSnapshot(empresaId: string): Promise<Snapshot> {
  const db = getDb();
  const empresa = await findEmpresa(empresaId);
  if (!empresa) throw new Error('Empresa não encontrada.');

  let reviews = await all(db, 'SELECT id,rating,comment,ai_tags,createdAt FROM reviews WHERE empresa_id=? AND COALESCE(is_test,0)=0 ORDER BY createdAt DESC LIMIT 500', [empresaId]);
  if (!reviews.length) reviews = await all(db, 'SELECT id,rating,comment,ai_tags,created_at FROM reviews WHERE empresa_id=? AND COALESCE(is_test,0)=0 ORDER BY created_at DESC LIMIT 500', [empresaId]);
  if (!reviews.length) reviews = await all(db, 'SELECT id,rating,comment,ai_tags FROM reviews WHERE empresa_id=? AND COALESCE(is_test,0)=0 ORDER BY id DESC LIMIT 500', [empresaId]);

  const total = reviews.length;
  const average = total ? Math.round((reviews.reduce((s: number,r:any)=>s+Number(r.rating||0),0)/total)*10)/10 : 0;
  const positive = reviews.filter((r:any)=>Number(r.rating)>=4).length;
  const critical = reviews.filter((r:any)=>Number(r.rating)<=3).length;
  const counts: Record<string,number> = {};
  for (const r of reviews) {
    try {
      const tags = JSON.parse(String(r.ai_tags || '[]'));
      if (Array.isArray(tags)) for (const tag of tags) {
        const key = String(tag).trim(); if (key) counts[key]=(counts[key]||0)+1;
      }
    } catch {}
  }

  return {
    empresa: { id:String(empresa.id), nome:String(empresa.nome_empresa||'Empresa'), plan:String(empresa.plan||'trial') },
    metrics: { review_count:total, average, positive, critical },
    themes:Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([tag,count])=>({tag,count})),
    recent_reviews:reviews.slice(0,8).map((r:any)=>({id:r.id,rating:Number(r.rating||0),comment:String(r.comment||'').slice(0,700),created_at:r.createdAt||r.created_at||null})),
    alerts:await all(db,'SELECT id,type,severity,title,details,created_at,acknowledged_at FROM dot_events WHERE empresa_id=? ORDER BY id DESC LIMIT 20',[empresaId]),
    decisions:await all(db,'SELECT id,event_id,type,priority,severity,reason,recommendation,status,created_at FROM dot_decisions WHERE empresa_id=? ORDER BY id DESC LIMIT 20',[empresaId]),
    actions:await all(db,'SELECT id,decision_id,option_id,action,status,approved_at,executed_at,error,created_at FROM dot_action_queue WHERE empresa_id=? ORDER BY id DESC LIMIT 20',[empresaId]),
    followups:await all(db,'SELECT id,decision_id,action_id,status,due_at,baseline_json,created_at,completed_at,outcome FROM dot_followups WHERE empresa_id=? ORDER BY id DESC LIMIT 20',[empresaId]),
  };
}

function toText(s: Snapshot, mode: DotContextMode) {
  return [
    mode==='cached'
      ? 'CONTEXTO DO DOT: cache seguro de fatos persistidos; não contém raciocínio novo.'
      : 'CONTEXTO DO DOT: dados verificados no banco nesta solicitação; raciocínio deve ser feito agora.',
    `Empresa: ${s.empresa.nome}`,
    `Plano: ${s.empresa.plan}`,
    `Avaliações reais: ${s.metrics.review_count}`,
    `Nota média calculada: ${s.metrics.average}/5`,
    `Positivas (4–5★): ${s.metrics.positive}`,
    `Críticas (1–3★): ${s.metrics.critical}`,
    `Temas já calculados: ${JSON.stringify(s.themes)}`,
    `Alertas persistidos: ${JSON.stringify(s.alerts)}`,
    `Decisões persistidas: ${JSON.stringify(s.decisions)}`,
    `Ações persistidas: ${JSON.stringify(s.actions)}`,
    `Acompanhamentos persistidos: ${JSON.stringify(s.followups)}`,
    `Avaliações recentes: ${JSON.stringify(s.recent_reviews)}`,
    'REGRA: fatos persistidos podem ser reutilizados; causa, impacto, prioridade, recomendação, previsão e decisão devem ser raciocinados novamente.',
  ].join('\n');
}

export function buildCachedDotAnswer(message: string, snapshot: Snapshot | null | undefined): string | null {
  if (!snapshot) return null;
  const q = normalize(message);
  if (/\b(nota|rating|media)\b/.test(q)) {
    return `A nota média registrada é ${snapshot.metrics.average}/5, com ${snapshot.metrics.review_count} avaliações reais. Essa é uma leitura factual do estado persistido; se quiser, posso investigar por que ela mudou.`;
  }
  if (/\b(quantas|quantos|numero|total)\b/.test(q) && /\b(avaliacoes|reviews)\b/.test(q)) {
    return `Há ${snapshot.metrics.review_count} avaliações reais registradas. ${snapshot.metrics.positive} estão em 4–5★ e ${snapshot.metrics.critical} em 1–3★.`;
  }
  if (/\b(principais temas|temas principais|assuntos|reclamacoes|elogios)\b/.test(q)) {
    const themes = snapshot.themes.slice(0, 5).map((t) => `${t.tag} (${t.count})`).join(', ');
    return themes ? `Os principais temas já calculados são: ${themes}. Se quiser entender causa ou prioridade, essa parte precisa de análise ao vivo.` : 'Ainda não há temas calculados suficientes no contexto persistido.';
  }
  if (/\b(alertas)\b/.test(q)) {
    const open = snapshot.alerts.filter((a: any) => !a.acknowledged_at).length;
    return `Existem ${snapshot.alerts.length} alertas persistidos no histórico recente, dos quais ${open} ainda não estão reconhecidos.`;
  }
  if (/\b(decisoes)\b/.test(q)) {
    const pending = snapshot.decisions.filter((d: any) => ['pending','prepared'].includes(String(d.status))).length;
    return `Há ${snapshot.decisions.length} decisões persistidas no histórico recente; ${pending} ainda estão pendentes ou preparadas.`;
  }
  return null;
}

export async function loadDotContextForMessage(empresaId: string, message: string) {
  const decision = classifyDotRequest(message);
  const db = getDb();
  const fp = await fingerprint(empresaId);
  if (!decision.refreshRequired) {
    const cached = await getCached(db, empresaId, fp);
    if (cached) return { context:toText(cached,'cached'), decision, fingerprint:fp, snapshot:cached, cacheHit:true };
  }
  const snapshot = await buildSnapshot(empresaId);
  await putCached(db, empresaId, fp, snapshot);
  const refreshedDecision = decision.mode === 'cached'
    ? { ...decision, mode: 'refresh' as const, dataSource: 'database' as const, refreshRequired: true }
    : decision;
  return { context:toText(snapshot,refreshedDecision.mode), decision:refreshedDecision, fingerprint:fp, snapshot, cacheHit:false };
}

export async function loadDotRealContext(empresaId: string): Promise<string> {
  return (await loadDotContextForMessage(empresaId,'briefing atual')).context;
}
