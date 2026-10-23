import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../../components/BlogArticle';
import { BlogSchema } from '../../../components/BlogSchema';
import { OG_IMAGE_META, buildTwitter } from '../../../lib/blogSchema';

const canonical = 'https://filtraai.com/blog/reputacao-online-clinicas';

export const metadata: Metadata = {
  title: 'Reputação online para clínicas: guia prático de avaliações e feedback',
  description:
    'Como clínicas podem transformar avaliações de pacientes e feedback privado em uma rotina de melhoria de experiência e reputação local.',
  alternates: { canonical },
  openGraph: { type: 'article', title: 'Reputação online para clínicas', description: 'Guia prático de avaliações e feedback para clínicas.', url: canonical, images: [OG_IMAGE_META] },
  twitter: buildTwitter('Reputação online para clínicas', 'Guia prático de avaliações e feedback para clínicas.'),
};

export default function Page() {
  return (
    <>
      <BlogSchema
        headline="Reputação online para clínicas: guia prático de avaliações e feedback"
        description="Como clínicas podem transformar avaliações de pacientes e feedback privado em melhoria de experiência."
        canonical={canonical}
        datePublished="2026-10-05"
        dateModified="2026-10-05"
      />
      <BlogArticle
        kicker="Clínicas · reputação local"
        title="Reputação online para clínicas: guia prático de avaliações e feedback"
        lead="Na saúde, reputação não termina na nota do Google. Ela começa na experiência do paciente e continua na forma como a clínica aprende com cada sinal."
      >
        <p>
          Clínicas convivem com uma combinação difícil: expectativas altas, jornadas diferentes e pouco espaço para uma experiência ruim passar despercebida. Por isso, a gestão de reputação precisa conectar feedback do paciente, avaliação pública e operação.
        </p>
        <H2>Onde pedir feedback</H2>
        <p>
          O melhor ponto é próximo de um momento que faça sentido para o paciente: depois de um atendimento concluído, após um retorno ou quando uma etapa importante da jornada terminou. O canal precisa ser simples e não aumentar a fricção.
        </p>
        <H2>O que analisar além da nota</H2>
        <p>
          Procure temas como acolhimento, tempo de espera, facilidade de agendamento, comunicação, ambiente, clareza das informações e percepção do atendimento. O texto mostra por que uma pessoa deu determinada nota e revela padrões que a média esconde.
        </p>
        <H2>Separe aprendizado interno da avaliação pública</H2>
        <p>
          Feedback privado é útil para investigação e recuperação de experiência. Avaliação pública é um registro da percepção do cliente no mercado. Os dois canais devem coexistir, sem manipular a opinião do paciente.
        </p>
        <H2>Crie uma rotina por unidade</H2>
        <p>
          Redes de clínicas precisam de visão por localização. Compare volume de feedback, temas recorrentes e mudanças ao longo do tempo. Assim fica mais fácil identificar uma unidade fora do padrão e descobrir boas práticas que podem ser replicadas.
        </p>
        <p>
          Veja também o <Link href="/clinicas" className="text-indigo-300 underline">guia de reputação para clínicas</Link>, <Link href="/monitoramento-reputacao-online" className="text-indigo-300 underline">monitoramento de reputação online</Link> e a <Link href="/auditoria-gratuita" className="text-indigo-300 underline">auditoria gratuita</Link>.
        </p>
      </BlogArticle>
    </>
  );
}