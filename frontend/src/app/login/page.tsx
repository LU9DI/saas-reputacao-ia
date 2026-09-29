'use client';

import { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { PlanCards } from '../components/PlanCards';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { BrandMark } from '../components/BrandMark';
import { readApiError } from '../utils/apiError';
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
      if (!isEmail(id)) {
        setErro(t.login_id_invalid || 'Informe um e-mail válido.');
        setLoading(false);
        return;
      }
      const body: Record<string, string> = { email: id.toLowerCase(), senha };

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

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
          <section className="hidden border-r border-white/10 bg-gradient-to-br from-indigo-500/15 via-transparent to-transparent p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <BrandMark size="sm" href="/" subtitle="Online Reputation" />
              <p className="mt-16 text-xs font-semibold uppercase tracking-[.22em] text-indigo-400">Filtra.AI</p>
              <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight text-white">
                {t.login_title || 'Sua reputação trabalhando por você.'}
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-zinc-400">
                {t.login_subtitle || 'Acompanhe avaliações, sinais e oportunidades em um só lugar.'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-lg font-semibold text-white">24/7</div>
                <div className="mt-1 text-xs text-zinc-500">Monitoramento</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-lg font-semibold text-white">IA</div>
                <div className="mt-1 text-xs text-zinc-500">Insights acionáveis</div>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mb-8 flex items-center justify-between gap-3">
              <BrandMark size="sm" href="/" subtitle="Online Reputation" />
              <LanguageSwitcher compact />
            </div>

            <div className="mx-auto max-w-md">
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-400">Acesso</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {t.login || t.login_title || 'Entrar'}
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {t.login_subtitle || 'Entrar com e-mail e senha.'}
                </p>
              </div>

              {erro && (
                <div role="alert" className="mb-4 flex items-center gap-3 rounded-xl border border-red-900/70 bg-red-950/40 p-3.5 text-sm text-red-300">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{erro}</span>
                </div>
              )}
              {ok && (
                <p className="mb-4 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">{ok}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="login-id" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <Mail size={14} /> {t.login_id_label || 'E-mail'}
                  </label>
                  <input
                    id="login-id"
                    type="email"
                    inputMode="email"
                    required
                    autoComplete="username"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder={t.login_id_placeholder || 'seu@email.com'}
                    className={inputCls.replace('bg-zinc-950', 'bg-white/[0.03]').replace('border-zinc-700', 'border-white/10')}
                  />
                  <p className="text-[11px] text-zinc-600">{t.login_id_hint || 'Use o e-mail cadastrado no trial.'}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-senha" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <Lock size={14} /> {t.login_password || t.label_password || 'Senha'}
                  </label>
                  <input
                    id="login-senha"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={inputCls.replace('bg-zinc-950', 'bg-white/[0.03]').replace('border-zinc-700', 'border-white/10')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (t.login_loading || 'Entrando…') : (t.login_submit || 'Entrar')}
                </button>
              </form>

              <div className="mt-7 flex flex-col gap-3 text-center text-sm">
                <a href="/preview/teste" className="font-medium text-indigo-300 hover:text-indigo-200">
                  {t.trial_cta || 'Começar 7 dias grátis'}
                </a>
                <a href="/preview" className="text-zinc-500 hover:text-zinc-300">
                  {t.login_back || 'Voltar para o Filtra.AI'}
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
