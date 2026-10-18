'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2, Shield, KeyRound } from 'lucide-react';
import { getEnv } from '../../utils/env';

type Step = 'senha' | 'mfa' | 'recuperar' | 'redefinir';

const TOKEN_KEY = 'admin_saas_token';

function apiBase() {
  return getEnv('NEXT_PUBLIC_API_URL').replace(/\/$/, '');
}

function AdminLoginForm() {
  const search = useSearchParams();
  const tokenFromUrl = search.get('token') || '';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [chave, setChave] = useState('');
  const [token, setToken] = useState(tokenFromUrl);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [step, setStep] = useState<Step>(tokenFromUrl ? 'redefinir' : 'senha');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [recoveryLink, setRecoveryLink] = useState('');

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStep('redefinir');
    }
  }, [tokenFromUrl]);

  const entrarNoPainel = (jwt?: string) => {
    if (jwt) {
      try {
        localStorage.setItem(TOKEN_KEY, jwt);
      } catch {
        /* private mode */
      }
    }
    localStorage.removeItem('token_saas_reputacao');
    window.location.assign('/admin');
  };

  const titulo =
    step === 'mfa'
      ? 'Segundo fator — código do autenticador'
      : step === 'recuperar'
        ? 'Recuperar senha do admin'
        : step === 'redefinir'
          ? 'Definir nova senha'
          : 'Acesso restrito ao dono do SaaS';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMsg('');
    setRecoveryLink('');
    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const base = apiBase();

    try {
      if (step === 'senha') {
        const response = await fetch(`${base}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        let data: any = {};
        try {
          data = await response.json();
        } catch {
          throw new Error(`Resposta inválida do servidor (${response.status}). A API está em ${base}?`);
        }

        if (!response.ok) {
          throw new Error(data.error || `Falha no login (${response.status}).`);
        }

        if (data.mfa_required && data.mfa_token) {
          setMfaToken(data.mfa_token);
          setStep('mfa');
          setLoading(false);
          return;
        }

        entrarNoPainel(data.token);
        return;
      }

      if (step === 'mfa') {
        const response = await fetch(`${base}/api/admin/mfa/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ mfa_token: mfaToken, code: mfaCode.replace(/\s/g, '') }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Código inválido.');
        entrarNoPainel(data.token);
        return;
      }

      if (step === 'recuperar') {
        const res = await fetch(`${base}/api/admin/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            recovery_secret: chave,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha na solicitação');
        setMsg(data.message || 'Se os dados estiverem corretos, enviaremos o link.');
        const link = data.recovery_link || data.dev_link || '';
        if (link) {
          setRecoveryLink(link);
          if (data.token) setToken(data.token);
        }
        return;
      }

      if (step === 'redefinir') {
        if (novaSenha !== confirma) throw new Error('As senhas não coincidem.');
        if (novaSenha.length < 10) throw new Error('A senha deve ter pelo menos 10 caracteres.');
        const res = await fetch(`${base}/api/admin/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, nova_senha: novaSenha }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao redefinir');
        setMsg(data.message || 'Senha atualizada. Faça o login.');
        setTimeout(() => {
          setStep('senha');
          setMsg('');
          setNovaSenha('');
          setConfirma('');
          setToken('');
        }, 1500);
        return;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErro(`Tempo esgotado. Confira se a API está rodando em ${base}.`);
      } else if (String(err.message || '').includes('Failed to fetch')) {
        setErro(`Não conectou na API (${base}). Suba o backend e confira NEXT_PUBLIC_API_URL.`);
      } else {
        setErro(err.message || 'Erro no login');
      }
    } finally {
      setLoading(false);
    }
  };

  const voltarLogin = () => {
    setStep('senha');
    setErro('');
    setMsg('');
    setRecoveryLink('');
    setMfaToken('');
    setMfaCode('');
    setChave('');
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50 text-slate-900';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 text-slate-800">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel Administrativo</h1>
          <p className="text-sm text-slate-500">{titulo}</p>
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
        {msg && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            {msg}
          </p>
        )}
        {recoveryLink && (
          <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 space-y-2">
            <p className="font-medium">Link de redefinição (e-mail não saiu):</p>
            <a
              href={recoveryLink}
              className="block underline break-all text-indigo-700 font-medium"
              onClick={() => {
                setStep('redefinir');
              }}
            >
              {recoveryLink}
            </a>
            <button
              type="button"
              className="text-xs underline text-slate-600"
              onClick={() => setStep('redefinir')}
            >
              Já tenho o token — definir nova senha
            </button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {step === 'senha' && (
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
                  placeholder=""
                  className={inputCls}
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
                  placeholder=""
                  className={inputCls}
                />
              </div>
            </>
          )}

          {step === 'mfa' && (
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
                placeholder=""
                className={`${inputCls} tracking-widest text-center font-mono text-lg`}
              />
            </div>
          )}

          {step === 'recuperar' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Mail size={14} /> E-mail do admin
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <KeyRound size={14} /> Chave de recuperação
                </label>
                <input
                  type="password"
                  required
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                  placeholder=""
                  className={inputCls}
                  autoComplete="off"
                />
              </div>
            </>
          )}

          {step === 'redefinir' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder=""
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Lock size={14} /> Nova senha
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder=""
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Confirmar senha</label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  placeholder=""
                  className={inputCls}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading
              ? 'Aguarde…'
              : step === 'senha'
                ? 'Entrar'
                : step === 'mfa'
                  ? 'Verificar e entrar'
                  : step === 'recuperar'
                    ? 'Enviar link seguro'
                    : 'Salvar nova senha'}
          </button>

          {step === 'senha' && (
            <p className="text-center text-xs text-slate-500">
              <button
                type="button"
                className="underline hover:text-indigo-600"
                onClick={() => {
                  setStep('recuperar');
                  setErro('');
                  setMsg('');
                }}
              >
                Esqueci a senha
              </button>
            </p>
          )}

          {step !== 'senha' && (
            <p className="text-center text-xs text-slate-500">
              <button type="button" className="underline hover:text-indigo-600" onClick={voltarLogin}>
                Voltar ao login
              </button>
            </p>
          )}
        </form>

        <p className="text-[10px] text-center text-slate-400">API: {apiBase()}</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
          Carregando…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
