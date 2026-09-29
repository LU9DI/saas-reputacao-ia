import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Acesse sua conta Filtra.AI com e-mail e senha.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
