import Link from 'next/link';

export function Migalhas({ itens }: { itens: { nome: string; href?: string }[] }) {
  return (
    <nav className="migalhas" aria-label="Você está em">
      <a href="https://filtraai.com/">Filtra.AI</a>
      {itens.map((i) => (
        <span key={i.nome}>
          / {i.href ? <Link href={i.href}>{i.nome}</Link> : i.nome}
        </span>
      ))}
    </nav>
  );
}
