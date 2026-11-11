import Link from 'next/link';
import { JsonLd, breadcrumb } from '@/lib/seo';

type Item = { nome: string; href?: string };

type Props = { itens: Item[]; rotulo?: string } & (
  | { indice?: false; caminhoAtual?: undefined }
  | { indice: true; caminhoAtual: string }
);

export function Migalhas(props: Props) {
  const { itens, rotulo = 'Você está em' } = props;
  const indice = props.indice === true;

  // O último item é a página atual: ele não tem href visível, mas entra no
  // BreadcrumbList com o caminho canônico informado pela rota.
  const trilha = indice
    ? breadcrumb(
        itens
          .map((item, i) => ({ nome: item.nome, caminho: item.href ?? (i === itens.length - 1 ? props.caminhoAtual : null) }))
          .filter((item): item is { nome: string; caminho: string } => item.caminho !== null),
      )
    : null;

  return (
    <>
      {trilha ? <JsonLd data={trilha} /> : null}
      <nav className="migalhas" aria-label={rotulo} data-indice={indice ? 'true' : undefined}>
        <a href="https://filtraai.com/">Filtra.AI</a>
        {itens.map((item, i) => {
          const atual = i === itens.length - 1 ? 'page' : undefined;
          return (
            <span key={`${item.nome}-${i}`}>
              / {item.href ? <Link href={item.href} aria-current={atual}>{item.nome}</Link> : <span aria-current={atual}>{item.nome}</span>}
            </span>
          );
        })}
      </nav>
    </>
  );
}
