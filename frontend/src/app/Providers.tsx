'use client';

import { LanguageProvider } from './Contexts/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
