export type DotCommunicationTier = 'simple' | 'complex';

export function dotCommunicationTier(message: string): DotCommunicationTier {
  const q = String(message || '').toLowerCase();
  return /\b(por que|porque|causa|motivo|compare|comparar|estrategia|estratégia|plano|planeje|priorize|prioridade|impacto|risco|previsão|previsao|diagnostique|investigue|análise profunda|analise profunda)\b/.test(q)
    ? 'complex'
    : 'simple';
}

function cleanLead(text: string): string {
  return text
    .replace(/^\s*(claro[.!]?|com certeza[.!]?|certamente[.!]?|vamos analisar[.!]?)[\s\n]*/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeHeading(text: string): string {
  return text
    .replace(/^\s*(Conclusão|Resumo|Recomendação|Recomendacao|Próximo passo|Proximo passo|Por que importa|Porquê|Por que)\s*:\s*/gim, (_, h) => `### ${h}\n`)
    .replace(/^\s*#{4,}\s*/gm, '### ');
}

function trimToSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const boundary = Math.max(
    cut.lastIndexOf('. '),
    cut.lastIndexOf('.\\n'),
    cut.lastIndexOf('! '),
    cut.lastIndexOf('? '),
  );
  return (boundary >= Math.floor(maxChars * 0.55) ? cut.slice(0, boundary + 1) : cut).trim() + '…';
}

export function formatDotResponse(raw: string, tier: DotCommunicationTier): string {
  let text = normalizeHeading(cleanLead(String(raw || '')));
  if (!text) return 'Não consegui concluir a análise agora.';

  const maxChars = tier === 'complex' ? 1800 : 1100;
  text = trimToSentence(text, maxChars);

  // Uma única ação principal deixa a resposta acionável sem transformar o DOT em relatório.
  text = text.replace(/\n{3,}/g, '\n\n');
  return text;
}

export function buildDotCommunicationInstructions(tier: DotCommunicationTier): string {
  const maxChars = tier === 'complex' ? 1800 : 1100;
  return `
CAMADA DE COMUNICAÇÃO DO DOT:
- Escreva em português do Brasil.
- Seja direto. O usuário deve entender a conclusão em poucos segundos.
- Máximo aproximado: ${maxChars} caracteres.
- Comece pela conclusão, não por uma introdução.
- Use frases curtas e vocabulário simples.
- Estruture, quando houver análise: "### O que encontrei", "### Por que importa", "### Recomendo", "### Próximo passo".
- Não use todas as seções se não forem necessárias.
- Mostre no máximo 4 evidências relevantes.
- Termine com UMA ação principal ou uma pergunta objetiva somente quando realmente precisar da decisão do usuário.
- Não repita a pergunta do usuário.
- Não diga "com base na análise", "é importante ressaltar" ou frases burocráticas.
- Não invente dados, ações executadas, integrações ou resultados.
- Se algo não puder ser executado, diga claramente o que está preparado e o que depende de autorização.
`.trim();
}
