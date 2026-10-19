import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '../../components/BrandMark';

export const metadata: Metadata = {
  title: 'Como conseguir mais avaliações no Google (sem parecer spam)',
  description:
    'Guia prático para convidar avaliações honestas: momento, canal, boas práticas e como organizar feedback de clientes sem pressionar por uma nota específica.',
  alternates: { canonical: 'https://filtraai.com/blog/como-conseguir-avaliacoes-google', languages: { 'pt-BR': 'https://filtraai.com/blog/como-conseguir-avaliacoes-google', en: 'https://filtraai.com/en/blog/get-google-reviews', es: 'https://filtraai.com/es/blog/conseguir-resenas-google', zh: 'https://filtraai.com/zh/blog/google-reviews-guide', 'x-default': 'https://filtraai.com/blog/como-conseguir-avaliacoes-google' } },
  openGraph: {
    title: 'Como conseguir mais avaliações no Google sem parecer spam',
    description:
      'Pedidos no momento certo, tom honesto e um canal de feedback estruturado antes e depois do convite público.',
  },
};

export default function BlogAvaliacoesGooglePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
        <BrandMark size="md" subtitle="Blog" href="/" />
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          Trial 7 dias
        </Link>
      </header>
      <article className="max-w-3xl mx-auto px-4 pb-16 space-y-6 text-sm text-zinc-300 leading-relaxed">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Guia · SEO local</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">
            Como conseguir mais avaliações no Google (sem parecer spam)
          </h1>
          <p className="text-xs text-zinc-500">Conteúdo da <Link href="/filtra-ai" className="text-indigo-400 underline">Filtra.AI</Link>, plataforma brasileira de gestão de reputação online, avaliações Google e feedback de clientes com IA.</p>
          <p className="text-zinc-400">
            Volume importa — mas o jeito de pedir importa mais. Este guia é para donos de restaurante,
            clínica e varejo local que querem reviews reais e consistentes.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">1. Peça no momento da experiência</h2>
          <p>
            Um bom momento é logo após uma experiência real: conta paga no salão, consulta concluída,
            entrega no prazo ou serviço encerrado. A proximidade reduz atrito e aumenta a chance de o cliente
            registrar uma opinião ainda fresca.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">2. Facilite o caminho</h2>
          <p>
            QR no balcão, link curto no WhatsApp ou no comprovante. Quanto menos toques até a tela de
            avaliação, mais simples fica compartilhar uma experiência. Não é necessário criar uma rota que
            force uma nota específica.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">3. Não compre review e não force 5★</h2>
          <p>
            Avaliações pagas e incentivos que exijam nota máxima corroem confiança e podem contrariar regras
            da plataforma. Peça feedback honesto e deixe o cliente decidir se avalia, qual nota dá e o que
            escreve.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">4. Constância bate pico artificial</h2>
          <p>
            Uma rotina estável facilita acompanhar a percepção atual dos clientes. Em vez de um pico de pedidos
            seguido de silêncio, mantenha um processo contínuo de convites honestos, respostas e melhorias na
            operação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">5. Separe público de privado sem selecionar por nota</h2>
          <p>
            Nem todo feedback precisa ser publicado no Google. Um canal próprio (QR/link) permite que o cliente
            deixe um comentário diretamente para a empresa, enquanto quem desejar pode seguir para a avaliação
            pública. A escolha deve continuar com o cliente, independentemente da nota.
          </p>
          <p>
            É esse equilíbrio que o{' '}
            <Link href="/como-funciona" className="text-indigo-400 underline">
              Filtra.AI
            </Link>
            {' '}busca oferecer: feedback estruturado, convite para avaliações genuínas e contexto para a equipe
            melhorar a operação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">6. Responda o que já está público</h2>
          <p>
            Reviews antigas no Google ainda merecem resposta curta e profissional. Isso ajuda a mostrar que a
            empresa acompanha o que os clientes publicam e continua disponível para resolver problemas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">Checklist da primeira semana</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>QR ou link em um ponto de contato real (mesa, recepção, WhatsApp)</li>
            <li>Convite para opiniões honestas, sem pedido de nota específica</li>
            <li>Alguém responsável por ler o feedback e as avaliações públicas</li>
            <li>Uma melhoria de processo a partir dos temas recorrentes</li>
          </ul>
        </section>

        <p>
          Se você gerencia reputação de vários clientes, veja também{' '}
          <Link href="/agencias" className="text-indigo-400 underline">
            gestão de reputação para agências de SEO local
          </Link>{' '}
          e o guia sobre{' '}
          <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">
            SEO local e avaliações no Local Pack
          </Link>
          .
        </p>
        <p>
          Para transformar pedidos em uma rotina completa, veja também a <Link href="/reputacao-google" className="text-indigo-400 underline">gestão de avaliações Google</Link>, o guia de <Link href="/como-melhorar-avaliacoes-google" className="text-indigo-400 underline">como melhorar avaliações Google</Link> e a <Link href="/gestao-de-feedback" className="text-indigo-400 underline">gestão de feedback de clientes</Link>. Se o objetivo for acompanhar sinais ao longo do tempo, use a página de <Link href="/monitoramento-reputacao-online" className="text-indigo-400 underline">monitoramento de reputação online</Link>.
        </p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <p className="text-zinc-100 font-medium">Teste o fluxo completo em 7 dias</p>
          <p>
            No Filtra.AI você ativa o trial sem cartão, gera o QR e acompanha feedback, temas e convites para
            avaliações genuínas no Google.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 text-sm"
          >
            Começar teste gratuito
          </Link>
        </div>

        <nav className="flex flex-wrap gap-3 text-xs text-zinc-500 pt-4 border-t border-zinc-800">
          <Link href="/blog/gestao-reputacao-online-guia" className="hover:text-zinc-300">
            Guia de reputação online
          </Link>
          <Link href="/restaurantes" className="hover:text-zinc-300">
            Para restaurantes
          </Link>
          <Link href="/clinicas" className="hover:text-zinc-300">
            Para clínicas
          </Link>
          <Link href="/pedir-estrela-vs-filtrar" className="hover:text-zinc-300">
            Pedir vs feedback
          </Link>
          <Link href="/como-funciona" className="hover:text-zinc-300">
            Como funciona
          </Link>
        </nav>
      </article>
    </div>
  );
}
