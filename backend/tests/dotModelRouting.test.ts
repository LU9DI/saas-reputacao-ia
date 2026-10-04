import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDotModel } from '../services/dotModelRouting.js';

const cases: Array<{ question: string; tier: '20b' | '120b'; label: string }> = [
  { question: 'Qual minha nota?', tier: '20b', label: 'factual should be cache-first before model' },
  { question: 'Quantas avaliações tenho?', tier: '20b', label: 'factual should be cache-first before model' },
  { question: 'Quais são meus alertas?', tier: '20b', label: 'factual should be cache-first before model' },
  { question: 'Quais temas mais aparecem?', tier: '20b', label: 'factual should be cache-first before model' },
  { question: 'Quais elogios aparecem?', tier: '20b', label: 'factual should be cache-first before model' },
  { question: 'Quais reclamações aparecem?', tier: '20b', label: 'factual should be cache-first before model' },
  { question: 'Como está o atendimento?', tier: '20b', label: 'straightforward analysis' },
  { question: 'Resuma a situação atual', tier: '20b', label: 'straightforward analysis' },
  { question: 'O que está acontecendo agora?', tier: '20b', label: 'straightforward analysis' },
  { question: 'Como estão as avaliações recentes?', tier: '20b', label: 'straightforward analysis' },
  { question: 'Quais são os principais pontos positivos?', tier: '20b', label: 'straightforward analysis' },
  { question: 'Quais são os principais pontos negativos?', tier: '20b', label: 'straightforward analysis' },
  { question: 'Existe algum padrão recente?', tier: '20b', label: 'straightforward analysis' },
  { question: 'Qual unidade está pior?', tier: '20b', label: 'straightforward analysis' },
  { question: 'Como está a reputação da unidade A?', tier: '20b', label: 'straightforward analysis' },
  { question: 'Por que a nota caiu?', tier: '120b', label: 'cause analysis' },
  { question: 'Qual é a causa da queda?', tier: '120b', label: 'cause analysis' },
  { question: 'Investigue o problema da unidade A', tier: '120b', label: 'investigation' },
  { question: 'Qual ação devo priorizar?', tier: '120b', label: 'priority decision' },
  { question: 'Que estratégia devo seguir?', tier: '120b', label: 'strategy' },
  { question: 'Monte um plano para recuperar a nota', tier: '120b', label: 'planning' },
  { question: 'Qual o impacto desse problema?', tier: '120b', label: 'impact assessment' },
  { question: 'Qual o risco de não agir?', tier: '120b', label: 'risk assessment' },
  { question: 'Qual a previsão para a próxima semana?', tier: '120b', label: 'prediction' },
  { question: 'Compare este mês com o anterior', tier: '120b', label: 'comparison' },
  { question: 'Faça uma análise profunda dos principais problemas', tier: '120b', label: 'deep analysis' },
  { question: 'Qual decisão você recomenda?', tier: '120b', label: 'decision recommendation' },
  { question: 'Recomende o próximo passo', tier: '120b', label: 'recommendation' },
];

for (const item of cases) {
  test(item.label + ': ' + item.question, () => {
    const result = selectDotModel(item.question);
    assert.equal(result.tier, item.tier);
    assert.equal(
      result.model,
      item.tier === '120b' ? 'openai/gpt-oss-120b' : 'openai/gpt-oss-20b',
    );
  });
}

test('routing is accent-insensitive', () => {
  assert.equal(selectDotModel('Por que a nota caiu?').tier, selectDotModel('Por que a nota caiu?').tier);
  assert.equal(selectDotModel('Qual é a recomendação?').tier, '120b');
});

test('environment overrides are respected', () => {
  const previousSimple = process.env.DOT_GROQ_SIMPLE_MODEL;
  const previousComplex = process.env.DOT_GROQ_COMPLEX_MODEL;

  process.env.DOT_GROQ_SIMPLE_MODEL = 'custom/simple';
  process.env.DOT_GROQ_COMPLEX_MODEL = 'custom/complex';

  try {
    assert.equal(selectDotModel('Como está a reputação?').model, 'custom/simple');
    assert.equal(selectDotModel('Por que a nota caiu?').model, 'custom/complex');
  } finally {
    if (previousSimple === undefined) delete process.env.DOT_GROQ_SIMPLE_MODEL;
    else process.env.DOT_GROQ_SIMPLE_MODEL = previousSimple;
    if (previousComplex === undefined) delete process.env.DOT_GROQ_COMPLEX_MODEL;
    else process.env.DOT_GROQ_COMPLEX_MODEL = previousComplex;
  }
});
