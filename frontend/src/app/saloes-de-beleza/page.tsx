import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: "Gestão de avaliações para salões de beleza | Filtra.AI",
  description: "Analise feedback sobre agendamento, pontualidade, atendimento e serviços em salões de beleza e priorize melhorias na experiência.",
  alternates: { canonical: "https://filtraai.com/saloes-de-beleza" },
  openGraph: {
    title: "Gestão de avaliações para salões de beleza | Filtra.AI",
    description: "Analise feedback sobre agendamento, pontualidade, atendimento e serviços em salões de beleza e priorize melhorias na experiência.",
    url: "https://filtraai.com/saloes-de-beleza",
    siteName: 'Filtra.AI',
    type: 'website',
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de reputação online para salões de beleza"
      lead="As avaliações de salões frequentemente refletem agendamento, tempo de espera, acolhimento, ambiente e consistência do serviço. Organizar esses comentários ajuda a entender o que deve ser preservado e o que precisa melhorar."
      breadcrumbHref="/saloes-de-beleza"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina de reputação e acompanhamento.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Organize avaliações e temas recorrentes.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e prioridades.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece por um diagnóstico inicial.' },
      ]}
      sections={[
        {
                "heading": "Temas para acompanhar em um salão",
                "body": "Agrupe comentários sobre facilidade para agendar, pontualidade, comunicação de preços, atendimento, higiene, ambiente e satisfação com o serviço. Registre também elogios recorrentes para reconhecer boas práticas."
        },
        {
                "heading": "Como fechar o ciclo do feedback",
                "body": "Escolha os problemas mais recorrentes, defina uma ação concreta e acompanhe as avaliações seguintes. Ajustes em confirmação de horários, comunicação de preços ou organização da agenda podem ser avaliados ao longo do tempo."
        },
        {
                "heading": "Responda sem transformar a conversa em conflito",
                "body": "Agradeça o feedback, reconheça a experiência e evite discutir detalhes pessoais ou publicar informações sobre o atendimento. Ofereça um canal privado para entender o caso e investigue a causa internamente."
        }
]}
      faq={[
        {
                "question": "Como conseguir avaliações para um salão?",
                "answer": "Convide todos os clientes de forma neutra após o serviço, com um link simples ou QR Code. Não ofereça descontos em troca de avaliações positivas nem peça apenas a clientes satisfeitos."
        },
        {
                "question": "Quais reclamações merecem prioridade?",
                "answer": "Dê prioridade a temas repetidos, questões de segurança e higiene, cobranças inesperadas e problemas que afetam muitos clientes. Registre responsáveis e prazos para acompanhar a correção."
        },
        {
                "question": "A análise por IA substitui a avaliação da equipe?",
                "answer": "Não. A IA pode ajudar a agrupar temas, mas a equipe deve validar contexto, exceções e decisões que afetam clientes."
        }
]}
    />
  );
}
