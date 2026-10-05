'use client';

import Link from 'next/link';
import { BrandMark } from './BrandMark';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SeoPageHeader() {
  return (
    <header className="border-b border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link href="/" aria-label="Filtra.AI">
          <BrandMark size="sm" subtitle="Reputação" />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white">
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
