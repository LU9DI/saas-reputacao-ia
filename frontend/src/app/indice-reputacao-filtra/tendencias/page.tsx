import type { Metadata } from 'next';
import ResearchPlaceholder from '../../../components/reputation-index/ResearchPlaceholder';

const canonical = 'https://filtraai.com/indice-reputacao-filtra/tendencias';

export const metadata: Metadata = {
  title: 'Tendências de reputação empresarial | Índice Filtra',
  description: 'Metodologia planejada para observar mudanças temporais em avaliações e indicadores de reputação.',
  alternates: { canonical },
  robots: { index: false, follow: true },
};

export default function TendenciasPage() {
  return (
    <ResearchPlaceholder
      eyebrow="Série temporal"
      title="Tendências de reputação empresarial"
      description="Esta frente acompanhará mudanças ao longo do tempo, sem confundir variação de uma amostra com uma mudança real no mercado."
      sections={[
        {
          title: 'Séries consistentes',
          body: 'Cada período usará regras comparáveis de coleta, inclusão e deduplicação. Mudanças na fonte ou na cobertura serão anotadas para não produzir tendências artificiais.',
          bullets: ['Data de corte e janela explícitas', 'Regras de inclusão versionadas', 'Histórico de correções'],
        },
        {
          title: 'Indicadores possíveis',
          body: 'Conforme a disponibilidade e consistência das fontes, poderão ser observadas a distribuição das notas, recência das avaliações, volume e respostas das empresas.',
          bullets: ['Comparação período a período', 'Intervalos e tamanho de amostra', 'Limitações e quebras de série identificadas'],
        },
      ]}
    />
  );
}
