import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Filtra.AI para agências: gestão de reputação e SEO local',
  description:
    'Ofereça gestão de reputação, avaliações Google e análise de feedback como serviço recorrente para clientes de SEO local e marketing digital.',
  alternates: { canonical: 'https://filtraai.com/agencias' },
};

export default function AgenciasPage() {
  return (
    <SeoLanding
      h1="Gestão de reputação para agências de marketing e SEO local"
      lead="Agências que cuidam de Google, mídia e aquisição precisam também de uma operação para avaliações e feedback. O Filtra.AI transforma esse trabalho em uma camada recorrente do serviço entregue ao cliente."
      breadcrumbHref="/agencias"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture a operação de reputação que sua agência entrega aos clientes.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Conecte avaliações e presença local.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Transforme reviews em temas e relatórios.' },
        { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação', description: 'Acompanhe mudanças e sinais relevantes.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Use um diagnóstico inicial para abrir conversas comerciais.' },
        { href: '/filtra-ai', title: 'Conheça a Filtra.AI', description: 'Plataforma de reputação, avaliações e feedback com IA.' },
      ]}
      sections={[
        {
          heading: 'Por que adicionar reputação ao portfólio da agência?',
          body: 'Uma estratégia de presença local não termina no site ou no perfil da empresa. Avaliações, feedback e percepção dos clientes também geram sinais que a agência precisa acompanhar. Ao transformar isso em processo, a agência aumenta a profundidade da entrega sem depender de tarefas isoladas.'
        },
        {
          heading: 'Como vender a solução para o cliente',
          body: 'Apresente a reputação como operação: coletar feedback, acompanhar avaliações, identificar padrões, apoiar respostas e mostrar evolução. Isso cria uma narrativa mais forte do que simplesmente vender “mais avaliações”, porque conecta a reputação a experiência e retenção.'
        },
        {
          heading: 'SEO local, Google Maps e reputação',
          body: 'Para negócios locais, presença no Google Maps, avaliações e experiência do cliente aparecem no mesmo ciclo de descoberta. A agência pode usar o Filtra.AI como camada operacional para transformar o que acontece depois do atendimento em aprendizado para a estratégia local.'
        },
        {
          heading: 'Relatórios que o cliente entende',
          body: 'Em vez de entregar somente métricas de tráfego ou posições, inclua volume de feedback, temas recorrentes, pontos de atenção e evolução da percepção. O objetivo é mostrar o que os clientes estão dizendo e quais ações a equipe pode tomar.'
        },
        {
          heading: 'Um piloto por cliente',
          body: 'Comece com um restaurante, clínica, hotel ou outra operação da carteira. Configure o fluxo, acompanhe a entrada de feedback e use uma primeira leitura de temas para demonstrar o valor antes de expandir a oferta.'
        },
        {
          heading: 'Escala para carteiras maiores',
          body: 'Com vários clientes, o principal ganho vem da padronização: mesma lógica de onboarding, mesmo formato de análise e uma rotina clara para cada conta. A agência preserva contexto de cada negócio sem reconstruir o processo do zero.'
        },
        {
          heading: 'O papel da IA na entrega',
          body: 'IA ajuda a classificar comentários, encontrar recorrências e acelerar relatórios. A agência continua responsável pelo contexto estratégico, pela comunicação com o cliente e pela decisão sobre quais sinais merecem intervenção.'
        },
      ]}
    />
  );
}
