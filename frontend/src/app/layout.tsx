import type { Metadata } from 'next';
// @ts-expect-error -- intentional side-effect import of a stylesheet
import './globals.css';

export const metadata: Metadata = {
  title: 'FILTRA.AI — Gestão de Reputação Online',
  description:
    'Sistema inteligente de contenção de crises e gestão de avaliações para comércios locais',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-black text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
