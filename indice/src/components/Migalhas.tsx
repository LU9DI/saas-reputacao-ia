import Link from 'next/link';

export function Migalhas({ itens, rotulo = 'Você está em' }: { itens: { nome: string; href?: string }[]; rotulo?: string }) {
  return (
    <nav className="migalhas" aria-label={rotulo}>
      <a href="https://filtraai.com/">Filtra.AI</a>
      {itens.map((i) => (
        <span key={i.nome}>
          / {i.href ? <Link href={i.href}>{i.nome}</Link> : i.nome}
        </span>
      ))}
    </nav>
  );
}
