import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export const metadata: Metadata = {
  title: 'Reputação online para turismo e hotelaria',
  description:
    'Monitore avaliações e feedback de hóspedes, clientes e visitantes no turismo. Organize padrões de experiência e ações com o Filtra.AI.',
  alternates: {
    canonical: 'https://filtraai.com/turismo',
    languages: {
      'pt-BR': 'https://filtraai.com/turismo',
      en: 'https://filtraai.com/en/tourism',
      es: 'https://filtraai.com/es/turismo',
      'x-default': 'https://filtraai.com/turismo',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/turismo',
    title: 'Reputação online para turismo e hotelaria | Filtra.AI',
    description: 'Monitore avaliações e feedback de hóspedes, clientes e visitantes no turismo. Organize padrões de experiência e ações com o Filtra.AI.',
    images: [OG_IMAGE_META],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reputação online para turismo e hotelaria | Filtra.AI',
    description: 'Monitore avaliações e feedback no turismo e transforme padrões de experiência em ações.',
    images: [OG_IMAGE_META.url],
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
        { href: '/blog/reputacao-online-hoteis', title: 'Aprender com avaliações de hóspedes', description: 'Veja como mapear a jornada e comparar unidades com contexto.' },
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
        {
          heading: 'Sazonalidade e comparação justa',
          body: 'Alta e baixa temporada trazem volumes e perfis de visitantes diferentes. Compare períodos equivalentes e leve em conta ocupação, tipo de experiência e capacidade da operação. Uma média menor em um mês atípico pode não significar piora da experiência; sem contexto, o número engana.',
        },
        {
          heading: 'Idioma e contexto do visitante',
          body: 'Avaliações em outros idiomas podem trazer detalhes que passam despercebidos em uma leitura rápida. Ao responder, use uma linguagem clara e, quando possível, o idioma do visitante. Evite traduções automáticas sem revisão em casos sensíveis, pois tom e nuance podem mudar.',
        },
        {
          heading: 'Indicadores para a operação turística',
          body: 'Acompanhe recência, volume, temas recorrentes, avaliações sem resposta e evolução por período. Para atrações e operadores, também vale separar feedback sobre reserva, atendimento, guia, transporte e experiência no local. O objetivo é levar cada tema ao responsável certo.',
        },
      ]}
      faq={[
        {
          question: 'Como avaliar a reputação na baixa temporada?',
          answer: 'Estabeleça uma linha de base e compare o mesmo período de anos anteriores, considerando ocupação e perfil de visitantes. Evite comparar a baixa temporada com um mês de alta demanda sem ajustar o contexto.',
        },
        {
          question: 'Preciso responder avaliações em outros idiomas?',
          answer: 'Não é obrigatório, mas uma resposta clara no idioma do visitante ou em uma língua amplamente compreendida melhora a experiência. Em casos sensíveis, revise a tradução para não alterar o sentido ou o tom.',
        },
        {
          question: 'Como usar o feedback para melhorar a operação?',
          answer: 'Classifique o tema, defina um responsável, execute uma ação verificável e acompanhe as avaliações seguintes. Compartilhe os aprendizados com as equipes de reserva, recepção, guias e atendimento para que o feedback chegue a quem pode agir.',
        },
      ]}
    />
  );
}
