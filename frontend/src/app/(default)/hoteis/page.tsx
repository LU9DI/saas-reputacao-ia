import type { Metadata } from 'next';
import { SeoLanding } from '../../components/SeoLanding';
import { OG_IMAGE_META } from '../../lib/socialMetadata';

export const metadata: Metadata = {
  title: 'Gestão de avaliações e reputação para hotéis',
  description:
    'Organize avaliações de hóspedes, identifique padrões de experiência e transforme feedback em ações para melhorar a reputação do hotel.',
  alternates: {
    canonical: 'https://filtraai.com/hoteis',
    languages: {
      'pt-BR': 'https://filtraai.com/hoteis',
      en: 'https://filtraai.com/en/hotels',
      es: 'https://filtraai.com/es/hoteles',
      'x-default': 'https://filtraai.com/hoteis',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/hoteis',
    title: 'Gestão de avaliações e reputação para hotéis | Filtra.AI',
    description: 'Organize avaliações de hóspedes, identifique padrões de experiência e transforme feedback em ações para melhorar a reputação do hotel.',
    images: [OG_IMAGE_META],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestão de avaliações e reputação para hotéis | Filtra.AI',
    description: 'Organize avaliações de hóspedes e transforme feedback em ações para melhorar a reputação do hotel.',
    images: [OG_IMAGE_META.url],
  },
};

export default function HoteisPage() {
  return (
    <SeoLanding
      h1="Hotéis: transforme avaliações de hóspedes em melhoria"
      lead="Avaliações revelam muito mais do que uma nota. O Filtra.AI organiza feedback de hóspedes para identificar padrões de experiência, pontos de atrito e oportunidades de melhoria."
      breadcrumbHref="/hoteis"
      contextLinks={[
        { href: '/turismo', title: 'Reputação para turismo e hotelaria', description: 'Veja como organizar feedback ao longo da jornada do visitante.' },
        { href: '/blog/reputacao-online-hoteis', title: 'Como aprender com avaliações de hóspedes', description: 'Aprofunde a leitura por jornada, recorrência e comparação de unidades.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture o acompanhamento de avaliações e percepção pública.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Encontre temas recorrentes sem depender de leitura manual de cada comentário.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece identificando padrões e oportunidades na reputação do hotel.' },
      ]}
      sections={[
        {
          heading: 'O que os hóspedes estão dizendo',
          body: 'Avaliações podem revelar recorrências sobre limpeza, quartos, atendimento, café da manhã, localização, ruído, manutenção, comunicação e outros pontos da estadia. O objetivo é encontrar padrões, não tratar um comentário isolado como diagnóstico.',
        },
        {
          heading: 'Reputação e experiência caminham juntas',
          body: 'A reputação pública é consequência de experiências reais. Ao organizar feedback, a equipe consegue levar temas recorrentes para as áreas responsáveis e também reconhecer práticas que os hóspedes valorizam.',
        },
        {
          heading: 'Da recepção à gestão',
          body: 'Feedback estruturado pode apoiar reuniões de operação, atendimento e qualidade. Em vez de depender de planilhas ou comentários espalhados, a equipe passa a trabalhar com temas mais claros e comparáveis.',
        },
        {
          heading: 'Hotéis, pousadas e redes',
          body: 'A lógica pode ser aplicada a diferentes operações de hospedagem. Em estruturas com várias unidades, a análise por operação ajuda a distinguir problemas locais de padrões que merecem atenção mais ampla.',
        },
        {
          heading: 'Comece com um piloto de 7 dias',
          body: 'Teste o fluxo em uma unidade ou operação, observe os feedbacks recebidos e identifique os temas mais recorrentes. Depois, use o aprendizado para decidir como ampliar o processo.',
        },
        {
          heading: 'Cinco momentos da jornada do hóspede',
          body: 'Reserva, chegada, estadia, saída e pós-estadia geram expectativas diferentes. Um problema de comunicação antes da chegada não deve ser tratado como uma reclamação sobre o quarto; um elogio ao café da manhã não resume toda a experiência. Classificar o momento ajuda a encaminhar o sinal para a equipe certa.',
        },
        {
          heading: 'Compare unidades com contexto',
          body: 'Uma unidade com nota menor pode receber mais hóspedes ou enfrentar uma temporada mais difícil. Compare volume, ocupação, período e temas, não apenas a média. Em redes, a visão consolidada mostra padrões; a visão local mostra a causa que pode ser corrigida.',
        },
        {
          heading: 'Resposta pública e recuperação',
          body: 'Responda com objetividade, reconheça o desconforto e indique o canal adequado para tratar dados específicos. Depois, registre a causa e acompanhe a correção. O objetivo não é apagar a crítica, mas demonstrar cuidado e reduzir a chance de o mesmo problema aparecer em outras avaliações.',
        },
      ]}
      faq={[
        {
          question: 'Como pedir avaliação ao hóspede sem incomodar?',
          answer: 'Escolha um momento natural, como o check-out ou a mensagem pós-estadia, e use um caminho curto para o perfil. Não pressione, não condicione benefícios à nota e não selecione apenas hóspedes satisfeitos. O hóspede deve se sentir livre para avaliar ou não.',
        },
        {
          question: 'Como comparar hotéis de portes diferentes?',
          answer: 'Leve em conta volume de hóspedes, ocupação, sazonalidade e tipo de operação. A nota média sozinha pode enganar; analise temas recorrentes, recência, avaliações sem resposta e ações concluídas. Compare períodos equivalentes em vez de tirar conclusões de meses com demandas diferentes.',
        },
        {
          question: 'O que fazer com uma avaliação negativa de hóspede?',
          answer: 'Investigue o fato, responda com respeito e evite discutir detalhes pessoais em público. Quando necessário, convide para o canal privado, registre a causa e acompanhe a correção. Não ofereça benefícios para remover ou alterar a avaliação.',
        },
      ]}
    />
  );
}
