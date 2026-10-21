import type { Metadata } from 'next';
import ResearchPlaceholder from '../../../components/reputation-index/ResearchPlaceholder';

const canonical = 'https://filtraai.com/indice-reputacao-filtra/regioes';

export const metadata: Metadata = {
  title: 'Reputação empresarial por região | Índice Filtra',
  description: 'Escopo e metodologia planejados para análises agregadas de reputação por município, estado e região.',
  alternates: { canonical },
  robots: { index: false, follow: true },
};

export default function RegioesPage() {
  return (
    <ResearchPlaceholder
      eyebrow="Pesquisa geográfica"
      title="Reputação empresarial por região"
      description="Uma futura leitura regional de reputação que só será publicada quando a localização das empresas puder ser verificada e houver cobertura suficiente para comparações responsáveis."
      sections={[
        {
          title: 'Localização com proveniência',
          body: 'Município, UF e região devem vir de dados estruturados e verificados. Não inferiremos localização por nome comercial, telefone ou outros sinais indiretos.',
          bullets: ['Município e UF normalizados', 'Fonte de localização documentada', 'Correção e atualização rastreáveis'],
        },
        {
          title: 'Comparações com contexto',
          body: 'Diferenças entre regiões podem refletir composição setorial, cobertura das fontes ou volume de avaliações. Esses fatores serão descritos antes de qualquer conclusão.',
          bullets: ['Amostra mínima por recorte', 'Composição por setor divulgada', 'Supressão de grupos pequenos para proteger privacidade'],
        },
      ]}
    />
  );
}
