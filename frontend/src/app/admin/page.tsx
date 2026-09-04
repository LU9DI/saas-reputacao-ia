'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Star, LogOut, RefreshCw, AlertCircle, Bot } from 'lucide-react';

interface Empresa {
  id: string;
  cnpj: string;
  nome_empresa: string;
  status: string;
  google_review_url: string | null;
  criado_em: string;
  expira_em: string;
}

interface Review {
  id: number;
  empresa_id: string | null;
  name: string;
  rating: number;
  comment: string;
  ai_reply: string | null;
  createdAt: string;
}

const TOKEN_KEY = 'admin_saas_token';

const apiUrl = () => (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function authHeaders(): HeadersInit {
  const h: Record<string, string> = {};
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* ignore */
  }
  return h;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    setErro('');
    try {
      const base = apiUrl();
      const headers = authHeaders();

      const meRes = await fetch(`${base}/api/admin/me`, {
        credentials: 'include',
        headers,
      });
      if (!meRes.ok) {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* */
        }
        router.replace('/admin/login');
        return;
      }

      const [resEmpresas, resReviews] = await Promise.all([
        fetch(`${base}/api/admin/empresas`, { credentials: 'include', headers }),
        fetch(`${base}/api/admin/reviews`, { credentials: 'include', headers }),
      ]);

      if (resEmpresas.ok) {
        setEmpresas(await resEmpresas.json());
      } else {
        setEmpresas([]);
      }
      if (resReviews.ok) {
        setReviews(await resReviews.json());
      } else {
        setReviews([]);
      }

      if (!resEmpresas.ok && !resReviews.ok) {
        setErro('Sessão ok, mas rotas /api/admin/empresas ou /reviews ainda não respondem no backend.');
      }
    } catch {
      setErro(`Falha ao buscar dados. API em ${apiUrl()} está online?`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl()}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
      });
    } catch {
      /* */
    }
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('token_saas_reputacao');
    } catch {
      /* */
    }
    window.location.assign('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Painel Administrativo</h1>
            <p className="text-sm text-slate-500">Visão geral das empresas e avaliações</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={carregarDados}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-xl border border-slate-200 transition-colors text-sm cursor-pointer"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-xl border border-slate-200 transition-colors text-sm cursor-pointer"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>

        {erro && (
          <div
            className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm"
            role="alert"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
              <Building2 size={16} className="text-indigo-500" />
              Empresas
            </div>
            <span className="text-2xl font-bold text-slate-900">{empresas.length}</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
              <Star size={16} className="text-yellow-500" />
              Avaliações
            </div>
            <span className="text-2xl font-bold text-slate-900">{reviews.length}</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
              <RefreshCw size={16} className="text-green-500" />
              Trials Ativos
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {empresas.filter((e) => e.status === 'trial').length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Empresas Registradas</h2>
          </div>
          {empresas.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Nenhuma empresa ativou o trial ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-5 py-3 text-left">Nome</th>
                    <th className="px-5 py-3 text-left">CNPJ</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Google</th>
                    <th className="px-5 py-3 text-left">Expira em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empresas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-medium text-slate-800">{empresa.nome_empresa}</td>
                      <td className="px-5 py-4 text-slate-600">{empresa.cnpj}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            empresa.status === 'ativo'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {empresa.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {empresa.google_review_url ? (
                          <a
                            href={empresa.google_review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline text-xs"
                          >
                            Link
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {new Date(empresa.expira_em).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Últimas Avaliações</h2>
          </div>
          {reviews.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Nenhuma avaliação recebida ainda.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviews.map((review) => (
                <div key={review.id} className="p-5 space-y-2">
                  <div className="flex items-start gap-4">
                    <div className="flex text-yellow-400 shrink-0">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < review.rating ? 'currentColor' : 'none'}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-slate-800">{review.name}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(review.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {review.comment ? (
                        <p className="text-sm text-slate-600">{review.comment}</p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Sem comentário</p>
                      )}
                    </div>
                  </div>
                  {review.ai_reply && (
                    <div className="ml-8 mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm">
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
