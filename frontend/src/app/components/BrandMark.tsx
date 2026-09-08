/**
 * Marca FILTRA.AI — simples, elegante, reutilizável.
 */
import Link from 'next/link';

type Props = {
  href?: string | null;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string | null;
  className?: string;
};

const sizes = {
  sm: { word: 'text-lg', ai: 'text-lg', gap: 'tracking-[0.12em]' },
  md: { word: 'text-2xl', ai: 'text-2xl', gap: 'tracking-[0.14em]' },
  lg: { word: 'text-3xl md:text-4xl', ai: 'text-3xl md:text-4xl', gap: 'tracking-[0.16em]' },
};

export function BrandMark({ href = '/', size = 'md', subtitle, className = '' }: Props) {
  const s = sizes[size];

  const mark = (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <span
        className={`font-semibold ${s.word} ${s.gap} leading-none select-none`}
        style={{ letterSpacing: size === 'lg' ? '0.14em' : '0.12em' }}
      >
        <span className="text-zinc-50">FILTRA</span>
        <span className="text-indigo-400">.AI</span>
      </span>
      {subtitle ? (
        <span className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-medium">
          {subtitle}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-90 transition-opacity" aria-label="FILTRA.AI">
        {mark}
      </Link>
    );
  }

  return <div aria-label="FILTRA.AI">{mark}</div>;
}
