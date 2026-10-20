import type { RelatorioMensalSnapshot } from '../../src/lib/relatorioMensalHtml';

/** Dados fictícios usados apenas em testes e na prévia demonstrativa. */
export const fullReport: RelatorioMensalSnapshot = {
  empresa: { id: 'empresa-demo', nome: 'Empresa Demonstração Ltda.' },
  periodo: '2026-09',
  kpis: {
    avaliacoes: 2,
    nota_media: 3.5,
    positivas: 1,
    criticas: 1,
    tratadas: 0,
    percentual_positivas: 50,
    percentual_criticas: 50,
  },
  resumo_executivo: 'No período analisado, a empresa registrou 2 avaliações válidas, com nota média de 3.5/5. Desse total, 50% estão na faixa positiva (4–5 estrelas) e 1 está na faixa crítica (1–3 estrelas). O conjunto indica desempenho estável, com pontos de atenção.',
  sentimento: { positivo: 1, neutro: 0, negativo: 1 },
  temas: {
    atencao: [{ tema: 'Atendimento', volume: 1 }],
    positivos: [{ tema: 'Agilidade', volume: 1 }],
  },
  riscos: [
    {
      nivel: 'alto',
      titulo: 'Concentração de avaliações críticas',
      evidencias: '50% das avaliações válidas do período estão na faixa crítica (1–3 estrelas).',
    },
    {
      nivel: 'medio',
      titulo: 'Unidade com menor nota: Centro',
      evidencias: 'Média de 2.0/5 em 1 avaliações, abaixo das demais unidades com avaliações no período.',
    },
  ],
  oportunidades: [
    {
      titulo: 'Replicar o que funciona em Agilidade',
      evidencias: '1 ocorrência(s) associadas a avaliações de 4–5 estrelas.',
      acao_recomendada: 'Validar com a equipe quais práticas estão associadas a esse tema e testar sua replicação em outras unidades ou turnos.',
    },
    {
      titulo: 'Testar uma melhoria para Atendimento',
      evidencias: '1 ocorrência(s) associadas a avaliações não positivas (1–3 estrelas).',
      acao_recomendada: 'Definir uma intervenção de baixo risco, acompanhar a resposta nas próximas avaliações e comparar o resultado no próximo ciclo.',
    },
  ],
  recomendacoes: [
    'Priorizar o tratamento das 1 avaliações críticas (1–3 estrelas), começando pelas mais recentes e pelas que citam temas recorrentes.',
    'Investigar os temas mais citados nas avaliações não positivas e validar as causas com as equipes antes de definir mudanças amplas.',
    'Acompanhar o tema recorrente “Atendimento” no próximo ciclo para verificar se a frequência aumenta ou diminui.',
  ],
  narrativa: {
    o_que_aconteceu: 'No período analisado, a empresa registrou 2 avaliações válidas, com nota média de 3.5/5.',
    por_que_importa: 'Foram identificadas 1 avaliações críticas (1–3 estrelas) no período. Esse é um sinal de possível atrito na experiência do cliente: o próximo passo é investigar as causas antes de generalizar mudanças.',
    onde_atuar: 'O período tem avaliações em 2 unidades. Comece pelas unidades com menor nota média e maior proporção de avaliações críticas: é nelas que a experiência do cliente parece mais fragilizada e onde uma ação corretiva tende a gerar efeito mais rápido.',
  },
  ranking_unidades: [
    { id: 'u1', nome: 'Sul', posicao: 1, avaliacoes: 1, nota_media: 5, criticas: 0 },
    { id: 'u2', nome: 'Centro', posicao: 2, avaliacoes: 1, nota_media: 2, criticas: 1 },
  ],
  prioridades_operacionais: [
    {
      prioridade: 'alta',
      unidade: 'Centro',
      evidencia: 'Média 2.0/5; 1 avaliações críticas em 1 avaliações (100%).',
      acao_recomendada: 'Investigar o tema “Atendimento” nesta unidade, validar a causa com a equipe e acompanhar o indicador no próximo ciclo.',
    },
  ],
  radar_estrategico: [
    {
      nivel: 'alto',
      sinal: 'Queda na nota média',
      evidencia: 'A nota média passou de 4.0 para 3.5 em relação a 2026-08. Variações dessa magnitude merecem verificação antes de serem tratadas como tendência.',
      acao: 'Investigar os temas e unidades que mais contribuíram para a queda antes de definir uma ação corretiva.',
    },
    {
      nivel: 'alto',
      sinal: 'Aumento da proporção de avaliações críticas',
      evidencia: 'A proporção de avaliações críticas (1–3 estrelas) subiu de 0% para 50%. Esse movimento pede checagem dos temas por trás das novas avaliações.',
      acao: 'Priorizar as causas recorrentes das avaliações críticas e revisar a resposta operacional.',
    },
  ],
  oportunidades_crescimento: [
    {
      titulo: 'Replicar o que funciona em Agilidade',
      evidencias: '1 ocorrência(s) associadas a avaliações de 4–5 estrelas.',
      acao_recomendada: 'Validar com a equipe quais práticas estão associadas a esse tema e testar sua replicação em outras unidades ou turnos.',
    },
  ],
  geracao: { modo: 'deterministico' },
};

/** Versão mínima equivalente ao que o plano Pro recebe do backend. */
export const proReport: RelatorioMensalSnapshot = {
  empresa: fullReport.empresa,
  periodo: fullReport.periodo,
  kpis: fullReport.kpis,
  resumo_executivo: fullReport.resumo_executivo,
  geracao: fullReport.geracao,
};
