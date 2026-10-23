'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const STORAGE_KEY = 'filtra_utm_v1';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

function readFromSearch(search: string): UtmParams {
  const params = new URLSearchParams(search);
  const result: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = String(params.get(key) || '').trim().slice(0, 120);
    if (value) result[key] = value;
  }
  return result;
}

function readFromStorage(): UtmParams {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: UtmParams = {};
    for (const key of UTM_KEYS) {
      const value = String((parsed as Record<string, unknown>)[key] || '').trim().slice(0, 120);
      if (value) result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Preserva a origem da campanha quando o visitante navega de uma página
 * editorial para a auditoria gratuita. Não coleta dados pessoais.
 */
export function UtmAttribution() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const incoming = readFromSearch(window.location.search);
    let utm = incoming;
    if (Object.keys(incoming).length) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
      } catch {
        /* sessionStorage pode estar indisponível */
      }
    } else {
      utm = readFromStorage();
    }
    if (!Object.keys(utm).length) return;

    document.querySelectorAll<HTMLAnchorElement>('a[href*="/auditoria-gratuita"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      try {
        const url = new URL(href, window.location.origin);
        for (const key of UTM_KEYS) {
          const value = utm[key];
          if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
        }
        const next = `${url.pathname}${url.search}${url.hash}`;
        if (link.getAttribute('href') !== next) link.setAttribute('href', next);
      } catch {
        /* não altera links inválidos */
      }
    });

    const intercept = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>('a[href*="/auditoria-gratuita"]');
      if (!link) return;
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      const url = new URL(href, window.location.origin);
      for (const key of UTM_KEYS) {
        const value = utm[key];
        if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
      }
      const next = `${url.pathname}${url.search}${url.hash}`;
      event.preventDefault();
      event.stopPropagation();
      router.push(next);
    };
    document.addEventListener('click', intercept, true);
    return () => document.removeEventListener('click', intercept, true);
  }, [pathname, router]);

  return null;
}
