'use client';

import { useState } from 'react';
import { Mail, Lock, AlertCircle, Fingerprint } from 'lucide-react';
import { PlanCards } from '../components/PlanCards';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { BrandMark } from '../components/BrandMark';
import { readApiError } from '../utils/apiError';
import { loginWithPasskey, webauthnSupported } from '../utils/webauthnClient';
import { useLanguage } from '../Contexts/LanguageContext';
import { apiFetch } from '../utils/apiFailover';

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

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function LoginPage() {
  const { t } = useLanguage();
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBio, setLoadingBio] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  const afterLogin = (data: any) => {
    setOk(t.login_success || 'Login realizado com sucesso.');
    if (data.token) {
      try {
        localStorage.setItem('filtra_token', data.token);
      } catch {
        /* ignore */
      }
    }
    const dest = nextPath();
    if (dest) {
      window.location.assign(dest);
      return;
    }
    const empresaId = data.tokenPayload?.empresa_id;
    if (empresaId) window.location.assign(`/painel/${empresaId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErro('');
    setOk('');
    try {
      const id = identificador.trim();
      if (!id) {
        setErro(t.login_id_required || 'Informe o e-mail de acesso.');
        setLoading(false);
        return;
      }
      const body: Record<string, string> = { senha };
      if (isEmail(id)) body.email = id.toLowerCase();
      else body.tax_id = id;

      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
        timeoutMs: 20_000,
      });
      if (!res.ok) throw new Error(await readApiError(res, t.login_fail || 'Falha no login'));
      const data = await res.json();
      afterLogin(data);
    } catch (err: any) {
      setErro(err.message || t.login_error || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  const handleDigital = async () => {
    if (loadingBio) return;
    setErro('');
    setOk('');
    if (!webauthnSupported()) {
      setErro(t.login_bio_unsupported || 'Este navegador não suporta login por digital (WebAuthn).');
      return;
    }
    const id = identificador.trim();
    if (isEmail(id)) {
      setErro(
        t.login_bio_use_tax ||
          'Para biometria, use o Tax ID / CNPJ cadastrado (não o e-mail).'
      );
      return;
    }
    const tax = id.replace(/[^A-Za-z0-9]/g, '');
    if (tax.length < 5) {
      setErro(t.login_bio_need_tax || 'Informe o Tax ID ou CNPJ antes de usar a digital.');
      return;
    }
    setLoadingBio(true);
    try {
      const { getApiBase } = await import('../utils/apiFailover');
      const data = await loginWithPasskey(getApiBase(), tax);
      afterLogin(data);
    } catch (err: any) {
      setErro(err.message || t.login_bio_fail || 'Falha na biometria');
    } finally {
      setLoadingBio(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-4 font-sans text-zinc-100 gap-8 py-10">
      <header className="w-full max-w-md flex items-center justify-end">
        <LanguageSwitcher compact />
      </header>

      <div className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center pt-1">
            <BrandMark size="lg" href="/" centered subtitle="Online Reputation" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            {t.login_title || t.login || 'Login'}
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {t.login_subtitle || 'Entrar com e-mail e senha.'}
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
              htmlFor="login-id"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
            >
              <Mail size={14} /> {t.login_id_label || 'E-mail'}
            </label>
            <input
              id="login-id"
              type="text"
              inputMode="email"
              required
              autoComplete="username"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder={t.login_id_placeholder || 'seu@email.com'}
              className={inputCls}
            />
            <p className="text-[11px] text-zinc-500">
              {t.login_id_hint ||
                'Use o e-mail do trial. Se preferir, pode entrar com CNPJ ou Tax ID cadastrado.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-senha"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
            >
              <Lock size={14} /> {t.login_password || t.label_password || 'Senha'}
            </label>
            <input
              id="login-senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-medium py-3 rounded-xl transition-all text-sm disabled:opacity-50"
          >
            {loading
              ? t.login_submitting || 'Entrando…'
              : t.login_submit || 'Entrar com senha'}
          </button>

          <button
            type="button"
            disabled={loadingBio}
            onClick={handleDigital}
            className="w-full bg-zinc-800 hover:bg-zinc-700 active:scale-[0.99] border border-zinc-600 text-zinc-100 font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <Fingerprint size={18} />
            {loadingBio
              ? t.login_bio_waiting || 'Aguardando digital…'
              : t.login_bio || 'Entrar com digital'}
          </button>

          <p className="text-center text-xs text-zinc-500 space-x-3">
            <a href="/recuperar-senha" className="underline hover:text-indigo-400">
              {t.login_forgot || t.forgot_password || 'Esqueci a senha'}
            </a>
            <span className="text-zinc-600">|</span>
            <a href="/" className="underline hover:text-indigo-400">
              {t.login_trial || t.trial_cta || 'Ativar 7 dias grátis'}
            </a>
          </p>
        </form>
      </div>

      <div className="w-full px-2 pb-10">
        <p className="text-center text-sm font-medium text-zinc-400 mb-4">
          {t.login_plans || t.plans || 'Planos disponíveis'}
        </p>
        <PlanCards requireEmpresa={false} />
      </div>
    </div>
  );
}
