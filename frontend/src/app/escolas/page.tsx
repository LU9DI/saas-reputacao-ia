import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export const metadata: Metadata = {
  title: "Gestão de reputação para escolas e instituições de ensino | Filtra.AI",
  description: "Entenda padrões de feedback sobre comunicação, atendimento, infraestrutura e experiência das famílias sem expor dados de estudantes.",
  alternates: { canonical: "https://filtraai.com/escolas" },
  openGraph: {
    title: "Gestão de reputação para escolas e instituições de ensino | Filtra.AI",
    description: "Entenda padrões de feedback sobre comunicação, atendimento, infraestrutura e experiência das famílias sem expor dados de estudantes.",
    url: "https://filtraai.com/escolas",
    siteName: 'Filtra.AI',
    type: 'website',
    images: [OG_IMAGE_META],
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de reputação online para escolas"
      lead="Avaliações de escolas podem refletir comunicação com famílias, atendimento administrativo, infraestrutura, organização e experiência da comunidade. Uma rotina de feedback ajuda a separar temas recorrentes de casos isolados."
      breadcrumbHref="/escolas"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina de reputação e acompanhamento.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Organize avaliações e temas recorrentes.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e prioridades.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece por um diagnóstico inicial.' },
      ]}
      sections={[
        {
                "heading": "Temas úteis para acompanhar",
                "body": "Agrupe comentários sobre comunicação, matrícula, secretaria, instalações, horários, acessibilidade e organização. Não publique nem reproduza dados identificáveis de estudantes ou detalhes de situações disciplinares."
        },
        {
                "heading": "Conecte feedback à melhoria institucional",
                "body": "Encaminhe os temas para as áreas responsáveis, estabeleça prazos e compare a evolução por período. A análise deve apoiar decisões e preservar o contexto de cada caso, sem tratar uma avaliação individual como retrato de toda a comunidade."
        },
        {
                "heading": "Como responder com cuidado",
                "body": "Reconheça a preocupação sem confirmar vínculos de estudantes ou famílias. Para situações individuais, convide a pessoa a um canal privado e siga as políticas de proteção de dados e atendimento da instituição."
        }
]}
      faq={[
        {
                "question": "O que uma escola deve acompanhar nas avaliações online?",
                "answer": "Comunicação, atendimento administrativo, infraestrutura, organização, acessibilidade e temas recorrentes da experiência das famílias, sempre respeitando a privacidade."
        },
        {
                "question": "Como responder a uma crítica que envolve um estudante?",
                "answer": "Não confirme a identidade ou o vínculo do estudante e não discuta o caso em público. Convide a família a um canal privado e encaminhe a situação à equipe responsável."
        },
        {
                "question": "A reputação online mede sozinha a qualidade de uma escola?",
                "answer": "Não. Avaliações públicas representam experiências individuais e devem ser combinadas com outros indicadores e com a análise contextual da instituição."
        }
]}
    />
  );
}
