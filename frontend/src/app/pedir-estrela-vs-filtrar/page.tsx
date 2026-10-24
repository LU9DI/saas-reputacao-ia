import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Pedir avaliações vs gerenciar feedback',
    description: 'Compare pedir uma avaliação diretamente no Google com um fluxo de feedback que ajuda a entender a experiência, facilita avaliações genuínas e organiza melhorias. Trial Filtra.AI.',
    alternates: { canonical:'https://filtraai.com/pedir-estrela-vs-filtrar', languages:{ 'pt-BR':'https://filtraai.com/pedir-estrela-vs-filtrar', en:'https://filtraai.com/en/ask-for-stars-vs-filtering', es:'https://filtraai.com/es/pedir-estrellas-vs-filtrar', 'x-default':'https://filtraai.com/pedir-estrela-vs-filtrar' } },
    openGraph: { title:'Pedir avaliações vs gerenciar feedback | Filtra.AI', description:'Compare pedir uma avaliação diretamente no Google com um fluxo de feedback que ajuda a entender a experiência, facilita avaliações genuínas e organiza melhorias. Trial Filtra.AI.', url:'https://filtraai.com/pedir-estrela-vs-filtrar', type:'website',
      images: [OG_IMAGE_META],
    },
  };
}

export default function PedirVsFiltrarPage() {
  return (
    <SeoLanding
      breadcrumbHref="/pedir-estrela-vs-filtrar"
      h1="Pedir avaliação ≠ controlar reputação"
      lead="Muitos negócios só mandam o link do Google. Um fluxo de feedback anterior à avaliação pode revelar problemas e facilitar que clientes compartilhem experiências reais, sem selecionar quem merece ou não um convite."
      contextLinks={[
        { href: '/blog/seo-local-avaliacoes-local-pack', title: 'Pacotes de SEO local e avaliações', description: 'Conecte avaliações, presença local, conteúdo e acompanhamento em uma operação.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Acompanhe avaliações e transforme sinais em decisões.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture monitoramento, respostas e melhoria contínua.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Identifique pontos de atenção na reputação e presença local.' },
      ]}
      sections={[
        {
          heading: 'O problema do “só peça 5★”',
          body: 'Incentivar apenas nota máxima pode violar políticas do Google e gerar desconfiança. O caminho sustentável é facilitar a avaliação honesta e tratar problemas cedo.',
        },
        {
          heading: 'O que um fluxo de feedback faz',
          body: 'No Filtra.AI o cliente inicia um fluxo de feedback próximo à experiência. A empresa pode convidar qualquer cliente a compartilhar uma avaliação genuína no Google e, ao mesmo tempo, oferecer um canal de feedback privado para quem preferir falar diretamente com a equipe.',
        },
        {
          heading: 'Transparência com responsabilidade',
          body: 'O objetivo não é selecionar notas. É facilitar a manifestação de opiniões reais, criar contexto para a equipe resolver falhas operacionais e tornar mais simples que clientes que desejarem deixem avaliações públicas.',
        },
        {
          heading: 'FAQ rápido',
          body: 'O Filtra substitui o Google? Não. Ele organiza o fluxo de feedback e avaliação. O cliente mantém a decisão sobre nota e conteúdo. O canal pode ser adaptado a restaurantes, clínicas, hotéis e outras operações.',
        },
        {
          heading: 'Teste os dois modelos',
          body: 'Compare uma rotina simples de link do Google com uma rotina de feedback estruturado. Observe volume de feedback, temas recorrentes, respostas e evolução da experiência sem criar regras baseadas na nota.',
        },
      ]}
    />
  );
}
