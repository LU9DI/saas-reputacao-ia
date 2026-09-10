/**
 * Marca Filtra.AI — símbolo + tipografia, reutilizável em todo o produto.
 * Uma única implementação mantém todas as ocorrências da marca consistentes.
 */
import Link from 'next/link';

type Props = {
  href?: string | null;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string | null;
  className?: string;
  centered?: boolean;
  iconOnly?: boolean;
};

const sizes = {
  sm: { word: 'text-lg sm:text-xl', icon: 30, sub: 'text-[8px] tracking-[0.2em]' },
  md: { word: 'text-2xl sm:text-[27px]', icon: 38, sub: 'text-[9px] tracking-[0.22em]' },
  lg: { word: 'text-3xl sm:text-4xl md:text-[42px]', icon: 48, sub: 'text-[10px] tracking-[0.24em]' },
};

function FiltraIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="filtraBrandGradient" x1="8" y1="5" x2="40" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5b4fc" />
          <stop offset="0.5" stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="#111113" stroke="url(#filtraBrandGradient)" strokeWidth="1.7" />
      <path d="M13 14h22l-7.5 10v9l-5.5-2.8v-6.2L13 14Z" fill="rgba(99,102,241,0.12)" stroke="url(#filtraBrandGradient)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32.8 10.5l1.15 2.35 2.55.38-1.85 1.8.44 2.55-2.29-1.2-2.3 1.2.44-2.55-1.85-1.8 2.56-.38 1.15-2.35Z" fill="#c7d2fe" />
      <circle cx="24" cy="37.5" r="1.7" fill="#818cf8" />
    </svg>
  );
}

export function BrandMark({ href = '/', size = 'md', subtitle, className = '', centered = false, iconOnly = false }: Props) {
  const s = sizes[size];
  const sub = subtitle === null ? null : subtitle === undefined ? 'Online Reputation' : subtitle;

  const mark = (
    <div className={`inline-flex flex-col ${centered ? 'items-center text-center' : 'items-start'} ${className}`}>
      <span className="inline-flex items-center gap-2.5">
        <FiltraIcon size={s.icon} />
        {!iconOnly && (
          <span className={`font-bold ${s.word} leading-none select-none tracking-[-0.025em]`}>
            <span className="text-zinc-50">FILTRA</span><span className="text-indigo-400">.AI</span>
          </span>
        )}
      </span>
      {sub && !iconOnly && (
        <span className={`mt-1.5 ${s.sub} uppercase text-zinc-500 font-medium ${centered ? '' : 'pl-[calc(0.625rem+30px)]'}`} style={size === 'sm' ? { paddingLeft: centered ? undefined : 40 } : undefined}>
          {sub}
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-block hover:opacity-90 transition-opacity" aria-label="FILTRA.AI — Online Reputation">{mark}</Link>;
  }
  return <div aria-label="FILTRA.AI">{mark}</div>;
}
