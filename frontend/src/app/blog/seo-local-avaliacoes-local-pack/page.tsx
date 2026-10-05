import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'SEO local e avaliações Google: o que ranqueia no Local Pack | Filtra.AI',
  description:
    'SEO local, Google Business Profile e avaliações: entenda relevância, distância, destaque, recência e como estruturar pacotes de SEO local para empresas.',
  alternates: { canonical: 'https://filtraai.com/blog/seo-local-avaliacoes-local-pack' },
  openGraph: {
    type: 'article',
    title: 'SEO local e avaliações Google: o que ranqueia no Local Pack',
    description:
      'Como conectar avaliações, reputação e SEO local para empresas e agências.',
    url: 'https://filtraai.com/blog/seo-local-avaliacoes-local-pack',
  },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="SEO local"
      title="SEO local e avaliações Google: o que realmente ranqueia no Local Pack"
      lead="SEO local não é só site: presença local, relevância e reputação precisam trabalhar juntas para transformar buscas próximas em clientes."
    >
      <H2>Três pilares clássicos</H2>
      <p>
        Relevância, distância e destaque são os fundamentos mais conhecidos do resultado local.
        Categoria, serviços, localização, autoridade e avaliações ajudam a formar esse contexto.
      </p>

      <H2>O papel das avaliações</H2>
      <p>
        Quantidade, nota média, recência, texto relacionado aos serviços e respostas do negócio são sinais
        úteis para entender a força da reputação. Reviews não substituem um perfil local bem estruturado,
        mas fazem parte da experiência que o usuário encontra antes de escolher uma empresa.
      </p>

      <H2>Site + Google Business Profile</H2>
      <p>
        Mantenha informações da empresa consistentes, serviços claros, páginas locais úteis e um perfil
        empresarial completo. Reviews não substituem isso: devem fazer parte de uma estratégia integrada.
      </p>

      <H2>Pacotes de SEO local: onde a reputação entra</H2>
      <p>
        Em um pacote de SEO local, monitorar avaliações pode ser uma camada operacional importante:
        acompanhar novos reviews, identificar temas recorrentes, medir evolução e transformar insights em
        recomendações para o cliente.
      </p>
      <p>
        Para agências, isso cria uma oferta mais completa de <Link href="/agencias" className="text-indigo-400 underline">
        gestão de reputação como serviço</Link>, conectando SEO, experiência do cliente e presença local.
      </p>

      <H2>Reputação como rotina de crescimento</H2>
      <p>
        O objetivo não é manipular avaliações. É facilitar feedback autêntico, resolver problemas e tornar
        a empresa mais consistente. A <Link href="/avaliacoes-google" className="text-indigo-400 underline">
        gestão de avaliações Google</Link> ajuda a transformar esse processo em rotina.
      </p>
    </BlogArticle>
  );
}
