'use client'; 

<<<<<<< Updated upstream
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2, Shield, KeyRound } from 'lucide-react';

type Step = 'senha' | 'mfa' | 'recuperar' | 'redefinir';

const TOKEN_KEY = 'admin_saas_token';

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
}

function AdminLoginForm() {
=======
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
>>>>>>> Stashed changes
  const router = useRouter();
  const search = useSearchParams();
  const tokenFromUrl = search.get('token') || '';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
<<<<<<< Updated upstream
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
  const [devLink, setDevLink] = useState('');

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
    // hard navigation evita ficar preso se o cookie cross-origin falhar
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
=======
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
>>>>>>> Stashed changes

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
<<<<<<< Updated upstream
    setMsg('');

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
        if (data.dev_link) setDevLink(data.dev_link);
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
        setErro(`Tempo esgotado. Confira se a API está rodando em ${apiBase()}.`);
      } else if (String(err.message || '').includes('Failed to fetch')) {
        setErro(`Não conectou na API (${apiBase()}). Suba o backend e confira NEXT_PUBLIC_API_URL.`);
      } else {
        setErro(err.message || 'Erro no login');
      }
=======
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar login');
      }

      router.push('/admin/dashboard'); 
      
    } catch (err: any) {
      setErro(err.message);
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

  const voltarLogin = () => {
    setStep('senha');
    setErro('');
    setMsg('');
    setDevLink('');
    setMfaToken('');
    setMfaCode('');
    setChave('');
  };

  return (
<<<<<<< Updated upstream
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
        {devLink && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 break-all">
            Dev (SMTP off):{' '}
            <a href={devLink} className="underline font-medium">
              abrir link de redefinição
            </a>
          </p>
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
                placeholder="000 000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50 tracking-widest text-center font-mono text-lg"
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
                  placeholder="admin@seusaas.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
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
                  placeholder="ADMIN_RECOVERY_SECRET do .env"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono bg-slate-50/50"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
                />
              </div>
            </>
          )}
=======
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Acesso Administrativo
          </h2>
          <p className="mt-2 text-sm text-gray-600">FILTRA.AI</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="admin@filtra.ai"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {erro && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {erro}
            </div>
          )}
>>>>>>> Stashed changes

          <button
            type="submit"
            disabled={loading}
<<<<<<< Updated upstream
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
=======
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar'}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
}

export default function AdminLogin() {
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
=======
}
>>>>>>> Stashed changes
