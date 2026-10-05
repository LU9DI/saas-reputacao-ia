'use client';

import { LanguageProvider } from './Contexts/LanguageContext';
import { ApiWarmup } from './components/ApiWarmup';
import { DotGlobalSurface } from './DotGlobalSurface';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ApiWarmup />
      {children}
      <DotGlobalSurface />
    </LanguageProvider>
  );
}
