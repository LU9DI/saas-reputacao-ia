/**
 * Filtra.AI — MCP (Model Context Protocol) HTTP endpoint
 * Conectável no Grok: grok.com/connectors → New Connector → Custom
 * URL: https://<sua-api>/mcp
 * Auth: Authorization: Bearer <JWT de login da empresa>
 */
import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getDb, findEmpresa } from '../lib/db.js';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { isTrialPlan, planLabel } from '../lib/plans.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { getFeedbackLimit, planTemIA } from '../lib/quota.js';

type JsonRpcId = string | number | null;

type ToolCtx = {
  empresa_id: string;
  nome_funcionario?: string;
  role?: string;
};

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit MCP. Aguarde um momento.' },
});

const TOOLS = [
  {
    name: 'filtra_get_company_summary',
    description:
      'Resumo da reputação da empresa autenticada no Filtra.AI: nome, plano, nota média, totais, % positivas, crises 24h e status de acesso.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'filtra_list_critical_reviews',
    description:
      'Lista avaliações críticas (1–3★) recentes da empresa, com comentário, tags de IA e se já foram tratadas.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Máximo de itens (padrão 15, máx. 50).',
        },
        only_untreated: {
          type: 'boolean',
          description: 'Se true, só críticas ainda não marcadas como tratadas.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'filtra_get_ai_themes',
    description:
      'Temas e tags mais recorrentes extraídos pela IA das avaliações da empresa.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Quantidade de temas (padrão 10, máx. 20).',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'filtra_get_plan_status',
    description:
      'Status do plano/assinatura ou trial: plano, status, data de expiração e se o acesso está ativo.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
] as const;

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

function textContent(text: string) {
  return { content: [{ type: 'text', text }] };
}

async function resolveAuth(req: Request): Promise<ToolCtx | { error: string; code: number }> {
  const token = extrairToken(req);
  if (!token) {
    return {
      error:
        'Autenticação necessária. Envie Authorization: Bearer <JWT> obtido no login do Filtra.AI (e-mail/senha da empresa).',
      code: -32001,
    };
  }
  try {
    const payload = verifyAccessToken(token);
    if (isAdminUser({ empresa_id: payload.empresa_id, role: payload.role })) {
      return {
        error: 'Conta admin não possui painel de empresa. Use um JWT de conta empresa.',
        code: -32001,
      };
    }
    const db = getDb();
    const empresa = await db.get('SELECT status, expira_em FROM empresas WHERE id = ?', [
      payload.empresa_id,
    ]);
    if (!empresa || !empresaTemAcesso(empresa)) {
      return {
        error: 'Assinatura/trial inativo. Renove o acesso no Filtra.AI.',
        code: -32001,
      };
    }
    return {
      empresa_id: payload.empresa_id,
      nome_funcionario: payload.nome_funcionario,
      role: payload.role,
    };
  } catch {
    return { error: 'Token inválido ou expirado. Faça login novamente no Filtra.AI.', code: -32001 };
  }
}

function rowCreatedAt(r: any): string {
  return String(r.createdAt || r.createdat || r.created_at || '') || new Date().toISOString();
}

async function loadReviews(empresaId: string, limit = 300): Promise<any[]> {
  const db = getDb();
  const queries = [
    `SELECT * FROM reviews WHERE empresa_id = ? ORDER BY createdAt DESC NULLS LAST LIMIT ?`,
    `SELECT * FROM reviews WHERE empresa_id = ? ORDER BY "createdAt" DESC LIMIT ?`,
    `SELECT * FROM reviews WHERE empresa_id = ? ORDER BY id DESC LIMIT ?`,
  ];
  for (const q of queries) {
    try {
      const rows = await db.all(q, [empresaId, limit]);
      return Array.isArray(rows) ? rows : [];
    } catch {
      /* try next */
    }
  }
  return [];
}

function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function toolGetCompanySummary(ctx: ToolCtx) {
  const empresa = await findEmpresa(ctx.empresa_id);
  if (!empresa) throw new Error('Empresa não encontrada.');
  const plan = String(empresa.plan || 'trial').toLowerCase();
  const rows = await loadReviews(empresa.id, getFeedbackLimit(plan));
  const reais = rows.filter((r) => Number(r.is_test) !== 1);
  const total = reais.length;
  const soma = reais.reduce((s, r) => s + Number(r.rating || 0), 0);
  const media = total ? Math.round((soma / total) * 10) / 10 : 0;
  const positivas = reais.filter((r) => Number(r.rating) >= 4).length;
  const negativas = reais.filter((r) => Number(r.rating) <= 3).length;
  const ha24h = Date.now() - 24 * 60 * 60 * 1000;
  const crises_24h = reais.filter(
    (r) => Number(r.rating) <= 2 && new Date(rowCreatedAt(r)).getTime() >= ha24h
  ).length;
  const trial = isTrialPlan(plan);
  const statusAcesso =
    empresa.status === 'bloqueado'
      ? 'BLOQUEADO'
      : trial
        ? 'TRIAL'
        : empresa.status === 'ativo'
          ? 'ATIVO'
          : String(empresa.status || '—').toUpperCase();

  const payload = {
    empresa: empresa.nome_empresa,
    slug: empresa.slug,
    plan,
    plan_label: planLabel(plan),
    status: empresa.status,
    status_acesso: statusAcesso,
    expira_em: empresa.expira_em,
    metricas: {
      total,
      media,
      positivas,
      negativas,
      taxa_positiva_pct: total ? Math.round((positivas / total) * 100) : 0,
      crises_24h,
    },
  };
  return textContent(JSON.stringify(payload, null, 2));
}

async function toolListCriticalReviews(
  ctx: ToolCtx,
  args: { limit?: number; only_untreated?: boolean }
) {
  const limit = Math.min(50, Math.max(1, Number(args.limit) || 15));
  const onlyUntreated = Boolean(args.only_untreated);
  const empresa = await findEmpresa(ctx.empresa_id);
  if (!empresa) throw new Error('Empresa não encontrada.');
  const plan = String(empresa.plan || 'trial').toLowerCase();
  const rows = await loadReviews(ctx.empresa_id, getFeedbackLimit(plan));
  let criticas = rows
    .filter((r) => Number(r.is_test) !== 1 && Number(r.rating) <= 3)
    .map((r) => ({
      id: r.id,
      rating: Number(r.rating),
      name: r.name || null,
      comment: r.comment ? String(r.comment).slice(0, 500) : null,
      ai_tags: planTemIA(plan) ? parseTags(r.ai_tags) : [],
      created_at: rowCreatedAt(r),
      treated: Boolean(r.treated_at),
      sentiment: r.sentiment || null,
    }));
  if (onlyUntreated) criticas = criticas.filter((c) => !c.treated);
  criticas = criticas.slice(0, limit);
  return textContent(
    JSON.stringify({ count: criticas.length, only_untreated: onlyUntreated, reviews: criticas }, null, 2)
  );
}

async function toolGetAiThemes(ctx: ToolCtx, args: { limit?: number }) {
  const limit = Math.min(20, Math.max(1, Number(args.limit) || 10));
  const empresa = await findEmpresa(ctx.empresa_id);
  if (!empresa) throw new Error('Empresa não encontrada.');
  const plan = String(empresa.plan || 'trial').toLowerCase();
  if (!planTemIA(plan)) {
    throw Object.assign(new Error('Temas de IA não estão disponíveis neste plano.'), { code: -32003 });
  }
  const rows = await loadReviews(ctx.empresa_id, getFeedbackLimit(plan));
  const tagCount: Record<string, number> = {};
  for (const r of rows) {
    if (Number(r.is_test) === 1) continue;
    for (const t of parseTags(r.ai_tags)) {
      const k = String(t).trim();
      if (!k) continue;
      tagCount[k] = (tagCount[k] || 0) + 1;
    }
  }
  const themes = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
  return textContent(JSON.stringify({ themes }, null, 2));
}

async function toolGetPlanStatus(ctx: ToolCtx) {
  const empresa = await findEmpresa(ctx.empresa_id);
  if (!empresa) throw new Error('Empresa não encontrada.');
  const plan = String(empresa.plan || 'trial').toLowerCase();
  const acesso = empresaTemAcesso(empresa);
  const payload = {
    empresa: empresa.nome_empresa,
    plan,
    plan_label: planLabel(plan),
    status: empresa.status,
    expira_em: empresa.expira_em,
    cancel_at_period_end: Number(empresa.cancel_at_period_end) === 1,
    acesso_ativo: acesso,
    trial: isTrialPlan(plan),
  };
  return textContent(JSON.stringify(payload, null, 2));
}

async function callTool(name: string, args: Record<string, unknown>, ctx: ToolCtx) {
  switch (name) {
    case 'filtra_get_company_summary':
      return toolGetCompanySummary(ctx);
    case 'filtra_list_critical_reviews':
      return toolListCriticalReviews(ctx, args as { limit?: number; only_untreated?: boolean });
    case 'filtra_get_ai_themes':
      return toolGetAiThemes(ctx, args as { limit?: number });
    case 'filtra_get_plan_status':
      return toolGetPlanStatus(ctx);
    default:
      throw Object.assign(new Error(`Tool desconhecida: ${name}`), { code: -32601 });
  }
}

async function handleRpc(body: any, req: Request) {
  const id: JsonRpcId = body?.id ?? null;
  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return jsonRpcError(id, -32600, 'Invalid Request');
  }

  const method = body.method as string;
  const params = body.params || {};

  if (method === 'initialize') {
    return jsonRpcResult(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'filtra-ai', version: '1.0.0' },
    });
  }

  if (method === 'notifications/initialized' || method === 'initialized') {
    return jsonRpcResult(id, {});
  }

  if (method === 'ping') {
    return jsonRpcResult(id, {});
  }

  if (method === 'tools/list') {
    return jsonRpcResult(id, { tools: TOOLS });
  }

  if (method === 'tools/call') {
    const name = String(params.name || '');
    const args = (params.arguments || {}) as Record<string, unknown>;
    const auth = await resolveAuth(req);
    if ('error' in auth) {
      return jsonRpcError(id, auth.code, auth.error);
    }
    try {
      const result = await callTool(name, args, auth);
      return jsonRpcResult(id, result);
    } catch (e: any) {
      const code = typeof e?.code === 'number' ? e.code : -32000;
      return jsonRpcError(id, code, e?.message || 'Erro ao executar tool');
    }
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

export function mountMcpRoutes(app: Express) {
  app.get('/mcp', (_req, res) => {
    res.json({
      name: 'Filtra.AI MCP',
      version: '1.0.0',
      protocol: 'MCP over HTTP (JSON-RPC 2.0)',
      endpoint: 'POST /mcp',
      auth: 'Authorization: Bearer <JWT do login da empresa>',
      tools: TOOLS.map((t) => t.name),
      docs: 'https://filtraai.com — conector custom no Grok: cole a URL https://<api>/mcp',
    });
  });

  app.post(
    '/mcp',
    mcpLimiter,
    async (req: Request, res: Response) => {
      try {
        const body = req.body;
        // Batch (array) support
        if (Array.isArray(body)) {
          const out = [];
          for (const item of body) {
            out.push(await handleRpc(item, req));
          }
          return res.json(out);
        }
        const result = await handleRpc(body, req);
        return res.json(result);
      } catch (e: any) {
        return res.status(500).json(
          jsonRpcError(null, -32603, e?.message || 'Internal error')
        );
      }
    }
  );
}
