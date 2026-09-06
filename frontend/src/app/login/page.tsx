'use client';

import { useState } from 'react';
import { Building2, Lock, AlertCircle, Fingerprint } from 'lucide-react';
import { getEnv } from '../utils/env';
import { PlanCards } from '../components/PlanCards';
import { readApiError } from '../utils/apiError';
import { loginWithPasskey, webauthnSupported } from '../utils/webauthnClient';

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm';

function nextPath(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const n = new URLSearchParams(window.location.search).get('next');
    if (n && n.startsWith('/') && !n.startsWith('//')) return n;
  } catch {
    /* */
  }
  return null;
}

export default function LoginPage() {
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBio, setLoadingBio] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  const aplicarMascaraCnpj = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '').substring(0, 14);
    let mascarado = apenasNumeros;
    if (mascarado.length > 2) mascarado = `${mascarado.substring(0, 2)}.${mascarado.substring(2)}`;
    if (mascarado.length > 6) mascarado = `${mascarado.substring(0, 6)}.${mascarado.substring(6)}`;
    if (mascarado.length > 10)
      mascarado = `${mascarado.substring(0, 10)}/${mascarado.substring(10)}`;
    if (mascarado.length > 15)
      mascarado = `${mascarado.substring(0, 15)}-${mascarado.substring(15)}`;
    setCnpj(mascarado);
  };

  const afterLogin = (data: any) => {
    setOk('Login realizado com sucesso.');
    if (data.token) {
      try {
        localStorage.setItem('filtra_token', data.token);
      } catch {
        /* ignore */
      }
    }
    const dest = nextPath();
    if (dest) {
      window.location.href = dest;
      return;
    }
    const empresaId = data.tokenPayload?.empresa_id;
    if (empresaId) window.location.href = `/painel/${empresaId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setOk('');
    try {
      const apiUrl = getEnv('NEXT_PUBLIC_API_URL');
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cnpj: cnpj.replace(/\D/g, ''),
          senha,
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, 'Falha no login'));
      const data = await res.json();
      afterLogin(data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  const handleDigital = async () => {
    setErro('');
    setOk('');
    if (!webauthnSupported()) {
      setErro('Este navegador não suporta login por digital (WebAuthn).');
      return;
    }
    const nums = cnpj.replace(/\D/g, '');
    if (nums.length < 11) {
      setErro('Informe o CNPJ antes de usar a digital.');
      return;
    }
    setLoadingBio(true);
    try {
      const apiUrl = getEnv('NEXT_PUBLIC_API_URL');
      const data = await loginWithPasskey(apiUrl, nums);
      afterLogin(data);
    } catch (err: any) {
      setErro(err.message || 'Falha na biometria');
    } finally {
      setLoadingBio(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-4 font-sans text-zinc-100 gap-10 py-12">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Acesso à empresa</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            CNPJ + senha, ou digital já cadastrada no dispositivo.
          </p>
        </div>

        {erro && (
          <div
            role="alert"
            className="flex items-center gap-3 bg-red-950/50 text-red-300 p-3.5 rounded-xl border border-red-900 text-sm"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}
        {ok && (
          <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-xl px-3 py-2">
            {ok}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-cnpj"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
            >
              <Building2 size={14} /> CNPJ
            </label>
            <input
              id="login-cnpj"
              type="text"
              required
              inputMode="numeric"
              value={cnpj}
              onChange={(e) => aplicarMascaraCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-senha"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
            >
              <Lock size={14} /> Senha
            </label>
            <input
              id="login-senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar com senha'}
          </button>

          <button
            type="button"
            disabled={loadingBio}
            onClick={handleDigital}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-100 font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Fingerprint size={18} />
            {loadingBio ? 'Aguardando digital…' : 'Entrar com digital'}
          </button>

          <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
            A biometria fica só no seu aparelho (WebAuthn). Cadastre a digital após o primeiro login
            por senha (console do navegador ou endpoint de registro autenticado).
          </p>

          <p className="text-center text-xs text-zinc-500 space-x-3">
            <a href="/recuperar-senha" className="underline hover:text-indigo-400">
              Esqueci a senha
            </a>
            <span className="text-zinc-600">|</span>
            <a href="/" className="underline hover:text-indigo-400">
              Ativar 7 dias grátis
            </a>
          </p>
        </form>
      </div>

      <div className="w-full px-2 pb-10">
        <p className="text-center text-sm font-medium text-zinc-400 mb-4">Planos disponíveis</p>
        <PlanCards requireEmpresa={false} />
      </div>
    </div>
  );
}
