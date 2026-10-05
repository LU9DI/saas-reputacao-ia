import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
export const metadata: Metadata={title:'Análise de avaliações com IA para empresas | Filtra.AI',description:'Analise avaliações de clientes com IA para identificar temas, riscos e oportunidades.',alternates: {
    canonical: 'https://filtraai.com/analise-de-avaliacoes-com-ia',
    languages: {
      'pt-BR': 'https://filtraai.com/analise-de-avaliacoes-com-ia',
      en: 'https://filtraai.com/en/ai-review-analysis',
      es: 'https://filtraai.com/es/analisis-resenas-ia',
      zh: 'https://filtraai.com/zh/ai-review-analysis',
      'x-default': 'https://filtraai.com/analise-de-avaliacoes-com-ia',
    },
  }};
export default function Page(){return <SeoLanding h1="Transforme centenas de avaliações em decisões de crescimento." lead="A análise manual de reviews consome tempo e deixa padrões importantes passarem. A Filtra.AI usa inteligência artificial para organizar a voz do consumidor." breadcrumbHref="/analise-de-avaliacoes-com-ia" sections={[{heading:'Como a análise de avaliações ajuda a gestão',body:'Uma análise estruturada permite enxergar recorrência, contexto e prioridade, especialmente quando o volume de avaliações cresce.'},{heading:'O que a IA pode revelar nas suas avaliações?',body:'Reclamações recorrentes, elogios que revelam diferenciais, problemas operacionais, riscos de reputação, oportunidades e temas de experiência.'},{heading:'De comentários soltos a temas recorrentes',body:'Agrupe sinais como atendimento, prazo, preço, qualidade, ambiente, comunicação e produto para tornar a evidência mais fácil de consultar.'},{heading:'Como usar a análise no dia a dia',body:'Reúna, organize, priorize, transforme achados em ações e responsáveis e depois meça as mudanças nas novas avaliações.'},{heading:'IA não substitui contexto',body:'Uma classificação automática pode errar ironia ou contexto. Os resultados devem apoiar a análise, não ser tratados como verdade isolada.'}]}/>}