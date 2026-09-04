'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Mail, KeyRound, AlertCircle, Loader2, Shield } from 'lucide-react';

function AdminRecuperarForm() {
  const search = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = search.get('token') || '';

  const [modo, setModo] = useState<'pedir' | 'redefinir'>(tokenFromUrl ? 'redefinir' : 'pedir');
  const [email, setEmail] = useState('');
  const [chave, setChave] = useState('');
  const [token, setToken] = useState(tokenFromUrl);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState('');

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setModo('redefinir');
    }
  }, [tokenFromUrl]);

  const api = () => process.env.NEXT_PUBLIC_API_URL;

  const pedirLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setMsg('');
    setDevLink('');
    try {
      const res = await fetch(`${api()}/api/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          recovery_secret: chave,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na solicitação');
      setMsg(data.message || 'Se os dados estiverem corretos, enviaremos o link.');
      if (data.dev_link) setDevLink(data.dev_link);
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
    if (novaSenha !== confirma) {
      setErro('As senhas não coincidem.');
      setLoading(false);
      return;
    }
    if (novaSenha.length < 10) {
      setErro('A senha deve ter pelo menos 10 caracteres.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${api()}/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nova_senha: novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao redefinir');
      setMsg(data.message || 'Senha atualizada.');
      setTimeout(() => router.push('/admin/login'), 2000);
    } catch (err: any) {
      setErro(err.message || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-5 text-slate-800">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-700 mb-1">
            <Shield size={22} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Recuperação do admin</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {modo === 'pedir'
              ? 'Área restrita ao dono do SaaS. É necessário o e-mail do admin e a chave de recuperação do servidor.'
              : 'Defina uma nova senha forte (mín. 10 caracteres, com número).'}
          </p>
        </div>

        {erro && (
          <div
            role="alert"
            className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-sm"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
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

        {modo === 'pedir' ? (
          <form onSubmit={pedirLink} className="space-y-4">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="email"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="off"
              />
              <p className="text-[11px] text-slate-400 leading-snug">
                Valor de <code className="bg-slate-100 px-1 rounded">ADMIN_RECOVERY_SECRET</code> no
                servidor — não é a senha de login.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Validando…' : 'Enviar link seguro'}
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
          <form onSubmit={redefinir} className="space-y-4">
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
                autoComplete="new-password"
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
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Salvando…' : 'Salvar nova senha do admin'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400">
          <a href="/admin/login" className="underline hover:text-indigo-600">
            Voltar ao login admin
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AdminRecuperarSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
          Carregando…
        </div>
      }
    >
      <AdminRecuperarForm />
    </Suspense>
  );
}
