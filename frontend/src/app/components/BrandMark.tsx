/**
 * Marca FILTRA.AI — ícone + tipografia, reutilizável.
 */
import Link from 'next/link';

type Props = {
  href?: string | null;
  size?: 'sm' | 'md' | 'lg';
  /** null = sem subtítulo; undefined = padrão "Online Reputation" */
  subtitle?: string | null;
  className?: string;
  /** centralizar (páginas públicas / obrigado) */
  centered?: boolean;
  /** só o ícone, sem texto */
  iconOnly?: boolean;
};

const sizes = {
  sm: {
    word: 'text-base sm:text-lg',
    icon: 28,
    sub: 'text-[9px] tracking-[0.18em]',
  },
  md: {
    word: 'text-xl sm:text-2xl',
    icon: 36,
    sub: 'text-[10px] tracking-[0.2em]',
  },
  lg: {
    word: 'text-2xl sm:text-3xl md:text-4xl',
    icon: 44,
    sub: 'text-[11px] tracking-[0.22em]',
  },
};

/** Ícone: filtro + estrela (reputação) em círculo indigo */
function FiltraIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id="filtraGrad" x1="8" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#18181b" stroke="url(#filtraGrad)" strokeWidth="1.5" />
      {/* funil / filtro */}
      <path
        d="M12 12h16l-5.5 7.5v6.5l-5-2.5v-4L12 12z"
        stroke="url(#filtraGrad)"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="rgba(99,102,241,0.15)"
      />
      {/* estrela pequena */}
      <path
        d="M28.5 9.2l.85 1.7 1.9.28-1.37 1.34.32 1.88-1.7-.9-1.7.9.32-1.88-1.37-1.34 1.9-.28.85-1.7z"
        fill="#a5b4fc"
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
  const sub =
    subtitle === null ? null : subtitle === undefined ? 'Online Reputation' : subtitle;

  const mark = (
    <div
      className={`inline-flex flex-col ${centered ? 'items-center text-center' : 'items-start'} ${className}`}
    >
      <span className="inline-flex items-center gap-2.5">
        <FiltraIcon size={s.icon} />
        {!iconOnly && (
          <span className={`font-semibold ${s.word} leading-none select-none tracking-wide`}>
            <span className="text-zinc-50">FILTRA</span>
            <span className="text-indigo-400">.AI</span>
          </span>
        )}
      </span>
      {sub && !iconOnly ? (
        <span
          className={`mt-1.5 ${s.sub} uppercase text-zinc-500 font-medium ${centered ? '' : 'pl-[calc(0.625rem+28px)]'} `}
          style={size === 'sm' ? { paddingLeft: centered ? undefined : 36 } : undefined}
        >
          {sub}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-block hover:opacity-90 transition-opacity"
        aria-label="FILTRA.AI — Online Reputation"
      >
        {mark}
      </Link>
    );
  }

  return <div aria-label="FILTRA.AI">{mark}</div>;
}
