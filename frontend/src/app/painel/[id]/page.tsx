'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Star,
  AlertTriangle,
  RefreshCw,
  Bot,
  Tag,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  ai_reply: string | null;
  ai_tags: string[];
  createdAt: string;
}

interface PainelData {
  empresa: {
    id: string;
    nome_empresa: string;
    status: string;
    expira_em: string;
    google_review_url: string | null;
  };
  reviews: Review[];
  metricas: {
    total: number;
    media: number;
    negativas: number;
    positivas: number;
    alerta_crise: boolean;
    crises_24h: number;
  };
  top_tags: { tag: string; count: number }[];
}

export default function PainelEmpresa() {
  const params = useParams();
  const empresaId = params.id as string;

  const [data, setData] = useState<PainelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/empresa/${empresaId}/painel`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Não foi possível carregar o painel.');
      }
      setData(await res.json());
    } catch (e: any) {
      setErro(e.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [empresaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (erro || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-slate-700">{erro || 'Painel indisponível.'}</p>
        <button
          onClick={carregar}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const { empresa, reviews, metricas, top_tags } = data;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{empresa.nome_empresa}</h1>
            <p className="text-sm text-slate-500">
              Painel de reputação · Trial até{' '}
              {new Date(empresa.expira_em).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={carregar}
            className="flex items-center gap-2 self-start bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {metricas.alerta_crise && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold">Alerta de crise</p>
              <p className="text-sm">
                {metricas.crises_24h} avaliações com 1–2 estrelas nas últimas 24 horas. Priorize o
                contato com esses clientes.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={<MessageSquare size={16} />} label="Total" value={String(metricas.total)} />
          <MetricCard
            icon={<TrendingUp size={16} />}
            label="Média"
            value={metricas.total ? metricas.media.toFixed(1) : '—'}
          />
          <MetricCard icon={<Star size={16} />} label="Positivas" value={String(metricas.positivas)} />
          <MetricCard
            icon={<AlertTriangle size={16} />}
            label="Negativas"
            value={String(metricas.negativas)}
          />
        </div>

        {top_tags.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Tag size={16} className="text-indigo-500" />
              Temas mais citados
            </h2>
            <div className="flex flex-wrap gap-2">
              {top_tags.map(({ tag, count }) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {tag}
                  <span className="bg-indigo-100 text-indigo-600 rounded-full px-1.5 py-0.5 text-[10px]">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Avaliações recebidas</h2>
          </div>
          {reviews.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              Ainda não há avaliações. Compartilhe o link ou o QR Code com seus clientes.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviews.map((review) => (
                <div key={review.id} className="p-5 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex text-yellow-400 shrink-0">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < review.rating ? 'currentColor' : 'none'}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800 text-sm">{review.name}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(review.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {review.comment ? (
                        <p className="text-sm text-slate-600">{review.comment}</p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Sem comentário</p>
                      )}
                      {review.ai_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {review.ai_tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {review.ai_reply && (
                    <div className="ml-6 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm">
                      <div className="flex items-center gap-1.5 text-indigo-600 font-medium mb-1">
                        <Bot size={14} />
                        Resposta sugerida pela IA
                      </div>
                      <p className="text-slate-700">{review.ai_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
        {icon}
        {label}
      </div>
      <span className="text-xl font-bold text-slate-900">{value}</span>
    </div>
  );
}
