'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, senha }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }

      // Token fica em cookie httpOnly — limpa eventual localStorage antigo
      localStorage.removeItem('token_saas_reputacao');

      router.push('/admin');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErro('Tempo de conexão esgotado. Tente novamente.');
      } else {
        setErro(err.message === 'Failed to fetch' ? 'Erro de conexão com o servidor.' : err.message);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 text-slate-800">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel Administrativo</h1>
          <p className="text-sm text-slate-500">Entre com suas credenciais de gestor</p>
        </div>

        {erro && (
          <div
            role="alert"
            className="flex items-center gap-3 bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 text-sm"
          >
            <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
            >
              <Mail size={14} aria-hidden="true" /> E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErro('');
              }}
              placeholder="admin@seusaas.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-slate-50/50"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="senha"
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
            >
              <Lock size={14} aria-hidden="true" /> Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setErro('');
              }}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors text-sm shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
