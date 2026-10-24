import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: "Gestão de avaliações para oficinas mecânicas | Filtra.AI",
  description: "Identifique padrões em avaliações sobre orçamento, prazo, comunicação e qualidade percebida em oficinas mecânicas.",
  alternates: { canonical: "https://filtraai.com/oficinas-mecanicas" },
  openGraph: {
    title: "Gestão de avaliações para oficinas mecânicas | Filtra.AI",
    description: "Identifique padrões em avaliações sobre orçamento, prazo, comunicação e qualidade percebida em oficinas mecânicas.",
    url: "https://filtraai.com/oficinas-mecanicas",
    siteName: 'Filtra.AI',
    type: 'website',
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de reputação online para oficinas mecânicas"
      lead="A confiança em uma oficina depende também da clareza do orçamento, dos prazos e da comunicação sobre o serviço. Organizar avaliações por tema ajuda a localizar falhas repetidas e melhorar a experiência do cliente."
      breadcrumbHref="/oficinas-mecanicas"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina de reputação e acompanhamento.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Organize avaliações e temas recorrentes.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e prioridades.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece por um diagnóstico inicial.' },
      ]}
      sections={[
        {
                "heading": "O que as avaliações revelam",
                "body": "Acompanhe temas de transparência do orçamento, prazo de entrega, explicação do serviço, atendimento, comunicação durante o reparo e condições de retirada. Diferencie um atraso pontual de um padrão de comunicação insuficiente."
        },
        {
                "heading": "Da reclamação à correção do processo",
                "body": "Defina responsáveis para os temas recorrentes, como atualização de prazo ou aprovação de custos adicionais. Registre a ação tomada e verifique se o tema volta a aparecer nos comentários seguintes."
        },
        {
                "heading": "Respostas claras e sem exposição de dados",
                "body": "Não publique placas, dados de contato, valores individualizados ou detalhes de ordens de serviço. Reconheça a preocupação, ofereça um canal privado e investigue o ocorrido antes de atribuir responsabilidades."
        }
]}
      faq={[
        {
                "question": "Quais temas uma oficina deve monitorar?",
                "answer": "Orçamento, prazo, clareza da explicação, comunicação durante o serviço, atendimento e qualidade percebida. A recorrência e a gravidade ajudam a definir prioridades."
        },
        {
                "question": "Como responder a uma avaliação negativa sobre um reparo?",
                "answer": "Responda com respeito, não divulgue dados do veículo ou do serviço e convide o cliente a conversar em privado para localizar o atendimento e investigar o caso."
        },
        {
                "question": "Como saber se a reputação está melhorando?",
                "answer": "Compare períodos equivalentes, observe volume e recência das avaliações, recorrência dos temas e andamento das ações corretivas. Não dependa apenas da média de estrelas."
        }
]}
    />
  );
}
