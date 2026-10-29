import { JsonLd, faqLd } from '@/lib/seo';

export type ItemFaq = { pergunta: string; resposta: string };

/**
 * O JSON-LD sai do mesmo array que o texto visível: os dois não têm como divergir.
 * `semJsonLd` omite o bloco FAQPage quando a página não deve emitir esse tipo de
 * dado estruturado (diretriz atual de rich results); o texto visível permanece.
 */
export function Faq({ itens, titulo = 'Perguntas frequentes', semJsonLd = false }: { itens: ItemFaq[]; titulo?: string; semJsonLd?: boolean }) {
  return (
    <section>
      {!semJsonLd && <JsonLd data={faqLd(itens)} />}
      <h2>{titulo}</h2>
      {itens.map((i) => (
        <details key={i.pergunta}>
          <summary>{i.pergunta}</summary>
          <p>{i.resposta}</p>
        </details>
      ))}
    </section>
  );
}
