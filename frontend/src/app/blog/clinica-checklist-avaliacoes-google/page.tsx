import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Clínica e reputação online: checklist de avaliações Google',
  description:
    'Checklist para clínicas: quando pedir feedback, o que fazer com nota baixa e como manter velocity no Google Meu Negócio.',
  alternates: { canonical: '/blog/clinica-checklist-avaliacoes-google' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="Segmento · Clínicas"
      title="Clínica e reputação online: checklist de avaliações Google"
      lead="Paciente pesquisa nota antes de agendar. Um fluxo simples de feedback protege a agenda e a marca."
    >
      <H2>1. Antes de pedir uma avaliação</H2>
      <p>
        Defina o momento do pedido: normalmente depois que o atendimento foi concluído e a principal dúvida do
        paciente já foi resolvida. Use uma mensagem curta ou QR code que leve diretamente ao fluxo de feedback.
        O objetivo é medir a experiência, não pressionar por uma nota específica.
      </p>
      <H2>2. Separe feedback privado de avaliação pública</H2>
      <p>
        Um fluxo de feedback permite descobrir rapidamente quando a experiência ficou abaixo do esperado.
        Registre o motivo — espera, atendimento, comunicação, cobrança ou resultado percebido — e encaminhe o
        caso para a pessoa responsável. Isso cria uma rotina operacional em vez de tratar cada avaliação como
        um evento isolado.
      </p>
      <H2>3. Trate avaliações públicas como parte da operação</H2>
      <p>
        Para as avaliações que chegam ao Google, estabeleça um responsável e um prazo interno de resposta.
        Acompanhe a evolução da nota, a quantidade de novas avaliações e os temas recorrentes. Uma clínica com
        várias unidades também deve comparar esses indicadores por local, porque médias consolidadas podem
        esconder problemas específicos.
      </p>
      <H2>4. Transforme os dados em ações</H2>
      <p>
        Toda semana, escolha os principais motivos negativos e registre uma ação concreta para cada um. Depois,
        acompanhe se o volume daquele tema diminuiu. O valor do processo está em transformar comentários de
        pacientes em melhoria operacional mensurável.
      </p>
      <H2>5. Checklist rápido para a equipe</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Definir quando o pedido de feedback acontece.</li>
        <li>Disponibilizar QR code ou link simples.</li>
        <li>Registrar temas recorrentes de insatisfação.</li>
        <li>Responder avaliações públicas com responsável definido.</li>
        <li>Comparar unidades e acompanhar tendências semanalmente.</li>
      </ul>
    </BlogArticle>
  );
}
