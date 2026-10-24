import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export const metadata: Metadata = {
  title: "Gestão de reputação para pet shops | Filtra.AI",
  description: "Organize avaliações sobre atendimento, agendamento, produtos e cuidado com animais para identificar prioridades de experiência.",
  alternates: { canonical: "https://filtraai.com/petshops" },
  openGraph: {
    title: "Gestão de reputação para pet shops | Filtra.AI",
    description: "Organize avaliações sobre atendimento, agendamento, produtos e cuidado com animais para identificar prioridades de experiência.",
    url: "https://filtraai.com/petshops",
    siteName: 'Filtra.AI',
    type: 'website',
    images: [OG_IMAGE_META],
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de reputação online para pet shops"
      lead="Confiança é central para quem escolhe um pet shop. Avaliações podem revelar padrões sobre atendimento, agendamento, disponibilidade de produtos, higiene e comunicação com tutores."
      breadcrumbHref="/petshops"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina de reputação e acompanhamento.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Organize avaliações e temas recorrentes.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e prioridades.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece por um diagnóstico inicial.' },
      ]}
      sections={[
        {
                "heading": "O que acompanhar nas avaliações",
                "body": "Classifique temas como atendimento, espera, agendamento, disponibilidade, limpeza, preços e clareza das orientações. Se o negócio oferece serviços de cuidado animal, encaminhe relatos de segurança ou bem-estar para avaliação rápida e responsável."
        },
        {
                "heading": "Transforme comentários em prioridades",
                "body": "Compare temas ao longo do tempo e defina responsáveis para as causas mais recorrentes. Diferencie reclamações sobre estoque, atendimento ou agenda para que a ação corretiva seja específica e verificável."
        },
        {
                "heading": "Privacidade e respostas responsáveis",
                "body": "Não publique dados de contato, informações de pagamento ou detalhes identificáveis de clientes. Responda com empatia e leve situações que exigem investigação para um canal privado."
        }
]}
      faq={[
        {
                "question": "Que tipo de feedback um pet shop deve monitorar?",
                "answer": "Atendimento, disponibilidade de produtos, agendamento, tempo de espera, limpeza, comunicação de preços e relatos de cuidado animal. A prioridade depende da gravidade e da recorrência."
        },
        {
                "question": "Como pedir avaliações sem pressionar?",
                "answer": "Faça um convite neutro a todos os clientes em um momento adequado e facilite o acesso ao perfil. Não condicione atendimento ou benefícios a uma avaliação positiva."
        },
        {
                "question": "Como tratar uma reclamação grave?",
                "answer": "Registre o relato, encaminhe imediatamente à pessoa responsável e investigue pelos canais apropriados. A resposta pública não deve substituir a apuração nem expor dados pessoais."
        }
]}
    />
  );
}
