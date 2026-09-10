/**
 * Marca FILTRA.AI — ícone + tipografia, reutilizável.
 * Identidade atualizada: F em camadas + azul/ciano/roxo e wordmark Filtra.AI.
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
  sm: { word: 'text-base sm:text-lg', icon: 30, sub: 'text-[9px] tracking-[0.18em]' },
  md: { word: 'text-xl sm:text-2xl', icon: 38, sub: 'text-[10px] tracking-[0.2em]' },
  lg: { word: 'text-2xl sm:text-3xl md:text-4xl', icon: 46, sub: 'text-[11px] tracking-[0.22em]' },
};

function FiltraIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id="filtraMarkGradient" x1="9" y1="7" x2="55" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="0.48" stopColor="#2563EB" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d="M8 20.5C8 12.49 14.49 6 22.5 6H57C55.45 16.42 46.47 24.5 35.83 24.5H8V20.5Z"
        fill="url(#filtraMarkGradient)"
      />
      <path
        d="M8 31.5C8 27.63 11.13 24.5 15 24.5H49.2C47.23 34.01 38.8 40.5 29.08 40.5H8V31.5Z"
        fill="url(#filtraMarkGradient)"
        opacity="0.96"
      />
      <path
        d="M8 40.5H29.08C28.54 48.38 24.09 55.02 16.76 59L8 63V40.5Z"
        fill="url(#filtraMarkGradient)"
      />
    </svg>
  );
}

export function BrandMark({
  href = '/',
  size = 'md',
  subtitle,
  className = '',
  centered = false,
  iconOnly = false,
}: Props) {
  const s = sizes[size];
  const sub = subtitle === null ? null : subtitle === undefined ? 'Online Reputation' : subtitle;

  const mark = (
    <div
      className={`inline-flex flex-col ${centered ? 'items-center text-center' : 'items-start'} ${className}`}
    >
      <span className="inline-flex items-center gap-2.5">
        <FiltraIcon size={s.icon} />
        {!iconOnly && (
          <span className={`font-semibold ${s.word} leading-none select-none tracking-tight`}>
            <span className="text-zinc-50">Filtra</span>
            <span
              className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent"
            >
              .AI
            </span>
          </span>
        )}
      </span>
      {sub && !iconOnly ? (
        <span
          className={`mt-1.5 ${s.sub} uppercase text-zinc-500 font-medium ${centered ? '' : 'pl-[calc(0.625rem+30px)]'}`}
          style={size === 'sm' ? { paddingLeft: centered ? undefined : 38 } : undefined}
        >
          {sub}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-95 transition-opacity" aria-label="Filtra.AI">
        {mark}
      </Link>
    );
  }

  return <div aria-label="Filtra.AI">{mark}</div>;
}
