import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';
import { BlogSchema } from '../../components/BlogSchema';
import { OG_IMAGE_META, buildTwitter } from '../../lib/blogSchema';

export const metadata: Metadata = {
  title: 'WhatsApp ou QR Code para pedir avaliações Google: comparativo',
  description:
    'Compare WhatsApp e QR Code para convidar clientes a deixar avaliações honestas, organizar feedback e acompanhar a reputação sem pressão por nota.',
  alternates: { canonical: '/blog/whatsapp-pedir-estrela-vs-filtrar-qr' },
  openGraph: {
    type: 'article',
    url: 'https://filtraai.com/blog/whatsapp-pedir-estrela-vs-filtrar-qr',
    title: 'WhatsApp ou QR Code para pedir avaliações Google',
    description:
      'Compare WhatsApp e QR Code para convidar clientes a deixar avaliações honestas, organizar feedback e acompanhar a reputação sem pressão por nota.',
    images: [OG_IMAGE_META],
  },
  twitter: buildTwitter(
    'WhatsApp ou QR Code para pedir avaliações Google',
    'Compare WhatsApp e QR Code para convidar clientes a deixar avaliações honestas, organizar feedback e acompanhar a reputação sem pressão por nota.',
  ),
};

export default function Page() {
  return (
    <>
      <BlogSchema
        headline="WhatsApp ou QR Code para pedir avaliações Google"
        description="Compare WhatsApp e QR Code para convidar clientes a deixar avaliações honestas, organizar feedback e acompanhar a reputação sem pressão por nota."
        canonical="https://filtraai.com/blog/whatsapp-pedir-estrela-vs-filtrar-qr"
        datePublished="2026-09-23"
        dateModified="2026-10-05"
      />
      <BlogArticle
      kicker="Comparação"
      title="WhatsApp ou QR Code para pedir avaliações Google"
      lead="Os dois canais podem coexistir. O ponto é facilitar uma avaliação genuína e transformar feedback em aprendizado para a operação."
    >
      <H2>WhatsApp + link do Google</H2>
      <p>
        Prós: simples e rápido de implantar. Contras: a mensagem pode desaparecer no histórico e o negócio
        perde contexto sobre a experiência que levou à avaliação.
      </p>
      <H2>QR / link com fluxo de feedback</H2>
      <p>
        Prós: captura o feedback próximo da experiência, organiza temas e facilita um convite para avaliação
        pública. O cliente continua livre para decidir se publica no Google e qual nota ou texto deseja usar.
      </p>
      <H2>Quando combinar</H2>
      <p>
        Use QR no balcão, consulta ou embalagem e WhatsApp no pós-venda para quem não teve contato com o
        material físico. Os dois caminhos podem apontar para uma experiência de feedback consistente.
      </p>
      <H2>Teste A/B de uma semana</H2>
      <p>
        Semana A: só link Google. Semana B: QR com feedback estruturado. Compare volume de feedback, taxa de
        resposta, temas recorrentes e avaliações públicas genuínas. O trial de 7 dias existe para isso.
      </p>
      </BlogArticle>
    </>
  );
}
