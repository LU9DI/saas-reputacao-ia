import type { Metadata } from 'next';
import ResearchPlaceholder from '../../../components/reputation-index/ResearchPlaceholder';

const canonical = 'https://filtraai.com/indice-reputacao-filtra/relatorio-anual';

export const metadata: Metadata = {
  title: 'Relatório anual de reputação empresarial | Índice Filtra',
  description: 'Escopo do relatório anual de reputação empresarial, com metodologia, cobertura e limitações auditáveis.',
  alternates: { canonical },
  robots: { index: false, follow: true },
};

export default function RelatorioAnualPage() {
  return (
    <ResearchPlaceholder
      eyebrow="Publicação de pesquisa"
      title="Relatório anual de reputação empresarial"
      description="O relatório anual reunirá os resultados que passarem pela validação metodológica e de privacidade, com transparência sobre o que os dados permitem — e o que não permitem — concluir."
      sections={[
        {
          title: 'Descobertas sustentadas por dados',
          body: 'Cada conclusão será vinculada a indicadores, cobertura, período e critérios de inclusão. Hipóteses e interpretação editorial serão diferenciadas dos resultados observados.',
          bullets: ['Tabelas e gráficos reproduzíveis', 'Fontes e datas de coleta', 'Separação entre fato e interpretação'],
        },
        {
          title: 'Transparência editorial',
          body: 'O documento registrará limitações, conflitos de cobertura, alterações de metodologia e eventuais correções publicadas após o lançamento.',
          bullets: ['Metodologia versionada', 'Histórico público de revisões', 'Nenhuma exposição de avaliações individuais'],
        },
      ]}
    />
  );
}
