/**
 * Marca Filtra.AI do Índice: mesmo símbolo e wordmark da plataforma
 * (frontend/src/app/components/BrandMark.tsx), sem dependências do Next.
 */
const SIZES = { sm: { word: 17, icon: 28 }, md: { word: 21, icon: 34 } } as const;

function Icone({ size, uid }: { size: number; uid: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0, filter: 'drop-shadow(0 0 10px rgba(59,130,246,.45)) drop-shadow(0 0 18px rgba(99,102,241,.25))' }}
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset=".45" stopColor="#3b82f6" />
          <stop offset=".75" stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${uid}-g2`} x1="20" y1="20" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93c5fd" />
          <stop offset=".5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <path d="M14 16c0-4.4 3.6-8 8-8h22c3.3 0 5.2 3.8 3.2 6.4L36 28.5c-1.2 1.6-3.1 2.5-5.1 2.5H22c-4.4 0-8-3.6-8-8V16Z" fill={`url(#${uid}-g)`} />
      <path d="M14 28h14c2.4 0 4.5 1.4 5.5 3.5l12.8 26.2c1.4 2.9-.7 6.3-3.9 6.3h-8.2c-1.5 0-2.9-.8-3.6-2.1L18.2 36.2C15.6 31.2 14 28.8 14 28Z" fill={`url(#${uid}-g2)`} />
      <path d="M22 34h14c1.7 0 3.1 1.1 3.6 2.7l1.2 3.8c.4 1.3-.6 2.5-1.9 2.5H26c-2.2 0-4-1.8-4-4v-5Z" fill={`url(#${uid}-g)`} opacity=".92" />
    </svg>
  );
}

export function BrandMark({ size = 'md', uid = 'marca' }: { size?: keyof typeof SIZES; uid?: string }) {
  const s = SIZES[size];
  return (
    <a className="marca" href="https://filtraai.com/" aria-label="Filtra.AI">
      <Icone size={s.icon} uid={uid} />
      <span className="marca-nome" style={{ fontSize: s.word }}>
        <span className="marca-f">Filtra</span>
        <span className="marca-ai">.AI</span>
      </span>
    </a>
  );
}
