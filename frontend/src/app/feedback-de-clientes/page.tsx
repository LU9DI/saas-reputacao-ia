import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Gestão de feedback de clientes com IA',
  description:
    'Centralize feedback de clientes, encontre padrões e transforme opiniões em prioridades de crescimento com inteligência artificial.',
  alternates: {
    canonical: 'https://filtraai.com/feedback-de-clientes',
    languages: {
      'pt-BR': 'https://filtraai.com/feedback-de-clientes',
      en: 'https://filtraai.com/en/customer-feedback',
      es: 'https://filtraai.com/es/feedback-clientes',
      'x-default': 'https://filtraai.com/feedback-de-clientes',
    },
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de feedback de clientes: transforme opiniões em crescimento"
      lead="Clientes já estão mostrando o que funciona, o que gera atrito e onde sua empresa pode melhorar. A Filtra.AI organiza feedback e avaliações para transformar opiniões dispersas em prioridades práticas."
      breadcrumbHref="/feedback-de-clientes"
      contextLinks={[
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Encontre padrões automaticamente.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Conecte feedback e sinais públicos.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Leve insights para a reputação.' },
        { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação', description: 'Acompanhe tendências.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Faça um diagnóstico inicial.' },
        { href: '/filtra-ai', title: 'Filtra.AI', description: 'Conheça a plataforma.' },
      ]}
      sections={[
        { heading: 'Como criar uma rotina de feedback de clientes', body: 'Defina quando o feedback é solicitado, onde será registrado, quem analisa e como os temas chegam à operação. A coleta deve buscar opiniões autênticas e não selecionar apenas clientes satisfeitos.' },
        { heading: 'Análise de feedback de clientes com IA', body: 'A IA pode acelerar classificação, agrupamento e resumo quando o volume cresce. O processo fica mais útil quando cada tema relevante recebe responsável, ação e indicador de acompanhamento.' },
        { heading: 'Feedback, avaliações e reputação formam um único ciclo', body: 'Feedback privado ajuda a descobrir atritos; avaliações públicas mostram como a experiência aparece para o mercado. Juntos, esses sinais ajudam a empresa a priorizar melhorias e acompanhar a percepção ao longo do tempo.' },
        {
        
          heading: 'Por que feedback de clientes é um ativo',
          body: 'Avaliações e comentários registram experiências reais. Quando reunidos em volume suficiente, ajudam a identificar recorrências que uma equipe não perceberia olhando cada interação separadamente.'
        },
        {
          heading: 'Gestão de feedback de clientes para empresas',
          body: 'Uma operação de feedback de clientes precisa transformar opiniões em dados de gestão: identificar o que se repete, definir responsáveis, acompanhar a resposta e medir se o tema volta a aparecer. Isso vale para empresas locais, redes e operações com vários canais de atendimento.',
        },
        {
          heading: 'Feedback público e privado',
          body: 'Avaliações públicas mostram como o mercado percebe a empresa. Canais privados ajudam a descobrir atritos que o cliente talvez nunca publique. Os dois sinais são complementares.'
        },
        {
          heading: 'O que procurar nos comentários',
          body: 'Observe temas recorrentes relacionados a atendimento, prazo, preço, qualidade, produto, comunicação, ambiente e suporte. Frequência e evolução ajudam a separar caso isolado de padrão.'
        },
        {
          heading: 'Como transformar feedback em ação',
          body: 'Agrupe comentários por tema, escolha prioridades, encaminhe cada tema para a área responsável e defina uma ação que possa ser verificada nas avaliações seguintes.'
        },
        {
          heading: 'Feedback em operações multilocais',
          body: 'Quando existem várias unidades, compare padrões sem ignorar o contexto local. Um problema de uma unidade pode ser específico; uma recorrência em várias unidades pode apontar para uma mudança sistêmica.'
        },
        {
          heading: 'Como a IA acelera a análise',
          body: 'IA pode classificar, resumir e encontrar padrões em grandes volumes de texto. O objetivo é reduzir o trabalho mecânico de triagem e aumentar a velocidade com que a equipe encontra aquilo que merece atenção.'
        },
        {
          heading: 'Métricas para acompanhar',
          body: 'Volume de feedback, distribuição por nota, temas recorrentes, evolução por período e diferenças entre unidades formam uma visão mais útil do que uma única nota média.'
        },
      ]}
      faq={[
        {
          question: 'Qual a diferença entre feedback e avaliação pública?',
          answer: 'O feedback é a opinião enviada em um canal da empresa, público ou privado; a avaliação pública é a nota e o comentário publicados no Google ou em outra plataforma. O feedback privado permite tratar o problema antes de uma exposição pública.',
        },
        {
          question: 'Como coletar feedback do cliente?',
          answer: 'Ofereça um canal simples logo após um ponto natural da jornada, como link direto, QR Code na mesa, na conta ou na embalagem. O convite deve ser neutro, sem pressão por nota e sem condicionar benefícios.',
        },
        {
          question: 'Feedback privado pode virar avaliação pública?',
          answer: 'Só se o cliente decidir publicar. Não publique conteúdo privado nem dados pessoais sem consentimento. O papel da empresa é responder e corrigir a causa, preservando a escolha do cliente.',
        },
        {
          question: 'O que fazer com um feedback negativo?',
          answer: 'Classifique o tema, responda com respeito, encaminhe para a área responsável e registre a correção. Acompanhe se o mesmo tema volta a aparecer para distinguir um caso isolado de um problema recorrente.',
        },
        {
          question: 'Como tratar feedback e LGPD?',
          answer: 'Colete o mínimo necessário, informe a finalidade e evite expor dados pessoais em respostas ou relatórios. Consulte a política de privacidade do Filtra.AI e as obrigações da sua empresa antes de reutilizar o conteúdo.',
        },
      ]}
    />
  );
}
