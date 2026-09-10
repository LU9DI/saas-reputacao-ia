/**
 * Marca Filtra.AI — símbolo + tipografia premium.
 * Uma única implementação: homepage, painéis, avaliação, QR, e-mails de layout.
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
  sm: { word: 'text-lg sm:text-xl', icon: 32, sub: 'text-[8px] tracking-[0.28em]', gap: 'gap-2.5' },
  md: { word: 'text-2xl sm:text-[28px]', icon: 40, sub: 'text-[9px] tracking-[0.3em]', gap: 'gap-3' },
  lg: { word: 'text-3xl sm:text-4xl md:text-[44px]', icon: 52, sub: 'text-[10px] tracking-[0.32em]', gap: 'gap-3.5' },
};

/** Emblema: escudo de reputação + funil de filtro + estrela */
function FiltraIcon({ size }: { size: number }) {
  const uid = `fg${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0 drop-shadow-[0_2px_8px_rgba(99,102,241,0.35)]"
    >
      <defs>
        <linearGradient id={`${uid}-ring`} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e0e7ff" />
          <stop offset="0.35" stopColor="#a5b4fc" />
          <stop offset="0.7" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id={`${uid}-core`} x1="18" y1="12" x2="46" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c7d2fe" />
          <stop offset="0.5" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="40" y1="8" x2="56" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef3c7" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Base escura premium */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#0c0c0f" />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="15.25"
        stroke={`url(#${uid}-ring)`}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Escudo / reputação */}
      <path
        d="M32 12.5c6.2 3.2 12.8 4.2 18 4.6v14.2c0 9.6-6.4 17.4-18 20.7-11.6-3.3-18-11.1-18-20.7V17.1c5.2-.4 11.8-1.4 18-4.6Z"
        fill="rgba(99,102,241,0.14)"
        stroke={`url(#${uid}-core)`}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Funil de filtro (marca) */}
      <path
        d="M22 24h20l-6.8 8.6v8.2l-6.4-3.2v-5L22 24Z"
        fill={`url(#${uid}-core)`}
        fillOpacity="0.92"
        filter={`url(#${uid}-glow)`}
      />
      <path
        d="M22 24h20l-6.8 8.6v8.2l-6.4-3.2v-5L22 24Z"
        fill="none"
        stroke="#e0e7ff"
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />

      {/* Estrela de qualidade */}
      <path
        d="M48.2 14.2l1.05 2.15 2.35.34-1.7 1.66.4 2.34-2.1-1.1-2.1 1.1.4-2.34-1.7-1.66 2.35-.34 1.05-2.15Z"
        fill={`url(#${uid}-gold)`}
      />

      {/* Ponto de precisão */}
      <circle cx="32" cy="49.5" r="1.8" fill="#a5b4fc" opacity="0.9" />
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
      <span className={`inline-flex items-center ${s.gap}`}>
        <FiltraIcon size={s.icon} />
        {!iconOnly && (
          <span
            className={`font-semibold ${s.word} leading-none select-none tracking-[-0.03em]`}
            style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}
          >
            <span className="text-zinc-50">FILTRA</span>
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-500 bg-clip-text text-transparent">
              .AI
            </span>
          </span>
        )}
      </span>
      {sub && !iconOnly && (
        <span
          className={`mt-2 ${s.sub} uppercase text-zinc-500 font-medium ${centered ? '' : ''}`}
          style={
            centered
              ? undefined
              : { paddingLeft: s.icon + (size === 'lg' ? 14 : size === 'md' ? 12 : 10) }
          }
        >
          {sub}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-block hover:opacity-95 transition-opacity duration-200"
        aria-label="FILTRA.AI — Online Reputation"
      >
        {mark}
      </Link>
    );
  }
  return <div aria-label="FILTRA.AI — Online Reputation">{mark}</div>;
}
