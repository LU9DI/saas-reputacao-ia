import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';

const faq = [
  {
    question: 'Quantas avaliações uma clínica precisa ter no Google?',
    answer:
      'Não existe um número fixo. O mais importante é ter avaliações recentes, responder aos comentários e manter a ficha do Google completa. Uma clínica com poucas avaliações, mas recentes e bem respondidas, transmite mais confiança do que um histórico antigo sem interação.',
  },
  {
    question: 'É permitido pedir avaliação ao paciente?',
    answer:
      'Sim, desde que o pedido seja honesto e não ofereça benefícios em troca de nota positiva. Peça a todos os pacientes, no momento adequado, e nunca selecione apenas quem está satisfeito. O objetivo é facilitar a opinião genuína, não manipular a nota.',
  },
  {
    question: 'Como responder a uma avaliação negativa de paciente?',
    answer:
      'Responda com respeito e transparência, sem expor dados clínicos ou discutir em público. Reconheça a experiência, explique o próximo passo e migre a conversa para um canal privado quando envolver informações do paciente. Registre o tema para tratar a causa internamente.',
  },
  {
    question: 'O que acompanhar além da nota média na clínica?',
    answer:
      'Acompanhe volume e recência das avaliações, temas recorrentes (espera, atendimento, comunicação, resultado), avaliações sem resposta, tempo de resposta e evolução por unidade. A nota média esconde o motivo da percepção; os temas mostram onde agir.',
  },
  {
    question: 'Avaliações Google influenciam a escolha de uma clínica?',
    answer:
      'Sim. A pesquisa local costuma ser uma das primeiras etapas do paciente, e as avaliações visíveis influenciam confiança e decisão. A ficha completa, com endereço, horários, serviços e respostas, reduz a incerteza de quem está comparando opções.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Clínicas: checklist de avaliações Google',
    description: 'Checklist prático para clínicas: feedback do paciente, avaliações Google, respostas, indicadores e ações para melhorar a reputação local.',
    alternates: { canonical: 'https://filtraai.com/blog/clinica-checklist-avaliacoes-google' },
    openGraph: {
      type: 'article',
      url: 'https://filtraai.com/blog/clinica-checklist-avaliacoes-google',
      title: 'Clínicas: checklist de avaliações Google',
      description: 'Checklist prático para clínicas: feedback do paciente, avaliações Google, respostas, indicadores e ações para melhorar a reputação local.',
    },
  };
}

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
        <Link href="/feedback-de-clientes" className="underline">feedback de clientes</Link>.
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
        <Link href="/analise-de-avaliacoes-com-ia" className="underline">análise de avaliações com IA</Link>.
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
        <Link href="/blog/seo-local-avaliacoes-local-pack" className="underline">SEO local e avaliações</Link>.
      </p>

      <H2>9. Da reputação para o crescimento</H2>
      <p>
        Reputação não precisa ser acompanhada apenas quando surge uma reclamação. Uma rotina contínua de coleta,
        análise e resposta cria uma visão mais clara da experiência do paciente e dos pontos que afetam a percepção
        da clínica. Quando os dados viram ações, avaliações deixam de ser apenas um indicador e passam a alimentar
        decisões de operação, atendimento e crescimento.
      </p>
      <p>
        A <Link href="/filtra-ai" className="underline">Filtra.AI</Link> é uma plataforma brasileira de gestão de
        reputação online, avaliações Google e feedback de clientes com inteligência artificial. Se quiser avaliar
        a situação atual da sua reputação, comece pela{' '}
        <Link href="/auditoria-gratuita" className="underline">auditoria gratuita</Link>.
      </p>

      <H2>10. Perguntas frequentes sobre avaliações Google em clínicas</H2>
      {faq.map((item) => (
        <div key={item.question} className="space-y-1">
          <p className="font-medium text-zinc-100">{item.question}</p>
          <p>{item.answer}</p>
        </div>
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }),
        }}
      />
    </BlogArticle>
  );
}
