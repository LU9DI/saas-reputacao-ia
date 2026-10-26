import type { ReactNode } from 'react';

/**
 * Bloco de definição curta, escrito para continuar correto quando citado fora da página.
 * O termo vira um h2 e o texto deve responder à pergunta sem depender do restante do contexto.
 */
export function Definicao({ termo, children, id }: { termo: string; children: ReactNode; id?: string }) {
  return (
    <section className="definicao" id={id}>
      <h2>{termo}</h2>
      <div className="definicao-texto">{children}</div>
    </section>
  );
}
