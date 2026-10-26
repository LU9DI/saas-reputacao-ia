import { serializeJsonLd } from '../lib/safeJsonLd';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RatingCalculator } from './RatingCalculator';
import { OG_IMAGE_META } from '../lib/socialMetadata';

const canonical = 'https://filtraai.com/calculadora-nota-google';

export const metadata: Metadata = {
  title: 'Calculadora de nota do Google: quantas avaliações faltam?',
  description: 'Calcule quantas avaliações seriam necessárias para alcançar uma nota desejada no Google. Simule cenários com nota atual, volume e média futura.',
  alternates: { canonical },
  openGraph: {
    type: 'website',
    url: canonical,
    title: 'Calculadora de nota do Google | Filtra.AI',
    description: 'Simule quantas avaliações seriam necessárias para alcançar a nota desejada, com uma estimativa matemática transparente.',
    siteName: 'Filtra.AI',
    images: [OG_IMAGE_META],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora de nota do Google | Filtra.AI',
    description: 'Simule quantas avaliações seriam necessárias para alcançar a nota desejada.',
    images: [OG_IMAGE_META.url],
  },
};

const faq = [
  {
    question: 'Como calcular quantas avaliações preciso para aumentar minha nota no Google?',
    answer: 'Informe a nota atual, o total de avaliações, a nota desejada e a média esperada das próximas avaliações. A calculadora estima quantas avaliações adicionais seriam necessárias pela fórmula da média aritmética.',
  },
  {
    question: 'A calculadora prevê a nota que o Google vai mostrar?',
    answer: 'Não. Ela oferece uma estimativa matemática baseada nos valores informados. O Google pode exibir uma nota arredondada, e a pontuação pode levar algum tempo para atualizar após novas avaliações.',
  },
  {
    question: 'Ter mais avaliações garante uma posição melhor no Google Maps?',
    answer: 'Não. O Google informa que resultados locais dependem principalmente de relevância, distância e proeminência. A quantidade e a qualidade das avaliações podem contribuir para a proeminência, mas não garantem uma posição específica.',
  },
  {
    question: 'Posso oferecer desconto em troca de avaliações positivas?',
    answer: 'Não. Pedidos de avaliação devem refletir experiências autênticas. Não ofereça incentivos em troca de avaliações, mudanças de nota ou remoção de críticas, nem selecione apenas clientes satisfeitos para pedir avaliações.',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://filtraai.com/' },
    { '@type': 'ListItem', position: 2, name: 'Avaliações Google', item: 'https://filtraai.com/avaliacoes-google' },
    { '@type': 'ListItem', position: 3, name: 'Calculadora de nota do Google', item: canonical },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

export default function CalculadoraNotaGooglePage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }} />
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
          <Link href="/" className="hover:text-indigo-300">Início</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/avaliacoes-google" className="hover:text-indigo-300">Avaliações Google</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-zinc-300">Calculadora de nota</span>
        </nav>

        <header className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-400">Ferramenta gratuita · Filtra.AI</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Calculadora de nota do Google: quantas avaliações faltam?</h1>
          <p className="text-lg leading-8 text-zinc-300">
            Simule quantas avaliações adicionais seriam necessárias para chegar à nota desejada. Compare cenários de forma transparente antes de definir metas para a sua rotina de reputação.
          </p>
        </header>

        <RatingCalculator />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Como a calculadora funciona</h2>
          <p className="leading-7 text-zinc-300">
            A estimativa usa a média aritmética: nota atual multiplicada pelo número de avaliações existentes, somada às novas avaliações esperadas, dividida pelo total depois das novas avaliações. O resultado indica o volume matemático aproximado para alcançar a meta inserida.
          </p>
          <p className="leading-7 text-zinc-300">
            Por exemplo, uma empresa com 100 avaliações e média 4,2 que deseja alcançar 4,7 precisaria de cerca de 167 novas avaliações com média 5,0, sob essas hipóteses. Se as próximas avaliações tiverem média menor, o volume necessário aumenta; se a média esperada não superar a meta, a meta não será atingida matematicamente.
          </p>
          <p className="leading-7 text-zinc-300">
            O cálculo é uma estimativa, não uma promessa de resultado. A nota pública pode ser arredondada, os dados inseridos podem não refletir a média exata usada internamente e o Google informa que a atualização da pontuação após uma nova avaliação pode levar algum tempo.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">A nota não é o único fator de SEO local</h2>
          <p className="leading-7 text-zinc-300">
            Melhorar a nota pode apoiar a confiança, mas não garante o topo do Google Maps. O Google explica que os resultados locais se baseiam principalmente em relevância, distância e proeminência. Mantenha o Perfil da Empresa completo e correto, responda às avaliações com contexto e construa uma experiência consistente para o cliente.
          </p>
          <p className="leading-7 text-zinc-300">
            Consulte as orientações oficiais do Google sobre <a className="text-indigo-300 underline" href="https://support.google.com/business/answer/7091?hl=pt-BR" rel="noopener noreferrer" target="_blank">classificação local</a>, <a className="text-indigo-300 underline" href="https://support.google.com/business/answer/4801187?hl=pt-BR" rel="noopener noreferrer" target="_blank">como a nota das avaliações é calculada</a> e <a className="text-indigo-300 underline" href="https://support.google.com/business/answer/3474122?hl=pt-BR" rel="noopener noreferrer" target="_blank">boas práticas para receber avaliações autênticas</a>.
          </p>
          <p className="leading-7 text-zinc-300">
            Para transformar avaliações em uma rotina de gestão, conheça a <Link href="/avaliacoes-google" className="text-indigo-300 underline">gestão de avaliações Google</Link>, o guia sobre <Link href="/como-melhorar-avaliacoes-google" className="text-indigo-300 underline">como melhorar avaliações Google</Link> e as práticas de <Link href="/gestao-de-reputacao-online" className="text-indigo-300 underline">gestão de reputação online</Link>.
          </p>
          <p className="leading-7 text-zinc-300">
            Para planejar uma estratégia local mais ampla, consulte também o <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-300 underline">guia de pacotes de SEO local</Link>, que explica como combinar presença local, avaliações, conteúdo e métricas sem prometer posições específicas.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold text-white">Perguntas frequentes</h2>
          {faq.map((item) => (
            <div key={item.question} className="space-y-2 border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-semibold text-zinc-100">{item.question}</h3>
              <p className="leading-7 text-zinc-300">{item.answer}</p>
            </div>
          ))}
        </section>

        <aside className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-xl font-semibold text-white">Da meta à melhoria contínua</h2>
          <p className="mt-2 leading-7 text-zinc-300">
            O objetivo não é perseguir estrelas a qualquer custo. Use feedback honesto para identificar problemas recorrentes, corrigir a experiência e facilitar que todos os clientes compartilhem sua opinião sem pressão.
          </p>
          <Link href="/auditoria-gratuita" className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-500">
            Fazer uma auditoria gratuita
          </Link>
        </aside>
      </div>
    </main>
  );
}
