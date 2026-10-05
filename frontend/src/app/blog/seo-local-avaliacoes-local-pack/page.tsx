import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Pacotes de SEO local: guia completo para empresas e agências | Filtra.AI',
  description:
    'Pacotes de SEO local para empresas e agências: veja o que incluir, como conectar Google Business Profile, avaliações, reputação e oportunidades no Google Maps.',
  alternates: { canonical: 'https://filtraai.com/blog/seo-local-avaliacoes-local-pack' },
  openGraph: {
    type: 'article',
    title: 'Pacotes de SEO local: avaliações Google e Local Pack',
    description:
      'Como estruturar pacotes de SEO local conectando presença local, avaliações Google, reputação e oportunidades no Maps.',
    url: 'https://filtraai.com/blog/seo-local-avaliacoes-local-pack',
  },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="SEO local"
      title="Pacotes de SEO local: o que incluir para gerar crescimento"
      lead="Um pacote de SEO local forte conecta presença local, Google Business Profile, avaliações, reputação e acompanhamento de oportunidades no Maps."
    >
      <H2>O que deve entrar em um pacote de SEO local?</H2>
      <p>
        Um pacote de SEO local pode combinar presença local, conteúdo útil, otimização do perfil empresarial,
        acompanhamento de avaliações, análise de reputação e recomendações mensais. A prioridade é criar um
        processo que gere melhoria mensurável, não apenas uma lista de tarefas.
      </p>

      <H2>Três pilares clássicos</H2>
      <p>
        Relevância, distância e destaque são os fundamentos mais conhecidos do resultado local.
        Categoria, serviços, localização, autoridade e avaliações ajudam a formar esse contexto.
      </p>

      <H2>Google Business Profile + site</H2>
      <p>
        Mantenha informações da empresa consistentes, serviços claros, páginas locais úteis e um perfil
        empresarial completo. Reviews não substituem isso: devem fazer parte de uma estratégia integrada.
      </p>

      <H2>O papel das avaliações Google</H2>
      <p>
        Quantidade, nota média, recência, texto relacionado aos serviços e respostas do negócio são sinais
        úteis para entender a força da reputação. Reviews não substituem um perfil local bem estruturado,
        mas fazem parte da experiência que o usuário encontra antes de escolher uma empresa.
      </p>
      <p>
        Para uma operação completa, veja também a{' '}
        <Link href="/avaliacoes-google" className="text-indigo-400 underline">
          gestão de avaliações Google
        </Link>{' '}
        e a{' '}
        <Link href="/gestao-de-reputacao-online" className="text-indigo-400 underline">
          gestão de reputação online
        </Link>.
      </p>

      <H2>Pacotes de SEO local: onde a reputação entra</H2>
      <p>
        Em um pacote de SEO local, monitorar avaliações pode ser uma camada operacional importante:
        acompanhar novos reviews, identificar temas recorrentes, medir evolução e transformar insights em
        recomendações para o cliente.
      </p>
      <p>
        Para agências, isso cria uma oferta mais completa de{' '}
        <Link href="/agencias" className="text-indigo-400 underline">
          gestão de reputação como serviço
        </Link>
        , conectando SEO, experiência do cliente e presença local.
      </p>

      <H2>Como transformar o pacote em rotina</H2>
      <p>
        Uma rotina mensal pode acompanhar presença local, novas avaliações, temas recorrentes, pontos de
        atenção e próximos testes. O objetivo não é manipular avaliações: é facilitar feedback autêntico,
        resolver problemas e tornar a experiência mais consistente.
      </p>
      <p>
        Empresas podem começar com uma{' '}
        <Link href="/auditoria-gratuita" className="text-indigo-400 underline">
          auditoria gratuita
        </Link>{' '}
        para identificar oportunidades de reputação e presença local.
      </p>
    </BlogArticle>
  );
}
