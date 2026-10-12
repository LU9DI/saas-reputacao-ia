'use client';

import { useSyncExternalStore } from 'react';

/**
 * Id da rota dinâmica (/painel/:id, /avaliacao/:id, /widget/:id) lido da URL real do navegador.
 *
 * O deploy no Cloudflare Pages é um export estático: essas páginas são pré-renderizadas uma
 * única vez com o id "_" e o `_redirects` serve esse mesmo HTML para qualquer id. Por isso
 * `useParams()` devolveria o placeholder; aqui o id vem de `window.location`.
 * No servidor / primeira renderização devolve '' (as páginas já tratam id vazio).
 */
export function useRouteId(): string {
  return useSyncExternalStore(subscribe, readId, () => '');
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function readId(): string {
  const segment = window.location.pathname.split('/').filter(Boolean)[1] ?? '';
  try {
    const id = decodeURIComponent(segment);
    return id === '_' ? '' : id;
  } catch {
    return '';
  }
}
