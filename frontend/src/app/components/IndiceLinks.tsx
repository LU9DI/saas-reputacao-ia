import Link from 'next/link';

/**
 * Porta de entrada para o Índice Filtra.AI (publicado em /indice, outro serviço).
 * Dois links bastam: o resto do Índice é descoberto pelos links internos dele.
 * prefetch desligado: /indice não é renderizado por este app.
 */
export default function IndiceLinks({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      <Link href="/indice" prefetch={false} className="hover:text-zinc-300">Índice de estabelecimentos por município</Link>
      <Link href="/indice/rankings/ativos" prefetch={false} className="hover:text-zinc-300">Rankings por segmento</Link>
    </span>
  );
}
