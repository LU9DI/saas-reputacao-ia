import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: "Gestão de avaliações para comércio eletrônico | Filtra.AI",
  description: "Organize feedback sobre entrega, produto, devolução e suporte no comércio eletrônico para identificar problemas recorrentes.",
  alternates: { canonical: "https://filtraai.com/ecommerce" },
  openGraph: {
    title: "Gestão de avaliações para comércio eletrônico | Filtra.AI",
    description: "Organize feedback sobre entrega, produto, devolução e suporte no comércio eletrônico para identificar problemas recorrentes.",
    url: "https://filtraai.com/ecommerce",
    siteName: 'Filtra.AI',
    type: 'website',
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de reputação online para e-commerce"
      lead="No comércio eletrônico, a experiência percebida inclui produto, descrição, entrega, embalagem, devolução e atendimento pós-venda. Agrupar feedback por etapa ajuda a identificar onde surgem fricções e quais mudanças devem ser priorizadas."
      breadcrumbHref="/ecommerce"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina de reputação e acompanhamento.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Organize avaliações e temas recorrentes.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e prioridades.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece por um diagnóstico inicial.' },
      ]}
      sections={[
        {
                "heading": "Separe os temas por etapa da compra",
                "body": "Classifique comentários sobre descrição do produto, expectativa versus resultado, prazo de entrega, embalagem, devolução, cobrança e suporte. Evite juntar problemas diferentes em uma categoria genérica de satisfação."
        },
        {
                "heading": "Priorize correções que reduzem recorrência",
                "body": "Compare a frequência dos temas por período e encaminhe cada padrão à equipe responsável. Atualizações de descrição, comunicação de prazo ou instruções de devolução devem ser acompanhadas para verificar se o problema diminuiu."
        },
        {
                "heading": "Use avaliações para melhorar a jornada",
                "body": "Respostas públicas ajudam a esclarecer a situação, mas não substituem ajustes em logística, catálogo ou suporte. Proteja dados pessoais e transações e leve casos individuais para canais privados."
        }
]}
      faq={[
        {
                "question": "Quais avaliações um e-commerce deve acompanhar?",
                "answer": "Comentários sobre produto, descrição, entrega, embalagem, devolução, cobrança e atendimento. Separe cada etapa para encontrar causas e responsáveis."
        },
        {
                "question": "Avaliações públicas substituem pesquisas de satisfação?",
                "answer": "Não. Avaliações públicas são uma fonte útil, mas não representam necessariamente todos os clientes. Combine-as com feedback interno e outros indicadores quando disponíveis."
        },
        {
                "question": "Como pedir avaliações de forma correta?",
                "answer": "Convide clientes reais de forma neutra, sem recompensa por nota positiva ou seleção apenas de clientes satisfeitos. Deixe a participação voluntária."
        }
]}
    />
  );
}
