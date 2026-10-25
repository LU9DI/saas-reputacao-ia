import { JsonLd, faqLd } from '@/lib/seo';

export type ItemFaq = { pergunta: string; resposta: string };

/** O JSON-LD sai do mesmo array que o texto visível: os dois não têm como divergir. */
export function Faq({ itens }: { itens: ItemFaq[] }) {
  return (
    <section>
      <JsonLd data={faqLd(itens)} />
      <h2>Perguntas frequentes</h2>
      {itens.map((i) => (
        <details key={i.pergunta}>
          <summary>{i.pergunta}</summary>
          <p>{i.resposta}</p>
        </details>
      ))}
    </section>
  );
}
