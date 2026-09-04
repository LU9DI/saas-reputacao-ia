'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getEnv } from '../utils/env';
import { validarSenhaEmpresa, SENHA_EMPRESA_HINT } from '../utils/passwordPolicy';

function RecuperarForm() {
  const search = useSearchParams();
  const tokenFromUrl = search.get('token') || '';

  const [modo, setModo] = useState<'pedir' | 'redefinir'>(tokenFromUrl ? 'redefinir' : 'pedir');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenFromUrl);
  const [novaSenha, setNovaSenha] = useState('');
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setModo('redefinir');
    }
  }, [tokenFromUrl]);

  const api = () => getEnv('NEXT_PUBLIC_API_URL') || 'http://localhost:5000';

  const pedirLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setMsg('');
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setErro('Informe um e-mail válido.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${api()}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na solicitação');
      setMsg(data.message || 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.');
    } catch (err: any) {
      setErro(err.message || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const redefinir = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setMsg('');
    const pol = validarSenhaEmpresa(novaSenha);
    if (!pol.ok) {
      setErro(pol.error);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${api()}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nova_senha: novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao redefinir');
      setMsg(data.message || 'Senha atualizada. Você já pode entrar.');
    } catch (err: any) {
      setErro(err.message || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-8 space-y-5">
        <h1 className="text-xl font-bold text-slate-900 text-center">Recuperação de senha</h1>
        <p className="text-sm text-slate-500 text-center">
          {modo === 'pedir'
            ? 'Informe o e-mail cadastrado. Enviaremos um link seguro para redefinir a senha.'
            : 'Defina uma nova senha forte para a conta da empresa.'}
        </p>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{erro}</p>
        )}
        {msg && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            {msg}
          </p>
        )}

        {modo === 'pedir' ? (
          <form onSubmit={pedirLink} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Enviar link por e-mail'}
            </button>
            <button
              type="button"
              className="w-full text-sm text-slate-500 underline"
              onClick={() => setModo('redefinir')}
            >
              Já tenho o token do e-mail
            </button>
          </form>
        ) : (
          <form onSubmit={redefinir} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Nova senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength={8}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">{SENHA_EMPRESA_HINT}</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400">
          <a href="/login" className="underline">
            Voltar ao login
          </a>
          {' · '}
          <a href="/" className="underline">
            Início
          </a>
        </p>
      </div>
    </div>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Carregando…</div>
      }
    >
      <RecuperarForm />
    </Suspense>
  );
}
