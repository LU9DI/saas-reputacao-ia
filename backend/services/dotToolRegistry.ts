import { getDb } from '../lib/db.js';
import { requireDotAccess, type DotAccessAction, type DotAccessResource } from './dotAccessControl.js';
import { queryGoogleSearchConsole } from './googleSearchConsole.js';

export type DotToolOperation = DotAccessAction;
export type DotToolDefinition = {
  id: string;
  description: string;
  resource: DotAccessResource;
  operation: DotToolOperation;
  risk: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  execute: (empresaId: string, input: Record<string, unknown>) => Promise<unknown>;
};

async function ensureSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_tool_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    allowed INTEGER NOT NULL,
    actor_type TEXT NOT NULL,
    actor_user_id TEXT,
    input_json TEXT NOT NULL DEFAULT '{}',
    result_json TEXT,
    error TEXT,
    created_at TEXT NOT NULL
  )`);
  try {
    await db.exec('ALTER TABLE dot_tool_audit ADD COLUMN actor_user_id TEXT');
  } catch {
    // Compatível com Postgres e SQLite: a coluna já existente é um no-op seguro.
  }
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_tool_audit_empresa ON dot_tool_audit(empresa_id, created_at)');
}

async function audit(input: {
  empresaId: string;
  toolId: string;
  operation: string;
  allowed: boolean;
  actorType: string;
  actorUserId?: string | null;
  input?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}) {
  await ensureSchema();
  await getDb().run(
    'INSERT INTO dot_tool_audit (empresa_id,tool_id,operation,allowed,actor_type,actor_user_id,input_json,result_json,error,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [input.empresaId, input.toolId, input.operation, input.allowed ? 1 : 0, input.actorType, input.actorUserId || null, JSON.stringify(input.input || {}), input.result == null ? null : JSON.stringify(input.result), input.error || null, new Date().toISOString()],
  );
}

const tools: Record<string, DotToolDefinition> = {
  'company.workspace.read': {
    id: 'company.workspace.read',
    description: 'Lê o contexto operacional básico da empresa para o DOT.',
    resource: 'filtra',
    operation: 'read',
    risk: 'low',
    requiresApproval: false,
    async execute(empresaId) {
      const row = await getDb().get('SELECT id,nome_empresa,status,plan,slug FROM empresas WHERE id=? LIMIT 1', [empresaId]);
      if (!row) throw new Error('Empresa não encontrada.');
      return { empresa: row };
    },
  },
  'reviews.read': {
    id: 'reviews.read',
    description: 'Lê avaliações da empresa para análise interna.',
    resource: 'filtra',
    operation: 'read',
    risk: 'low',
    requiresApproval: false,
    async execute(empresaId, input) {
      const limit = Math.min(Math.max(Number(input.limit || 20), 1), 100);
      return getDb().all('SELECT id,name,rating,comment,ai_tags,createdAt FROM reviews WHERE empresa_id=? ORDER BY createdAt DESC LIMIT ?', [empresaId, limit]);
    },
  },
  'reviews.analyze': {
    id: 'reviews.analyze',
    description: 'Agrega sinais básicos das avaliações sem efeito externo.',
    resource: 'filtra',
    operation: 'analyze',
    risk: 'low',
    requiresApproval: false,
    async execute(empresaId) {
      const row = await getDb().get('SELECT COUNT(*) AS total, AVG(rating) AS average_rating FROM reviews WHERE empresa_id=?', [empresaId]);
      return { total: Number(row?.total || 0), averageRating: row?.average_rating == null ? null : Number(row.average_rating) };
    },
  },
  'search-console.query': {
    id: 'search-console.query',
    description: 'Consulta dados reais do Google Search Console da propriedade conectada pela empresa.',
    resource: 'seo',
    operation: 'read',
    risk: 'low',
    requiresApproval: false,
    async execute(empresaId, input) {
      return queryGoogleSearchConsole(empresaId, {
        startDate: String(input.startDate || ''),
        endDate: String(input.endDate || ''),
        dimensions: Array.isArray(input.dimensions) ? input.dimensions.map(String) : ['query', 'page'],
        type: String(input.type || 'web'),
        dimensionFilterGroups: Array.isArray(input.dimensionFilterGroups) ? input.dimensionFilterGroups : undefined,
        rowLimit: Number(input.rowLimit || 1000),
        startRow: Number(input.startRow || 0),
      });
    },
  },
  'dot.goals.read': {
    id: 'dot.goals.read',
    description: 'Consulta os objetivos operacionais atuais do DOT.',
    resource: 'operations',
    operation: 'read',
    risk: 'low',
    requiresApproval: false,
    async execute(empresaId) {
      return getDb().all('SELECT id,title,description,status,progress,source,updated_at,last_activity_at FROM dot_agent_goals WHERE empresa_id=? AND status<>? ORDER BY updated_at DESC LIMIT 50', [empresaId, 'archived']);
    },
  },
};

function validateToolInput(toolId: string, input: Record<string, unknown>) {
  if (toolId === 'reviews.read') {
    const limit = input.limit;
    if (limit !== undefined && (!Number.isFinite(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
      throw new Error('reviews.read: limit deve estar entre 1 e 100.');
    }
  }
  if (toolId === 'search-console.query') {
    const startDate = String(input.startDate || '');
    const endDate = String(input.endDate || '');
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(startDate) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(endDate)) {
      throw new Error('search-console.query: startDate e endDate devem estar em YYYY-MM-DD.');
    }
    const rowLimit = input.rowLimit === undefined ? 1000 : Number(input.rowLimit);
    if (!Number.isFinite(rowLimit) || rowLimit < 1 || rowLimit > 25000) {
      throw new Error('search-console.query: rowLimit deve estar entre 1 e 25000.');
    }
    if (input.dimensions !== undefined && !Array.isArray(input.dimensions)) {
      throw new Error('search-console.query: dimensions deve ser um array.');
    }
  }
}
 
export function listDotTools(): Array<Omit<DotToolDefinition, 'execute'>> {
  return Object.values(tools).map(({ execute, ...definition }) => definition);
}

export async function invokeDotTool(input: {
  empresaId: string;
  toolId: string;
  actorType: 'dot' | 'user' | 'system';
  actorUserId?: string | null;
  input?: Record<string, unknown>;
}) {
  const definition = tools[input.toolId];
  if (!definition) throw new Error('Ferramenta DOT não registrada.');
  if (definition.requiresApproval) throw new Error('Esta ferramenta exige aprovação e não pode ser chamada diretamente.');
  const params = input.input || {};
  try {
    try {
      validateToolInput(definition.id, params);
    } catch (error: any) {
      const message = String(error?.message || error);
      await audit({ ...input, operation: definition.operation, allowed: false, error: message });
      throw error;
    }
    const autonomousRead = input.actorType === 'system'
      && (definition.operation === 'read' || definition.operation === 'analyze')
      && process.env.DOT_AUTONOMOUS_READ_ENABLED !== '0';
    if (!autonomousRead) {
      await requireDotAccess(input.empresaId, definition.resource, definition.operation, input.actorUserId || null, { toolId: definition.id, actorType: input.actorType, actorUserId: input.actorUserId || null });
    }
    const result = await definition.execute(input.empresaId, params);
    await audit({ ...input, operation: definition.operation, allowed: true, result });
    return { ok: true, tool: definition.id, result };
  } catch (error: any) {
    const message = String(error?.message || error);
    await audit({ ...input, operation: definition.operation, allowed: false, error: message });
    throw error;
  }
}
