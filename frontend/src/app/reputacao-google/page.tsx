import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Reputação no Google: gestão de avaliações e confiança',
  description:
    'Como gerir reputação no Google, organizar avaliações e transformar feedback em ações de crescimento com a Filtra.AI.',
  alternates: {
    canonical: 'https://filtraai.com/reputacao-google',
    languages: {
      'pt-BR': 'https://filtraai.com/reputacao-google',
      en: 'https://filtraai.com/en/google-reputation',
      es: 'https://filtraai.com/es/reputacion-google',
      'x-default': 'https://filtraai.com/reputacao-google',
    },
  },
  };
}

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
        { href: '/blog/seo-local-avaliacoes-local-pack', title: 'SEO local e avaliações', description: 'Conecte reputação, Google Maps e presença local.' },
        { href: '/blog/google-business-profile-avaliacoes', title: 'Rotina de Google Business Profile', description: 'Organize perfil, avaliações e acompanhamento da presença local.' },
        { href: '/blog/velocity-reviews-google-maps-2026', title: 'Avaliações recentes no Google Maps', description: 'Entenda por que a cadência de novas avaliações importa para a percepção atual.' },
        { href: '/blog/como-responder-avaliacoes-negativas', title: 'Como responder avaliações negativas', description: 'Veja um processo para responder com contexto e corrigir a causa.' },
        { href: '/agencias', title: 'Gestão de reputação para agências de SEO local', description: 'Transforme reputação em uma oferta recorrente para sua carteira de clientes.' },
      ]}
      sections={[
        { heading: 'O que constrói reputação no Google', body: 'Reputação é resultado da experiência percebida, do volume e da consistência das avaliações e da capacidade da empresa de aprender com o que os clientes relatam.' },
        { heading: 'Crie um fluxo consistente de avaliações', body: 'Torne o caminho até a avaliação simples e natural, usando pontos de contato adequados ao fim da compra, atendimento, entrega ou visita.' },
        { heading: 'Leia temas além das estrelas', body: 'A nota indica intensidade, mas os comentários ajudam a explicar causas. Agrupe temas como atendimento, prazo, qualidade, preço e comunicação.' },
        { heading: 'Conecte reputação à operação', body: 'Quando um tema se repete, transforme-o em sinal para a área responsável. O valor da reputação está em alimentar decisões concretas de melhoria.' },
        { heading: 'Acompanhe a evolução', body: 'Monitore volume, percepção e temas recorrentes ao longo do tempo para descobrir se as mudanças internas realmente aparecem na experiência do cliente.' },
        { heading: 'Google Business Profile: a base da presença local', body: 'Antes de avaliar a empresa, o cliente encontra categorias, horários, endereço, fotos, serviços e respostas no perfil do Google. Mantenha essas informações consistentes com o site e com a operação real. Um perfil completo não garante posição, mas reduz dúvidas e facilita o contato.' },
        { heading: 'Avaliações recentes e percepção atual', body: 'Uma média alta com avaliações antigas pode não representar a experiência de hoje. Acompanhe a recência junto da nota e dos comentários. Picos artificiais de avaliações não são uma estratégia sustentável; uma cadência ligada ao atendimento real mostra melhor o que os clientes estão vivendo.' },
        { heading: 'Como responder avaliações públicas', body: 'Agradeça pelo retorno, reconheça o ponto levantado e evite discutir detalhes pessoais ou transformar a resposta em debate. Quando o caso exigir dados do cliente, convide para o canal privado. A resposta deve explicar o que a empresa pode fazer, sem prometer o que não está sob seu controle.' },
      ]}
      faq={[
        {
          question: 'A nota média é o fator mais importante para a reputação no Google?',
          answer: 'A nota é visível e influencia a confiança, mas não resume a reputação. Volume, recência, conteúdo das avaliações, respostas e experiência real também importam. O Google usa diversos sinais no ranking local, e não existe garantia de posição baseada apenas em estrelas.',
        },
        {
          question: 'Posso pedir avaliações aos clientes?',
          answer: 'Sim. Convide clientes reais de forma ampla, sem selecionar apenas quem provavelmente dará nota alta e sem oferecer benefícios em troca da avaliação. Facilite o acesso ao perfil e siga as políticas do Google.',
        },
        {
          question: 'Com que frequência devo acompanhar a reputação no Google?',
          answer: 'Depende do volume de atendimentos. Em operações com muitas avaliações, uma revisão semanal de novos comentários e temas críticos ajuda. Para tendências, compare períodos mensais ou trimestrais e registre as ações tomadas.',
        },
      ]}
    />
  );
}
