import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Pedir estrela no WhatsApp vs filtrar no QR: comparativo',
  description:
    'Compare só enviar o link do Google pelo WhatsApp com um QR que filtra notas antes do Maps. Prós, contras e quando usar cada um.',
  alternates: { canonical: '/blog/whatsapp-pedir-estrela-vs-filtrar-qr' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="Comparação"
      title="Pedir estrela no WhatsApp vs filtrar no QR"
      lead="Os dois podem coexistir. O erro é tratar o link cru do Google como única estratégia."
    >
      <H2>Só WhatsApp + link do Google</H2>
      <p>
        Prós: simples, zero setup. Contras: cliente irritado também recebe o mesmo link; você não vê o
        feedback estruturado; tom “me dá 5★” arrisca política e credibilidade.
      </p>
      <H2>QR / link com filtro (Filtra.AI)</H2>
      <p>
        Prós: captura no momento da experiência; 4–5★ seguem ao Google; 1–3★ no painel com contexto. Contras:
        exige colocar o QR no fluxo físico ou digital uma vez.
      </p>
      <H2>Quando combinar</H2>
      <p>
        Use QR no balcão/consulta e WhatsApp no pós-venda para quem não escaneou. A mensagem pode apontar para
        o mesmo canal Filtra, não só para o Maps cru.
      </p>
      <H2>Teste A/B de uma semana</H2>
      <p>
        Semana A: só link Google. Semana B: QR Filtra. Compare quantidade de reviews públicos e qualidade do
        aprendizado interno. O trial de 7 dias existe para isso.
      </p>
    </BlogArticle>
  );
}
