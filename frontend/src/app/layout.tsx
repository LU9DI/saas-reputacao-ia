import type { Metadata } from 'next';
// CSS is handled by Next.js at build time; TypeScript has no declaration for it.
// @ts-expect-error -- intentional side-effect import of a stylesheet
import './globals.css';

export const metadata: Metadata = {
  title: 'FILTRA.AI — Gestão de Reputação Online',
  description: 'Sistema inteligente de contenção de crises e gestão de avaliações para comércios locais',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
