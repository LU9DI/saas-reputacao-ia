import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'QR Code no balcão: fluxo que aumenta reviews 4–5★',
  description:
    'Onde colocar o QR, como treinar a equipe e como o filtro de notas ajuda a mandar avaliações boas ao Google.',
  alternates: { canonical: '/blog/qr-code-balcao-reviews' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="Implementação"
      title="QR Code no balcão: fluxo que aumenta reviews 4–5★"
      lead="O melhor link de avaliação é o que está na frente do cliente satisfeito — não o que fica perdido no Instagram."
    >
      <H2>Onde colocar</H2>
      <p>
        Mesa, cardápio, totem de fila, embalagem de delivery, rodapé do WhatsApp após o atendimento. Um único
        QR bem posicionado vale mais que cinco CTAs escondidos.
      </p>
      <H2>O que a equipe diz</H2>
      <p>
        Frase curta: “Se puder avaliar em 20 segundos, ajuda muito.” Sem pressionar nota máxima. Honestidade
        protege a conta no Google e a confiança do cliente.
      </p>
      <H2>Filtro depois do toque</H2>
      <p>
        Com o Filtra.AI, o cliente avalia no seu canal. 4–5★ seguem para o Google; 1–3★ vão ao painel. Você
        ganha volume de reviews públicos positivos e visibilidade interna dos problemas.
      </p>
      <H2>Piloto de 7 dias</H2>
      <p>
        Escolha uma mesa ou um turno, meça quantos scans viram feedback e ajuste o posicionamento do QR antes
        de escalar para toda a operação.
      </p>
    </BlogArticle>
  );
}
