import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '../../components/BrandMark';

export const metadata: Metadata = {
  title: 'Como conseguir mais avaliações no Google (sem parecer spam)',
  description:
    'Guia prático: quando pedir review, o que evitar nas políticas do Google, velocity de avaliações e como um QR com filtro ajuda restaurantes e clínicas. Trial Filtra.AI 7 dias.',
  alternates: { canonical: '/blog/como-conseguir-avaliacoes-google' },
  openGraph: {
    title: 'Como conseguir mais avaliações no Google sem parecer spam',
    description:
      'Pedidos no momento certo, tom honesto e um canal próprio antes do Maps. O que funciona em 2026.',
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
          <p className="text-zinc-400">
            Volume importa — mas o jeito de pedir importa mais. Este guia é para donos de restaurante,
            clínica e varejo local que querem reviews reais e consistentes.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">1. Peça no pico de satisfação</h2>
          <p>
            O melhor momento é logo após uma boa experiência: conta paga no salão, consulta concluída,
            entrega no prazo. Mensagens genéricas semanas depois convertem pouco e soam automáticas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">2. Facilite o caminho</h2>
          <p>
            QR no balcão, link curto no WhatsApp ou no comprovante. Quanto menos toques até a tela de
            avaliação, maior a taxa de conclusão. Se o cliente precisa “caçar” seu perfil no Maps, a
            maioria desiste.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">3. Não compre review e não force 5★</h2>
          <p>
            Avaliações pagas e incentivos que exijam nota máxima violam políticas do Google e corroem
            confiança. Peça feedback honesto. Clientes satisfeitos naturalmente tendem a notas altas;
            o trabalho da operação é gerar essa satisfação — e capturar o momento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">4. Velocity bate estoque parado</h2>
          <p>
            No Local Pack e em recomendações assistidas por IA, reviews recentes pesam. Cinco a quinze
            avaliações novas por mês, de forma estável, costumam comunicar mais “negócio ativo” do que
            200 reviews antigas e zero movimento há um trimestre.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">5. Separe o que é público do que é processo</h2>
          <p>
            Nem todo feedback precisa nascer no Google. Um canal próprio (QR/link) permite que notas
            altas sigam para o Google Reviews e que insatisfações sejam tratadas no painel — com tempo
            para corrigir atraso, atendimento ou produto antes de virar crise pública.
          </p>
          <p>
            É exatamente o modelo do{' '}
            <Link href="/como-funciona" className="text-indigo-400 underline">
              Filtra.AI
            </Link>
            : 4–5★ orientadas ao Google; 1–3★ no painel com apoio de IA.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">6. Responda o que já está público</h2>
          <p>
            Reviews antigas no Google ainda merecem resposta curta e profissional. Isso mostra cuidado
            a quem está pesquisando agora e reforça sinais de perfil ativo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">Checklist da primeira semana</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>QR ou link em um ponto de contato real (mesa, recepção, WhatsApp)</li>
            <li>Meta modestável: poucas avaliações honestas, não um pico artificial</li>
            <li>Alguém responsável por ler o painel todo dia</li>
            <li>Uma melhoria de processo a partir dos feedbacks 1–3★</li>
          </ul>
        </section>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <p className="text-zinc-100 font-medium">Teste o fluxo completo em 7 dias</p>
          <p>
            No Filtra.AI você ativa o trial sem cartão, gera o QR e vê na prática quantos feedbacks
            entram — e quantos 4–5★ seguem para o Google.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 text-sm"
          >
            Começar teste gratuito
          </Link>
        </div>

        <nav className="flex flex-wrap gap-3 text-xs text-zinc-500 pt-4 border-t border-zinc-800">
          <Link href="/restaurantes" className="hover:text-zinc-300">
            Para restaurantes
          </Link>
          <Link href="/clinicas" className="hover:text-zinc-300">
            Para clínicas
          </Link>
          <Link href="/pedir-estrela-vs-filtrar" className="hover:text-zinc-300">
            Pedir vs filtrar
          </Link>
          <Link href="/como-funciona" className="hover:text-zinc-300">
            Como funciona
          </Link>
        </nav>
      </article>
    </div>
  );
}
