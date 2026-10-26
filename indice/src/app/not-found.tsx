import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <h1>Página não encontrada</h1>
      <p className="lead">
        Esta combinação de estado, município e segmento não existe no Índice ou não tem estabelecimentos suficientes para
        publicação.
      </p>
      <p>
        <Link href="/">Voltar ao Índice</Link> · <Link href="/metodologia">Metodologia e limites</Link>
      </p>
    </>
  );
}
