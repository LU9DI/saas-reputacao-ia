import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Gestão de avaliações Google para clínicas | Filtra.AI',
  description:
    'Organize avaliações Google, feedback de pacientes e sinais de experiência para clínicas e redes com o Filtra.AI.',
  alternates: {
    canonical: 'https://filtraai.com/clinicas',
    languages: {
      'pt-BR': 'https://filtraai.com/clinicas',
      en: 'https://filtraai.com/en/clinics',
      es: 'https://filtraai.com/es/clinicas',
      zh: 'https://filtraai.com/zh/clinics',
      'x-default': 'https://filtraai.com/clinicas',
    },
  },
};

export default function ClinicasPage() {
  return (
    <SeoLanding
      h1="Gestão de avaliações Google para clínicas"
      lead="A reputação de uma clínica depende da experiência percebida em cada etapa. O Filtra.AI organiza feedback de pacientes, avaliações e temas recorrentes para a equipe entender o que precisa de atenção."
      breadcrumbHref="/clinicas"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação para clínicas', description: 'Organize avaliações, respostas e melhoria contínua.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Acompanhe avaliações e sinais públicos.' },
        { href: '/feedback-de-clientes', title: 'Feedback de pacientes', description: 'Transforme opiniões em insumos para a operação.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise com IA', description: 'Encontre temas recorrentes em escala.' },
        { href: '/blog/clinica-checklist-avaliacoes-google', title: 'Checklist de avaliações para clínicas', description: 'Guia prático para organizar o processo.' },
        { href: '/filtra-ai', title: 'Conheça a Filtra.AI', description: 'Gestão de reputação, avaliações e feedback com IA.' },
      ]}
      sections={[
        {
          heading: 'A jornada do paciente gera sinais',
          body: 'Recepção, agendamento, tempo de espera, comunicação, atendimento, retorno e acompanhamento podem aparecer nas avaliações. A nota resume a experiência; os comentários ajudam a explicar o motivo.'
        },
        {
          heading: 'Como organizar avaliações Google',
          body: 'Crie um fluxo simples para que pacientes possam deixar feedback depois de um ponto natural da jornada. Links diretos e QR Codes reduzem fricção, enquanto o acompanhamento sistemático evita que avaliações relevantes passem despercebidas.'
        },
        {
          heading: 'Feedback privado e melhoria operacional',
          body: 'Nem todo atrito precisa começar como uma crise pública. Feedback estruturado ajuda a identificar problemas de processo, comunicação ou espera e a encaminhá-los para a equipe responsável antes que se tornem recorrentes.'
        },
        {
          heading: 'Análise de avaliações com IA',
          body: 'Quando uma clínica recebe muitos comentários, a IA pode agrupar temas como atendimento, espera, clareza, cordialidade e organização. Isso acelera a triagem e dá ao gestor uma visão mais clara das recorrências.'
        },
        {
          heading: 'Multi-unidade sem perder contexto',
          body: 'Redes de clínicas precisam separar problemas específicos de uma unidade daqueles que aparecem em vários endereços. Comparar temas e tendência por unidade ajuda a priorizar a intervenção certa.'
        },
        {
          heading: 'Respostas e relacionamento',
          body: 'Responder avaliações faz parte do relacionamento público, mas a resposta precisa estar ligada à realidade do atendimento. O histórico de feedback ajuda a criar respostas mais contextualizadas e a identificar quando existe um problema estrutural.'
        },
        {
          heading: 'O que acompanhar toda semana',
          body: 'Além da média, acompanhe volume novo, distribuição por nota, temas recorrentes, mudanças na percepção e diferenças entre unidades. A meta é transformar esses sinais em ações verificáveis e acompanhar se o padrão melhora.'
        },
      ]}
    />
  );
}
