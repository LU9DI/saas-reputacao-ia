import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: "Gestão de avaliações para dentistas e clínicas odontológicas | Filtra.AI",
  description: "Entenda avaliações de consultórios odontológicos, encontre padrões de atendimento e melhore processos sem expor informações de pacientes.",
  alternates: { canonical: "https://filtraai.com/dentistas" },
  openGraph: {
    title: "Gestão de avaliações para dentistas e clínicas odontológicas | Filtra.AI",
    description: "Entenda avaliações de consultórios odontológicos, encontre padrões de atendimento e melhore processos sem expor informações de pacientes.",
    url: "https://filtraai.com/dentistas",
    siteName: 'Filtra.AI',
    type: 'website',
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de reputação para dentistas e clínicas odontológicas"
      lead="A percepção de uma clínica odontológica pode envolver agendamento, espera, comunicação, ambiente e acolhimento. Organize avaliações para encontrar problemas recorrentes, preservando rigorosamente a privacidade dos pacientes."
      breadcrumbHref="/dentistas"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina de reputação e acompanhamento.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Organize avaliações e temas recorrentes.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e prioridades.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece por um diagnóstico inicial.' },
      ]}
      sections={[
        {
                "heading": "Quais sinais observar nas avaliações odontológicas",
                "body": "Acompanhe temas de agendamento, tempo de espera, clareza das orientações, atendimento administrativo, acessibilidade e ambiente. Não use comentários públicos para confirmar se alguém é paciente ou para discutir informações clínicas."
        },
        {
                "heading": "Transforme temas recorrentes em ações de equipe",
                "body": "Agrupe os assuntos, valide o contexto internamente e encaminhe cada tema para a pessoa responsável. Acompanhe se a frequência do problema muda depois da intervenção, em vez de medir sucesso apenas pela nota média."
        },
        {
                "heading": "Respostas públicas com privacidade",
                "body": "Responda com empatia e linguagem neutra, sem confirmar consultas, tratamentos ou qualquer dado de saúde. Convide a pessoa a usar um canal privado para tratar detalhes e siga as regras profissionais aplicáveis."
        }
]}
      faq={[
        {
                "question": "Uma clínica pode responder a avaliações negativas?",
                "answer": "Sim, com cuidado para não confirmar vínculo clínico nem revelar dados pessoais ou de saúde. A resposta pública deve ser breve, respeitosa e direcionar detalhes para um canal privado."
        },
        {
                "question": "O que vale acompanhar além da nota?",
                "answer": "Recência e volume das avaliações, temas recorrentes, tempo de resposta e andamento das ações internas. Esses indicadores ajudam a distinguir percepção pontual de problemas de processo."
        },
        {
                "question": "Como solicitar avaliações de pacientes de forma ética?",
                "answer": "Use convite neutro, sem pressão ou recompensa por nota positiva, e não filtre a solicitação apenas para pacientes satisfeitos."
        }
]}
    />
  );
}
