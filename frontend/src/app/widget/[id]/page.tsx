'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star } from 'lucide-react';

interface Review {
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function WidgetProvasSociais() {
  const params = useParams();
  const empresaId = params.id as string;
  const [nome, setNome] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/empresa/${empresaId}/widget?limit=6`)
      .then((r) => r.json())
      .then((data) => {
        setNome(data.empresa?.nome || '');
        setReviews(data.reviews || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empresaId]);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm font-sans">Carregando avaliações…</div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm font-sans">
        Em breve, depoimentos de clientes{nome ? ` de ${nome}` : ''}.
      </div>
    );
  }

  return (
    <div className="font-sans bg-white p-4 md:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">
          O que dizem nossos clientes{nome ? ` · ${nome}` : ''}
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm"
          >
            <div className="flex text-amber-400 mb-2">
              {Array.from({ length: 5 }, (_, idx) => (
                <Star
                  key={idx}
                  size={14}
                  fill={idx < r.rating ? 'currentColor' : 'none'}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">“{r.comment}”</p>
            <p className="mt-2 text-xs font-medium text-slate-500">— {r.name || 'Cliente'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
