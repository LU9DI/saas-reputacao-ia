import { callAI } from '../groqService.js';
import { invokeDotTool, listDotTools, type DotToolDefinition } from './dotToolRegistry.js';
import { getDb } from '../lib/db.js';

export type DotRuntimeEvent = {
  type: 'model' | 'tool' | 'final' | 'approval';
  name: string;
  input?: Record<string, unknown>;
  output?: unknown;
  at: string;
};

export type DotAgentRunResult = {
  text: string;
  provider: string;
  latency_ms: number;
  tokens: number;
  events: DotRuntimeEvent[];
  tool_calls: number;
  replans: number;
  stopped_reason: string;
};

type RuntimeDecision =
  | { type: 'tool'; tool_id: string; input?: Record<string, unknown>; rationale?: string }
  | { type: 'final'; message: string }
  | { type: 'approval'; message: string; action?: string };

const MAX_ITERATIONS = Math.max(2, Math.min(8, Number(process.env.DOT_AGENT_MAX_ITERATIONS || 6)));

function cleanJson(raw: string): string {
  return raw
    .replace(/^\s*\`\`\`(?:json)?/i, '')
    .replace(/\`\`\`\s*$/i, '')
    .trim();
}

function parseDecision(raw: string): RuntimeDecision {
  const cleaned = cleanJson(raw);
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed?.type === 'tool' && typeof parsed.tool_id === 'string') {
      return {
        type: 'tool',
        tool_id: parsed.tool_id,
        input: parsed.input && typeof parsed.input === 'object' ? parsed.input : {},
        rationale: typeof parsed.rationale === 'string' ? parsed.rationale : undefined,
      };
    }
    if (parsed?.type === 'approval') {
      return {
        type: 'approval',
        message: String(parsed.message || 'A aprovação do responsável é necessária antes da próxima ação.'),
        action: typeof parsed.action === 'string' ? parsed.action : undefined,
      };
    }
    if (parsed?.type === 'final') {
      return { type: 'final', message: String(parsed.message || '').trim() };
    }
  } catch {
    // Fallback seguro: texto não estruturado nunca dispara ferramenta.
  }
  return { type: 'final', message: raw.trim() };
}

function toolCatalog(tools: Array<Omit<DotToolDefinition, 'execute'>>) {
  return tools.map((tool) => ({
    id: tool.id,
    description: tool.description,
    risk: tool.risk,
    requiresApproval: tool.requiresApproval,
    resource: tool.resource,
    operation: tool.operation,
  }));
}

async function ensureRuntimeSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    actor_user_id TEXT,
    session_id TEXT NOT NULL,
    objective TEXT NOT NULL,
    status TEXT NOT NULL,
    iterations INTEGER NOT NULL DEFAULT 0,
    tool_calls INTEGER NOT NULL DEFAULT 0,
    replans INTEGER NOT NULL DEFAULT 0,
    stopped_reason TEXT,
    events_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    completed_at TEXT
  )`);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_runs_empresa ON dot_agent_runs(empresa_id, created_at)');
}

async function persistRun(input: {
  empresaId: string;
  actorUserId?: string | null;
  sessionId: string;
  objective: string;
  status: string;
  iterations: number;
  toolCalls: number;
  replans: number;
  stoppedReason: string;
  events: DotRuntimeEvent[];
  createdAt: string;
  completedAt: string;
}) {
  await ensureRuntimeSchema();
  await getDb().run(
    'INSERT INTO dot_agent_runs (empresa_id,actor_user_id,session_id,objective,status,iterations,tool_calls,replans,stopped_reason,events_json,created_at,completed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      input.empresaId,
      input.actorUserId || null,
      input.sessionId,
      input.objective.slice(0, 4000),
      input.status,
      input.iterations,
      input.toolCalls,
      input.replans,
      input.stoppedReason,
      JSON.stringify(input.events).slice(0, 100_000),
      input.createdAt,
      input.completedAt,
    ],
  );
}

export async function runDotAgent(input: {
  empresaId: string;
  actorUserId?: string | null;
  sessionId: string;
  objective: string;
  context: string;
  history?: string;
  maxTokens: number;
  allowTools?: boolean;
}): Promise<DotAgentRunResult> {
  const started = Date.now();
  const events: DotRuntimeEvent[] = [];
  const tools = input.allowTools === false ? [] : listDotTools();
  const catalog = toolCatalog(tools);
  let workingContext = input.context;
  let lastProvider = 'unknown';
  let totalTokens = 0;
  let totalLatency = 0;
  let toolCalls = 0;
  let replans = 0;
  let stoppedReason = 'max_iterations';
  let finalText = '';
  let spentTokens = 0;

  const system = `Você é o núcleo operacional do Filtra Dot.
Você NÃO é um chatbot genérico. Você recebe um objetivo e deve investigar, usar ferramentas permitidas, observar os resultados e replanejar até ter evidência suficiente para responder.
A cada ciclo escolha EXATAMENTE UMA saída JSON:
{"type":"tool","tool_id":"...","input":{},"rationale":"..."}
ou
{"type":"final","message":"..."}
ou
{"type":"approval","message":"...","action":"..."}.
Nunca invente ferramenta, dados, execução ou resultado.
Ferramentas de leitura/análise são executáveis pelo núcleo. Ações com efeito ou aprovação NÃO devem ser executadas pelo modelo: produza "approval" quando forem necessárias.
Depois de cada ferramenta, avalie o resultado e decida se precisa de outra ferramenta. Não repita a mesma ferramenta com os mesmos argumentos sem uma razão.
Finalize quando houver evidência suficiente; seja objetivo e cite quais evidências sustentam a conclusão.
Catálogo de ferramentas:
${JSON.stringify(catalog)}

Contexto atual:
${workingContext}

Histórico recente:
${input.history || '(sem histórico)'}`;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
    const user = iteration === 1
      ? `OBJETIVO DO USUÁRIO:\n${input.objective}\n\nDecida o primeiro passo operacional.`
      : `OBJETIVO:\n${input.objective}\n\nRESULTADOS ACUMULADOS:\n${workingContext}\n\nEscolha o próximo passo. Se já houver evidência suficiente, finalize.`;

    const remainingBudget = Math.max(0, input.maxTokens - spentTokens);
    if (remainingBudget <= 0) {
      stoppedReason = 'token_budget_exhausted';
      break;
    }
    const result = await callAI(
      system,
      user,
      Math.max(1, Math.min(remainingBudget, 900)),
      0.2,
      { empresaId: input.empresaId, tipo: 'filtra_dot_agent_runtime' },
    );

    lastProvider = result.provider;
    totalTokens += result.tokens;
    spentTokens += result.tokens;
    totalLatency += result.latency_ms;
    events.push({
      type: 'model',
      name: `decision_${iteration}`,
      output: result.text.slice(0, 4000),
      at: new Date().toISOString(),
    });

    const decision = parseDecision(result.text);

    if (decision.type === 'final') {
      finalText = decision.message || 'Concluí a análise com as evidências disponíveis.';
      stoppedReason = 'final';
      break;
    }

    if (decision.type === 'approval') {
      finalText = decision.message;
      events.push({
        type: 'approval',
        name: 'approval_required',
        input: { action: decision.action || null },
        at: new Date().toISOString(),
      });
      stoppedReason = 'approval_required';
      break;
    }

    const definition = tools.find((tool) => tool.id === decision.tool_id);
    if (!definition) {
      workingContext += '\nFerramenta solicitada não existe. Escolha outra ferramenta ou finalize.';
      replans += 1;
      continue;
    }

    try {
      const toolResult = await invokeDotTool({
        empresaId: input.empresaId,
        toolId: decision.tool_id,
        actorType: 'dot',
        actorUserId: input.actorUserId || null,
        input: decision.input || {},
      });
      toolCalls += 1;
      events.push({
        type: 'tool',
        name: decision.tool_id,
        input: decision.input || {},
        output: toolResult.result,
        at: new Date().toISOString(),
      });
      workingContext += `\n\n[FERRAMENTA ${decision.tool_id}]\n${JSON.stringify(toolResult.result).slice(0, 20_000)}`;
      replans += 1;
    } catch (error: any) {
      toolCalls += 1;
      const message = String(error?.message || error);
      events.push({
        type: 'tool',
        name: decision.tool_id,
        input: decision.input || {},
        output: { error: message },
        at: new Date().toISOString(),
      });
      workingContext += `\n\n[FALHA DA FERRAMENTA ${decision.tool_id}] ${message}`;
      replans += 1;
    }
  }

  if (!finalText) {
    finalText = 'Interrompi a investigação no limite operacional desta rodada. Posso continuar a partir das evidências já coletadas.';
  }

  const completedAt = new Date().toISOString();
  await persistRun({
    empresaId: input.empresaId,
    actorUserId: input.actorUserId,
    sessionId: input.sessionId,
    objective: input.objective,
    status: stoppedReason === 'approval_required' ? 'waiting_approval' : 'completed',
    iterations: events.filter((event) => event.type === 'model').length,
    toolCalls,
    replans,
    stoppedReason,
    events,
    createdAt: new Date(started).toISOString(),
    completedAt,
  });

  return {
    text: finalText,
    provider: lastProvider,
    latency_ms: totalLatency,
    tokens: totalTokens,
    events,
    tool_calls: toolCalls,
    replans,
    stopped_reason: stoppedReason,
  };
}
