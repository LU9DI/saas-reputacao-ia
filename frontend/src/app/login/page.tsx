'use client';

import { useState } from 'react';
import { Building2, Lock, AlertCircle } from 'lucide-react';
import { getEnv } from '../utils/env';
import { PlanCards } from '../components/PlanCards';

export default function LoginPage() {
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  const aplicarMascaraCnpj = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '').substring(0, 14);
    let mascarado = apenasNumeros;
    if (mascarado.length > 2) mascarado = `${mascarado.substring(0, 2)}.${mascarado.substring(2)}`;
    if (mascarado.length > 6) mascarado = `${mascarado.substring(0, 6)}.${mascarado.substring(6)}`;
    if (mascarado.length > 10) mascarado = `${mascarado.substring(0, 10)}/${mascarado.substring(10)}`;
    if (mascarado.length > 15) mascarado = `${mascarado.substring(0, 15)}-${mascarado.substring(15)}`;
    setCnpj(mascarado);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no login');
      setOk('Login realizado com sucesso.');
      const empresaId = data.tokenPayload?.empresa_id;
      if (empresaId) {
        window.location.href = `/painel/${empresaId}`;
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 font-sans text-slate-800 gap-10 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acesso à empresa</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Informe o CNPJ e a senha cadastrados para acessar o painel. Caso ainda não possua
            conta, ative o período de testes na página inicial.
          </p>
        </div>

        {erro && (
          <div
            role="alert"
            className="flex items-center gap-3 bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 text-sm"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}
        {ok && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            {ok}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-cnpj"
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-senha"
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
            >
              <Lock size={14} /> Senha
            </label>
            <input
              id="login-senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors text-sm shadow-md shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="text-center text-xs text-slate-500 space-x-3">
            <a href="/recuperar-senha" className="underline hover:text-indigo-600">
              Esqueci a senha
            </a>
            <span className="text-slate-300">|</span>
            <a href="/" className="underline hover:text-indigo-600">
              Ativar 7 dias grátis
            </a>
          </p>
        </form>
      </div>

      {/* Planos + texto "Como funciona" abaixo */}
      <div className="w-full px-2 pb-10">
        <p className="text-center text-sm font-medium text-slate-600 mb-4">
          Planos disponíveis para assinatura
        </p>
        <PlanCards requireEmpresa={false} />
      </div>
    </div>
  );
}
