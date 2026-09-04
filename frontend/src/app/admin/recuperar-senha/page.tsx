'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** Compatibilidade: redireciona para o login admin (recuperação embutida). */
function Redirect() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token');

  useEffect(() => {
    if (token) {
      router.replace(`/admin/login?token=${encodeURIComponent(token)}`);
    } else {
      router.replace('/admin/login');
    }
  }, [router, token]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
      Redirecionando…
    </div>
  );
}

export default function AdminRecuperarSenhaRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
          Carregando…
        </div>
      }
    >
      <Redirect />
    </Suspense>
  );
}
