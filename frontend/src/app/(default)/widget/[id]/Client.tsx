'use client';

import { useEffect, useState } from 'react';
import { useRouteId } from '../../../utils/useRouteId';
import { apiFetch } from '../../../utils/apiFailover';

interface Review {
  name: string;
  rating: number;
  comment: string;
}

export default function WidgetProvas() {
  const id = useRouteId();
  const [nome, setNome] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- rota inválida: falha rápida no mount
      setErro('ID inválido');
      setLoading(false);
      return;
    }
    apiFetch(`/api/empresa/${id}/widget?limit=6`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Erro ao carregar');
        return j;
      })
      .then((data) => {
        setNome(data.empresa?.nome || '');
        setReviews(data.reviews || []);
      })
      .catch((e) => setErro(e.message || 'Falha na conexão'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-400 bg-white min-h-[120px]">
        Carregando…
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-white min-h-[120px]">{erro}</div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400 bg-white min-h-[120px]">
        Em breve, depoimentos{nome ? ` de ${nome}` : ''}.
      </div>
    );
  }

  return (
    <div className="bg-white p-5 md:p-6 font-sans">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">
        Clientes{nome ? ` · ${nome}` : ''}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <article
            key={i}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 flex flex-col"
          >
            <span className="text-amber-400 text-sm mb-2 tracking-tight">
              {'★'.repeat(r.rating)}
              <span className="text-slate-200">{'★'.repeat(5 - r.rating)}</span>
            </span>
            <p className="text-sm text-slate-700 leading-relaxed flex-1">
              “{r.comment}”
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">— {r.name || 'Cliente'}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
