import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Reputação online para turismo e hotelaria | Filtra.AI',
  description:
    'Monitore avaliações e feedback de hóspedes, clientes e visitantes no turismo. Organize padrões de experiência e ações com o Filtra.AI.',
  alternates: { canonical: 'https://filtraai.com/turismo' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/turismo',
    title: 'Reputação online para turismo e hotelaria | Filtra.AI',
    description: 'Monitore avaliações e feedback de hóspedes, clientes e visitantes no turismo. Organize padrões de experiência e ações com o Filtra.AI.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reputação online para turismo e hotelaria | Filtra.AI',
    description: 'Monitore avaliações e feedback no turismo e transforme padrões de experiência em ações.',
  },
};

export default function TurismoPage() {
  return (
    <SeoLanding
      h1="Turismo: transforme avaliações em melhoria da experiência"
      lead="Hotéis, resorts, operadores e negócios turísticos vivem de confiança. O Filtra.AI organiza avaliações e feedback para revelar padrões de experiência e oportunidades de melhoria."
      breadcrumbHref="/turismo"
      contextLinks={[
        { href: '/hoteis', title: 'Gestão de reputação para hotéis', description: 'Organize avaliações de hóspedes e padrões de experiência.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique temas recorrentes em avaliações e feedbacks.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Acompanhe sinais públicos e oportunidades de melhoria.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Faça um diagnóstico inicial da reputação do negócio.' },
      ]}
      sections={[
        {
          heading: 'Capture feedback no momento certo',
          body: 'Facilite o envio de feedback após hospedagem, passeio, atendimento ou outra etapa da jornada, quando a experiência ainda está recente.',
        },
        {
          heading: 'Separe sinal público de problema interno',
          body: 'Avaliações e comentários ajudam a medir a percepção externa. Feedback privado pode revelar atritos que merecem tratamento pela operação antes que se repitam.',
        },
        {
          heading: 'Veja padrões por operação',
          body: 'Compare temas como atendimento, limpeza, comunicação, tempo de resposta e experiência para encontrar pontos recorrentes.',
        },
        {
          heading: 'Do hotel ao operador',
          body: 'A mesma lógica pode apoiar hotéis, resorts, pousadas, atrações, operadores e outros negócios que dependem de avaliações e indicação.',
        },
        {
          heading: 'Comece com um piloto',
          body: 'Use o trial de 7 dias em uma unidade ou operação, observe o volume e os padrões de feedback e decida como expandir.',
        },
      ]}
    />
  );
}
