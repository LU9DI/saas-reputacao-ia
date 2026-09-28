import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Gestão de reputação para franquias e redes | Filtra.AI',
  description:
    'Organize avaliações e feedback de várias unidades, identifique padrões e acompanhe reputação local com o Filtra.AI para franquias e redes.',
  alternates: { canonical: '/franquias' },
};

export default function FranquiasPage() {
  return (
    <SeoLanding
      h1="Franquias e redes: visão da reputação por unidade"
      lead="Cada unidade influencia a percepção da marca. O Filtra.AI ajuda redes e franquias a organizar avaliações e feedback, identificar padrões e enxergar onde a experiência precisa de atenção."
      sections={[
        {
          heading: 'Visão por unidade',
          body: 'Organize os sinais de reputação de cada endereço para separar problemas locais de padrões que aparecem em várias unidades.',
        },
        {
          heading: 'Compare padrões de experiência',
          body: 'Observe temas recorrentes em atendimento, tempo de espera, qualidade, comunicação e outros pontos que afetam a percepção do cliente.',
        },
        {
          heading: 'Apoie os franqueados',
          body: 'Transforme feedback em informação operacional que pode ser compartilhada com a unidade responsável, mantendo a decisão e a resposta com as equipes.',
        },
        {
          heading: 'Escala sem perder contexto',
          body: 'Uma estrutura centralizada facilita acompanhar várias unidades sem tratar todas como se tivessem exatamente os mesmos problemas.',
        },
        {
          heading: 'Teste uma unidade primeiro',
          body: 'Ative o trial de 7 dias em uma unidade piloto, valide o fluxo e depois avalie a expansão para a rede.',
        },
      ]}
    />
  );
}
