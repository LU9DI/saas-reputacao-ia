import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Como melhorar avaliações Google de uma empresa',
  description:
    'Estratégias práticas para aumentar o volume de avaliações Google honestas, entender feedback e melhorar a experiência do cliente.',
  alternates: {
    canonical: 'https://filtraai.com/como-melhorar-avaliacoes-google',
    languages: {
      'pt-BR': 'https://filtraai.com/como-melhorar-avaliacoes-google',
      en: 'https://filtraai.com/en/improve-google-reviews',
      es: 'https://filtraai.com/es/mejorar-resenas-google',
      zh: 'https://filtraai.com/zh/improve-google-reviews',
      'x-default': 'https://filtraai.com/como-melhorar-avaliacoes-google',
    },
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Como melhorar as avaliações Google da sua empresa"
      lead="Melhorar a reputação começa pela experiência e por um processo consistente de coleta de feedback. Veja como transformar esse processo em rotina."
      breadcrumbHref="/como-melhorar-avaliacoes-google"
      contextLinks={[
        { href: '/filtra-ai', title: 'Filtra.AI', description: 'Gestão de reputação, avaliações Google e feedback com IA.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Organize avaliações e feedback.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina contínua.' },
      ]}
      sections={[
        { heading: 'Comece pela experiência', body: 'Mais pedidos de avaliação não compensam problemas recorrentes. Antes de acelerar a coleta, identifique os pontos da jornada que mais geram atrito.' },
        { heading: 'Reduza a fricção para avaliar', body: 'Links diretos, QR codes e chamadas no momento certo tornam o processo simples para quem já decidiu compartilhar a experiência.' },
        { heading: 'Peça no momento adequado', body: 'O melhor momento é aquele em que a experiência ainda está fresca, sem pressão e sem condicionar benefícios a uma nota positiva.' },
        { heading: 'Use críticas como sinal operacional', body: 'Quando um problema aparece repetidamente, registre o tema, encaminhe para o responsável e acompanhe se o padrão diminui nas avaliações seguintes.' },
        { heading: 'Meça qualidade além de volume', body: 'Quantidade é útil, mas também importa a consistência dos temas, a diversidade dos comentários e a evolução da percepção ao longo do tempo.' },
      ]}
    />
  );
}
