import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: "Gestão de reputação para imobiliárias | Filtra.AI",
  description: "Organize avaliações sobre atendimento imobiliário, comunicação, visitas e pós-venda para priorizar melhorias na jornada do cliente.",
  alternates: { canonical: "https://filtraai.com/imobiliarias" },
  openGraph: {
    title: "Gestão de reputação para imobiliárias | Filtra.AI",
    description: "Organize avaliações sobre atendimento imobiliário, comunicação, visitas e pós-venda para priorizar melhorias na jornada do cliente.",
    url: "https://filtraai.com/imobiliarias",
    siteName: 'Filtra.AI',
    type: 'website',
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de reputação online para imobiliárias"
      lead="A jornada imobiliária envolve primeiro contato, agendamento, visitas, documentação e acompanhamento. Avaliações organizadas por tema ajudam a identificar onde a comunicação falha e quais etapas precisam de atenção."
      breadcrumbHref="/imobiliarias"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina de reputação e acompanhamento.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Organize avaliações e temas recorrentes.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e prioridades.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece por um diagnóstico inicial.' },
      ]}
      sections={[
        {
                "heading": "O que as avaliações podem revelar",
                "body": "Procure recorrências sobre rapidez no retorno, clareza dos anúncios, pontualidade nas visitas, transparência de condições, documentação e acompanhamento após a negociação. Separe problemas de processo de expectativas que precisam ser esclarecidas."
        },
        {
                "heading": "Organize feedback por etapa da jornada",
                "body": "Associe cada tema à etapa correspondente e ao responsável interno. Isso facilita identificar gargalos, comparar períodos e verificar se mudanças na comunicação ou no atendimento reduziram as reclamações."
        },
        {
                "heading": "Construa respostas profissionais",
                "body": "Reconheça a experiência sem publicar dados de contratos, endereços privados ou informações financeiras. Quando o caso exigir investigação, leve a conversa para um canal privado e registre internamente a causa e a ação."
        }
]}
      faq={[
        {
                "question": "Quais indicadores uma imobiliária deve acompanhar?",
                "answer": "Volume e recência de avaliações, temas sobre atendimento e visitas, tempo de resposta e recorrência das reclamações. Acompanhe também se as ações corretivas foram concluídas."
        },
        {
                "question": "Avaliações podem ajudar a melhorar o atendimento comercial?",
                "answer": "Podem revelar padrões na comunicação, agendamento e acompanhamento. Use os comentários como sinais para investigar e validar processos, não como prova isolada sobre um profissional."
        },
        {
                "question": "A reputação online garante mais vendas?",
                "answer": "Não. Uma reputação bem gerida pode reduzir incerteza, mas vendas dependem de preço, oferta, mercado, atendimento e muitos outros fatores."
        }
]}
    />
  );
}
