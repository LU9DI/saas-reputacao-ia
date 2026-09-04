'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2, Shield } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [step, setStep] = useState<'senha' | 'mfa'>('senha');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const api = () => process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      if (step === 'senha') {
        const response = await fetch(`${api()}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, senha }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Credenciais inválidas.');

        if (data.mfa_required && data.mfa_token) {
          setMfaToken(data.mfa_token);
          setStep('mfa');
          setLoading(false);
          return;
        }

        localStorage.removeItem('token_saas_reputacao');
        router.push('/admin');
        return;
      }

      const response = await fetch(`${api()}/api/admin/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mfa_token: mfaToken, code: mfaCode.replace(/\s/g, '') }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Código inválido.');

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
          <p className="text-sm text-slate-500">
            {step === 'senha'
              ? 'Acesso restrito ao dono do SaaS'
              : 'Segundo fator — código do autenticador'}
          </p>
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
          {step === 'senha' ? (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
                >
                  <Mail size={14} /> E-mail
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="senha"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
                >
                  <Lock size={14} /> Senha
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor="mfa"
                className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
              >
                <Shield size={14} /> Código de 6 dígitos
              </label>
              <input
                id="mfa"
                type="text"
                inputMode="numeric"
                maxLength={8}
                required
                autoFocus
                value={mfaCode}
                onChange={(e) => {
                  setMfaCode(e.target.value);
                  setErro('');
                }}
                placeholder="000 000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50 tracking-widest text-center font-mono text-lg"
              />
              <p className="text-[11px] text-slate-400">
                Google Authenticator / Authy, ou um código de backup.
              </p>
              <button
                type="button"
                className="text-xs text-slate-500 underline"
                onClick={() => {
                  setStep('senha');
                  setMfaToken('');
                  setMfaCode('');
                  setErro('');
                }}
              >
                Voltar
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors text-sm shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Validando…' : step === 'senha' ? 'Continuar' : 'Verificar e entrar'}
          </button>

          {step === 'senha' && (
            <p className="text-center text-xs text-slate-500 space-x-2">
              <a href="/admin/recuperar-senha" className="underline hover:text-indigo-600">
                Esqueci a senha
              </a>
              <span className="text-slate-300">·</span>
              <a href="/admin/mfa" className="underline hover:text-indigo-600">
                Configurar MFA
              </a>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
