import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export const metadata: Metadata = {
  title: "Gestão de reputação para academias | Filtra.AI",
  description: "Organize avaliações de academias, identifique padrões sobre aulas, equipe, limpeza e horários e transforme feedback em melhorias.",
  alternates: { canonical: "https://filtraai.com/academias" },
  openGraph: {
    title: "Gestão de reputação para academias | Filtra.AI",
    description: "Organize avaliações de academias, identifique padrões sobre aulas, equipe, limpeza e horários e transforme feedback em melhorias.",
    url: "https://filtraai.com/academias",
    siteName: 'Filtra.AI',
    type: 'website',
    images: [OG_IMAGE_META],
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de reputação online para academias"
      lead="Avaliações sobre aulas, equipamentos, limpeza, atendimento e lotação ajudam a revelar a experiência real dos alunos. Organize esses sinais por tema e transforme comentários recorrentes em prioridades para a equipe."
      breadcrumbHref="/academias"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina de reputação e acompanhamento.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Organize avaliações e temas recorrentes.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e prioridades.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece por um diagnóstico inicial.' },
      ]}
      sections={[
        {
                "heading": "O que acompanhar nas avaliações de uma academia",
                "body": "Observe comentários sobre recepção, professores, manutenção de equipamentos, limpeza, horários, lotação e cancelamento. Separe casos pontuais de temas que se repetem para não tomar decisões com base em uma única avaliação."
        },
        {
                "heading": "Como transformar feedback em melhoria",
                "body": "Classifique os temas, defina um responsável e registre a ação tomada. Compare os comentários dos períodos seguintes para verificar se a causa foi resolvida. Uma resposta pública educada é importante, mas não substitui a correção operacional."
        },
        {
                "heading": "Como lidar com avaliações negativas",
                "body": "Reconheça a experiência relatada sem discutir em público nem expor dados pessoais. Se a crítica envolver segurança ou saúde, encaminhe-a rapidamente à gestão e mantenha o acompanhamento fora dos comentários públicos quando necessário."
        }
]}
      faq={[
        {
                "question": "Quais temas uma academia deve monitorar?",
                "answer": "Atendimento, qualidade das aulas, equipamentos, limpeza, horários, lotação, cobrança e cancelamento são bons pontos de partida. A prioridade deve vir da recorrência e do impacto, não apenas da nota."
        },
        {
                "question": "Como pedir avaliações aos alunos?",
                "answer": "Faça um convite neutro após uma experiência real e facilite o acesso ao perfil por link ou QR Code. Não ofereça benefícios em troca de avaliações positivas nem selecione apenas alunos satisfeitos."
        },
        {
                "question": "A Filtra.AI garante uma nota maior no Google?",
                "answer": "Não. A plataforma ajuda a organizar e interpretar feedback; a nota depende das experiências reais e das avaliações publicadas pelos clientes."
        }
]}
    />
  );
}
