import type { Metadata } from 'next';
import { SeoLanding } from '../../components/SeoLanding';
import { OG_IMAGE_META } from '../../lib/socialMetadata';

export const metadata: Metadata = {
  title: 'IA para ChatGPT, Claude e Grok | Análise de reputação',
  description: 'Use o Filtra.AI com clientes de IA compatíveis com MCP para analisar avaliações e reputação. Conecte o endpoint MCP oficial e leve os dados da sua empresa para seus agentes de IA.',
  alternates: {
    canonical: 'https://filtraai.com/ia',
    languages: {
      'pt-BR': 'https://filtraai.com/ia',
      en: 'https://filtraai.com/en/ai',
      es: 'https://filtraai.com/es/ia',
      'x-default': 'https://filtraai.com/ia',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/ia',
    siteName: 'Filtra.AI',
    locale: 'pt_BR',
    title: 'IA para ChatGPT, Claude e Grok | Análise de reputação',
    description: 'Use o Filtra.AI com clientes de IA compatíveis com MCP para analisar avaliações e reputação. Conecte o endpoint MCP oficial e leve os dados da sua empresa para seus agentes de IA.',
    images: [OG_IMAGE_META],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IA para ChatGPT, Claude e Grok | Análise de reputação',
    description: 'Use o Filtra.AI com clientes de IA compatíveis com MCP para analisar avaliações e reputação.',
    images: [OG_IMAGE_META.url],
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Leve a reputação da sua empresa para dentro das IAs"
      lead="Use o Filtra.AI com ChatGPT, Claude, Grok e outros clientes compatíveis com MCP para analisar avaliações, encontrar padrões e transformar a voz do cliente em ações."
      breadcrumbHref="/ia"
      mcpEndpoint="https://api.filtraai.com/mcp"
      sections={[
        {
          heading: 'O que o Filtra.AI pode fazer dentro de um agente',
          body: 'Auditar avaliações, identificar pontos fortes e riscos, encontrar temas recorrentes e apoiar respostas profissionais.',
        },
        {
          heading: 'Um único MCP',
          body: 'O mesmo núcleo do Filtra.AI atende clientes MCP compatíveis sem duplicar a lógica de análise para cada plataforma.',
        },
        {
          heading: 'Reputação conectada ao crescimento',
          body: 'Avaliações ajudam empresas a entender o que clientes valorizam, onde existem problemas recorrentes e quais pontos merecem ação.',
        },
        {
          heading: 'Perguntas que um agente pode apoiar',
          body: 'Um agente conectado pode ajudar a resumir comentários, listar temas recorrentes, comparar períodos ou unidades e apontar pontos fortes e riscos. A qualidade da resposta depende da pergunta e do contexto disponível; por isso, peça recortes específicos em vez de uma conclusão genérica sobre a empresa.',
        },
        {
          heading: 'Análise com revisão humana',
          body: 'A IA acelera a leitura e a organização de grandes volumes, mas não substitui o contexto da operação. Antes de transformar uma conclusão em resposta pública ou mudança interna, revise os comentários que sustentam a análise e confirme com as áreas responsáveis.',
        },
      ]}
      faq={[
        {
          question: 'Preciso saber programar para usar o MCP?',
          answer: 'Não necessariamente. O uso depende do cliente de IA escolhido e da forma como ele configura conectores. O endpoint MCP é o endereço que conecta a análise de reputação ao cliente compatível; consulte as instruções do próprio cliente para concluir a configuração.',
        },
        {
          question: 'O Filtra.AI funciona em qualquer cliente de IA?',
          answer: 'A conexão é voltada a clientes que suportam MCP. A disponibilidade, o formato de autenticação e os recursos podem variar entre ChatGPT, Claude, Grok e outras ferramentas. Confirme o suporte na documentação do cliente antes de configurar.',
        },
        {
          question: 'A IA publica respostas nas avaliações automaticamente?',
          answer: 'A proposta é apoiar a análise e a preparação de respostas profissionais. A decisão final e a publicação devem passar pela equipe responsável, que conhece o contexto do atendimento e pode avaliar o que é adequado dizer publicamente.',
        },
      ]}
    />
  );
}
