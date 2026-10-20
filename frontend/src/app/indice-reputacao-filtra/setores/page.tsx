import type { Metadata } from 'next';
import ResearchPlaceholder from '../../../components/reputation-index/ResearchPlaceholder';

const canonical = 'https://filtraai.com/indice-reputacao-filtra/setores';

export const metadata: Metadata = {
  title: 'Reputação empresarial por setor | Índice Filtra',
  description: 'Escopo e metodologia planejados para análises agregadas de reputação por setor econômico.',
  alternates: { canonical },
  robots: { index: false, follow: true },
};

export default function SetoresPage() {
  return (
    <ResearchPlaceholder
      eyebrow="Pesquisa por segmento"
      title="Reputação empresarial por setor"
      description="Uma futura visão comparável de como avaliações, notas e respostas se comportam em diferentes atividades econômicas, sem transformar amostras frágeis em benchmarks de mercado."
      sections={[
        {
          title: 'Segmentação verificável',
          body: 'Cada empresa deverá ser classificada por uma fonte verificável e uma taxonomia documentada. Casos ambíguos serão separados ou excluídos, não classificados por suposição.',
          bullets: ['Taxonomia versionada', 'Origem e data de validação', 'Tratamento de empresas com múltiplas atividades'],
        },
        {
          title: 'Indicadores comparáveis',
          body: 'Os resultados poderão incluir distribuição de notas, volume e recência de avaliações e taxa de resposta, desde que cada fonte permita medir esses indicadores de forma consistente.',
          bullets: ['Tamanho da amostra visível', 'Período de coleta explícito', 'Sem ranking enquanto houver vieses relevantes'],
        },
      ]}
    />
  );
}
