import Link from 'next/link';
import { BrandMark } from './BrandMark';

export function SiteHeader() {
  return (
    <header className="topo">
      <div className="wrap topo-in">
        <div className="topo-marca">
          <BrandMark uid="topo" />
          <Link className="topo-secao" href="/">Índice</Link>
        </div>
        <nav aria-label="Principal">
          <Link href="/">Início</Link>
          <Link href="/rankings/ativos">Rankings</Link>
          <Link href="/metodologia">Metodologia</Link>
          <a className="botao botao-sm" href="https://filtraai.com/auditoria-gratuita?utm_source=indice&utm_medium=seo&utm_campaign=topo">Auditoria gratuita</a>
        </nav>
      </div>
    </header>
  );
}
