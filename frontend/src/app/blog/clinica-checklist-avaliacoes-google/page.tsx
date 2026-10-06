import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Clínicas: checklist de avaliações Google ',
  description:
    'Checklist prático para clínicas: feedback do paciente, avaliações Google, respostas, indicadores e ações para melhorar a reputação local.',
  alternates: { canonical: 'https://filtraai.com/blog/clinica-checklist-avaliacoes-google' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="Segmento · Clínicas"
      title="Clínicas: checklist de avaliações Google"
      lead="Paciente pesquisa nota antes de agendar. Um fluxo estruturado de feedback ajuda a clínica a identificar problemas, responder avaliações e transformar experiência em melhoria operacional."
    >
      <H2>1. Antes de pedir uma avaliação</H2>
      <p>
        Defina o momento do pedido: normalmente depois que o atendimento foi concluído e a principal dúvida do
        paciente já foi resolvida. Use uma mensagem curta ou QR code que leve diretamente ao fluxo de feedback.
        O objetivo é medir a experiência e facilitar uma avaliação espontânea, não pressionar por uma nota específica.
      </p>

      <H2>2. Separe feedback privado de avaliação pública</H2>
      <p>
        Um fluxo de feedback permite descobrir rapidamente quando a experiência ficou abaixo do esperado.
        Registre o motivo — espera, atendimento, comunicação, cobrança ou resultado percebido — e encaminhe o
        caso para a pessoa responsável. Isso cria uma rotina operacional em vez de tratar cada avaliação como
        um evento isolado.
      </p>
      <p>
        O feedback privado também ajuda a identificar padrões que ainda não aparecem nas avaliações públicas.
        Para entender como esse processo pode ser estruturado, veja o guia de{' '}
        <a href="/feedback-de-clientes" className="underline">feedback de clientes</a>.
      </p>

      <H2>3. Trate avaliações públicas como parte da operação</H2>
      <p>
        Para as avaliações que chegam ao Google, estabeleça um responsável e um prazo interno de resposta.
        Acompanhe a evolução da nota, a quantidade de novas avaliações e os temas recorrentes. Uma clínica com
        várias unidades também deve comparar esses indicadores por local, porque médias consolidadas podem
        esconder problemas específicos.
      </p>

      <H2>4. Analise temas, não apenas estrelas</H2>
      <p>
        A nota resume a percepção, mas o texto da avaliação costuma explicar o motivo. Agrupe comentários por
        temas como recepção, tempo de espera, atendimento clínico, comunicação, cobrança e facilidade de agendamento.
        A análise por tema ajuda a separar problemas pontuais de padrões recorrentes e facilita a definição de prioridades.
      </p>
      <p>
        Para transformar grandes volumes de comentários em sinais operacionais, conheça a{' '}
        <a href="/analise-de-avaliacoes-com-ia" className="underline">análise de avaliações com IA</a>.
      </p>

      <H2>5. Transforme os dados em ações</H2>
      <p>
        Toda semana, escolha os principais motivos negativos e registre uma ação concreta para cada um. Depois,
        acompanhe se o volume daquele tema diminuiu. O valor do processo está em transformar comentários de
        pacientes em melhoria operacional mensurável.
      </p>

      <H2>6. Acompanhe a reputação por unidade</H2>
      <p>
        Se a clínica possui mais de uma unidade, acompanhe cada endereço separadamente. Uma média geral pode
        esconder uma unidade com queda de avaliações, aumento de reclamações ou demora nas respostas. Compare
        volume de avaliações, nota média, temas recorrentes e velocidade de resposta por período.
      </p>

      <H2>7. Checklist rápido para a equipe</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Definir quando o pedido de feedback acontece.</li>
        <li>Disponibilizar QR code ou link simples.</li>
        <li>Registrar temas recorrentes de insatisfação.</li>
        <li>Responder avaliações públicas com responsável definido.</li>
        <li>Analisar textos além da nota em estrelas.</li>
        <li>Comparar unidades e acompanhar tendências semanalmente.</li>
        <li>Registrar ações e verificar se os indicadores melhoraram.</li>
      </ul>

      <H2>8. Google Business Profile e jornada do paciente</H2>
      <p>
        A reputação da clínica não começa quando o paciente chega à recepção. Muitas jornadas começam
        na pesquisa local, quando a pessoa compara nome, localização, serviços, horário e avaliações.
        Por isso, mantenha as informações públicas da unidade consistentes e trate o perfil da empresa
        no Google como parte da experiência digital, junto com o site e os canais de atendimento.
      </p>
      <p>
        Para uma visão mais ampla da presença local, veja o guia de{' '}
        <a href="/blog/seo-local-avaliacoes-local-pack" className="underline">SEO local e avaliações</a>.
      </p>

      <H2>9. Da reputação para o crescimento</H2>
      <p>
        Reputação não precisa ser acompanhada apenas quando surge uma reclamação. Uma rotina contínua de coleta,
        análise e resposta cria uma visão mais clara da experiência do paciente e dos pontos que afetam a percepção
        da clínica. Quando os dados viram ações, avaliações deixam de ser apenas um indicador e passam a alimentar
        decisões de operação, atendimento e crescimento.
      </p>
      <p>
        A <a href="/filtra-ai" className="underline">Filtra.AI</a> é uma plataforma brasileira de gestão de
        reputação online, avaliações Google e feedback de clientes com inteligência artificial. Se quiser avaliar
        a situação atual da sua reputação, comece pela{' '}
        <a href="/auditoria-gratuita" className="underline">auditoria gratuita</a>.
      </p>
    </BlogArticle>
  );
}
