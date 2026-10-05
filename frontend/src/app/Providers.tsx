'use client';

import { LanguageProvider } from './Contexts/LanguageContext';
import { ApiWarmup } from './components/ApiWarmup';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ApiWarmup />
      {children}
    </LanguageProvider>
  );
}
