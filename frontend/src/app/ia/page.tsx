import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'IA para ChatGPT, Claude e Grok | Análise de reputação',
  description: 'Use o Filtra.AI com clientes de IA compatíveis com MCP para analisar avaliações e reputação.',
  alternates: {
    canonical: 'https://filtraai.com/ia',
    languages: {
      'pt-BR': 'https://filtraai.com/ia',
      en: 'https://filtraai.com/en/ai',
      es: 'https://filtraai.com/es/ia',
      zh: 'https://filtraai.com/zh/ai',
      'x-default': 'https://filtraai.com/ia',
    },
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
      ]}
    />
  );
}
