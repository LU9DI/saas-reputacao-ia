export type DotModelTier = '20b' | '120b';

export type DotModelSelection = {
  model: string;
  tier: DotModelTier;
  reason: 'high_impact_reasoning' | 'straightforward_analysis';
};

function normalize(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function selectDotModel(message: string): DotModelSelection {
  const q = normalize(message);

  const highImpact = [
    /\b(por que|porque|causa|origem|motivo|diagnostique|diagnosticar|investigue|investigar)\b/,
    /\b(estrategia|estrategico|estrategica|plano|planeje|planejar|priorize|prioridade|recomende|recomendacao|decisao|decida)\b/,
    /\b(impacto|risco|previsao|preveja|cenarios|cenario|comparar|comparacao|analise profunda|diagnostico)\b/,
  ];

  const tier: DotModelTier = highImpact.some((pattern) => pattern.test(q)) ? '120b' : '20b';

  return {
    model:
      tier === '120b'
        ? process.env.DOT_GROQ_COMPLEX_MODEL || 'openai/gpt-oss-120b'
        : process.env.DOT_GROQ_SIMPLE_MODEL || 'openai/gpt-oss-20b',
    tier,
    reason: tier === '120b' ? 'high_impact_reasoning' : 'straightforward_analysis',
  };
}
