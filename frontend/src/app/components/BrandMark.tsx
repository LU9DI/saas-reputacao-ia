/**
 * Marca Filtra.AI — F em gradiente + wordmark (estilo oficial).
 * Usado em homepage, painéis, avaliação, QR, login, admin.
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
  sm: {
    word: 'text-[17px] sm:text-lg',
    icon: 28,
    sub: 'text-[7px] tracking-[0.26em]',
    gap: 'gap-2',
  },
  md: {
    word: 'text-xl sm:text-2xl',
    icon: 36,
    sub: 'text-[8px] tracking-[0.28em]',
    gap: 'gap-2.5',
  },
  lg: {
    word: 'text-3xl sm:text-4xl md:text-[42px]',
    icon: 48,
    sub: 'text-[9px] tracking-[0.3em]',
    gap: 'gap-3',
  },
};

/** Símbolo F — curvas em gradiente azul → roxo (como o mock) */
function FiltraIcon({ size }: { size: number }) {
  const uid = `fmark${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
      style={{
        filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.45)) drop-shadow(0 0 18px rgba(99,102,241,0.25))',
      }}
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="0.45" stopColor="#3b82f6" />
          <stop offset="0.75" stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${uid}-g2`} x1="20" y1="20" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93c5fd" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      {/* Forma superior do F (barra curva) */}
      <path
        d="M14 16c0-4.4 3.6-8 8-8h22c3.3 0 5.2 3.8 3.2 6.4L36 28.5c-1.2 1.6-3.1 2.5-5.1 2.5H22c-4.4 0-8-3.6-8-8V16Z"
        fill={`url(#${uid}-g)`}
      />
      {/* Haste / perna do F (curva descendente) */}
      <path
        d="M14 28h14c2.4 0 4.5 1.4 5.5 3.5l12.8 26.2c1.4 2.9-0.7 6.3-3.9 6.3h-8.2c-1.5 0-2.9-0.8-3.6-2.1L18.2 36.2C15.6 31.2 14 28.8 14 28Z"
        fill={`url(#${uid}-g2)`}
      />
      {/* Barra média sutil do F */}
      <path
        d="M22 34h14c1.7 0 3.1 1.1 3.6 2.7l1.2 3.8c0.4 1.3-0.6 2.5-1.9 2.5H26c-2.2 0-4-1.8-4-4v-5Z"
        fill={`url(#${uid}-g)`}
        opacity="0.92"
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
  // subtitle null = sem tagline; undefined = padrão discreto
  const sub = subtitle === null ? null : subtitle === undefined ? null : subtitle;

  const mark = (
    <div
      className={`inline-flex flex-col ${centered ? 'items-center text-center' : 'items-start'} ${className}`}
    >
      <span className={`inline-flex items-center ${s.gap}`}>
        <FiltraIcon size={s.icon} />
        {!iconOnly && (
          <span
            className={`font-semibold ${s.word} leading-none select-none tracking-[-0.02em]`}
            style={{
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
          >
            <span className="text-white">Filtra</span>
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              .AI
            </span>
          </span>
        )}
      </span>
      {sub && !iconOnly && (
        <span
          className={`mt-1.5 ${s.sub} uppercase text-zinc-500 font-medium`}
          style={
            centered
              ? undefined
              : { paddingLeft: s.icon + (size === 'lg' ? 12 : size === 'md' ? 10 : 8) }
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
        aria-label="Filtra.AI"
      >
        {mark}
      </Link>
    );
  }
  return <div aria-label="Filtra.AI">{mark}</div>;
}
