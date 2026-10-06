'use client';

import { LanguageProvider } from './Contexts/LanguageContext';
import { ApiWarmup } from './components/ApiWarmup';
import { DotAgentSurface } from './dot/DotAgentSurface';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ApiWarmup />
      {children}
      <DotAgentSurface />
    </LanguageProvider>
  );
}
