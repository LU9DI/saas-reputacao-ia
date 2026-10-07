import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'QR Code no balcão para avaliações Google: guia prático',
  description:
    'Onde colocar o QR Code, como pedir avaliações honestas sem pressão e como transformar feedback em melhoria para restaurantes, clínicas e varejo.',
  alternates: { canonical: '/blog/qr-code-balcao-reviews' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="Implementação"
      title="QR Code no balcão para avaliações Google: guia prático"
      lead="O melhor convite para avaliação é fácil de encontrar, aparece perto da experiência e deixa o cliente decidir o que quer publicar."
    >
      <H2>Onde colocar</H2>
      <p>
        Mesa, cardápio, totem de fila, embalagem de delivery ou mensagem após o atendimento. Um único QR bem
        posicionado vale mais que cinco CTAs escondidos.
      </p>
      <H2>O que a equipe diz</H2>
      <p>
        Frase curta: “Se puder compartilhar sua experiência, ajuda muito.” Evite pressionar por uma nota
        específica ou oferecer vantagem em troca de avaliação. O objetivo é facilitar uma opinião genuína.
      </p>
      <H2>O que acontece depois do toque</H2>
      <p>
        Com o Filtra.AI, o cliente pode registrar feedback próximo à experiência e receber um convite para
        compartilhar uma avaliação genuína no Google. Quem preferir falar diretamente com a empresa também
        pode deixar feedback privado para acompanhamento.
      </p>
      <H2>Piloto de 7 dias</H2>
      <p>
        Escolha uma mesa ou um turno, meça quantos scans viram feedback e acompanhe quais temas aparecem.
        Ajuste o posicionamento do QR antes de escalar para toda a operação.
      </p>
      <H2>Como o QR entra em um pacote de SEO local</H2>
      <p>
        O QR é uma peça operacional, não uma estratégia isolada. Para definir frequência, entregáveis e métricas
        junto de avaliações, reputação e presença local, veja o guia de <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">pacotes de SEO local</Link>.
      <p>
        Para conectar o convite a uma operação contínua, veja também a <Link href="/reputacao-google" className="text-indigo-400 underline">gestão de avaliações Google</Link> e a <Link href="/como-melhorar-avaliacoes-google" className="text-indigo-400 underline">rotina para melhorar avaliações</Link>.
      </p>
      </p>
    </BlogArticle>
  );
}
