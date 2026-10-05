import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Reputação no Google: gestão de avaliações e confiança | Filtra.AI',
  description:
    'Como gerir reputação no Google, organizar avaliações e transformar feedback em ações de crescimento com a Filtra.AI.',
  alternates: {
    canonical: 'https://filtraai.com/reputacao-google',
    languages: {
      'pt-BR': 'https://filtraai.com/reputacao-google',
      en: 'https://filtraai.com/en/google-reputation',
      es: 'https://filtraai.com/es/reputacion-google',
      zh: 'https://filtraai.com/zh/google-reputation',
      'x-default': 'https://filtraai.com/reputacao-google',
    },
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Reputação no Google: transforme avaliações em gestão"
      lead="A reputação no Google é construída avaliação por avaliação. A Filtra.AI organiza feedback, identifica padrões e transforma sinais de clientes em decisões práticas."
      breadcrumbHref="/reputacao-google"
      contextLinks={[
        { href: '/filtra-ai', title: 'Filtra.AI', description: 'Gestão de reputação, avaliações Google e feedback com IA.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Organize avaliações e feedback para uma rotina de gestão.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture monitoramento, aprendizado e ação.' },
      ]}
      sections={[
        { heading: 'O que constrói reputação no Google', body: 'Reputação é resultado da experiência percebida, do volume e da consistência das avaliações e da capacidade da empresa de aprender com o que os clientes relatam.' },
        { heading: 'Crie um fluxo consistente de avaliações', body: 'Torne o caminho até a avaliação simples e natural, usando pontos de contato adequados ao fim da compra, atendimento, entrega ou visita.' },
        { heading: 'Leia temas além das estrelas', body: 'A nota indica intensidade, mas os comentários ajudam a explicar causas. Agrupe temas como atendimento, prazo, qualidade, preço e comunicação.' },
        { heading: 'Conecte reputação à operação', body: 'Quando um tema se repete, transforme-o em sinal para a área responsável. O valor da reputação está em alimentar decisões concretas de melhoria.' },
        { heading: 'Acompanhe a evolução', body: 'Monitore volume, percepção e temas recorrentes ao longo do tempo para descobrir se as mudanças internas realmente aparecem na experiência do cliente.' },
      ]}
    />
  );
}
