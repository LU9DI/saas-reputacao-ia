'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../utils/apiFailover';
import { validarSenhaEmpresa, SENHA_EMPRESA_HINT } from '../utils/passwordPolicy';
import { BrandMark } from '../components/BrandMark';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLanguage } from '../Contexts/LanguageContext';

const inputClass =
  'mt-1.5 w-full px-4 py-3 rounded-xl border border-zinc-600 bg-zinc-950 text-zinc-100 text-base placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

function RecuperarForm() {
  const { t } = useLanguage();
  const search = useSearchParams();
  const tokenFromUrl = search.get('token') || '';

  const [modo, setModo] = useState<'pedir' | 'redefinir'>(tokenFromUrl ? 'redefinir' : 'pedir');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenFromUrl);
  const [novaSenha, setNovaSenha] = useState('');
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [avisoSmtp, setAvisoSmtp] = useState('');
  const [loading, setLoading] = useState(false);

  // `modo` e `token` já nascem do parâmetro da URL (linhas acima) — sem efeito de sincronização.

  const pedirLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setMsg('');
    setAvisoSmtp('');
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setErro(t.recovery_email_invalid || 'Informe um e-mail válido.');
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch(`/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.recovery_fail || 'Falha na solicitação');
      setMsg(
        data.message ||
          t.recovery_default_msg ||
          'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.'
      );
      if (data.smtp === false) {
        setAvisoSmtp(
          t.recovery_smtp_missing ||
            'O servidor ainda não tem SMTP completo. Defina SMTP_HOST, SMTP_USER, SMTP_PASS e SMTP_FROM no Render e faça redeploy.'
        );
      } else if (data.delivered === false) {
        setAvisoSmtp(
          t.recovery_smtp_fail ||
            'O servidor tentou enviar, mas o SMTP recusou. Veja os logs do Render.'
        );
      }
    } catch (err: any) {
      setErro(err.message || t.recovery_error || 'Erro');
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
      const res = await apiFetch(`/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nova_senha: novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.recovery_reset_fail || 'Falha ao redefinir');
      setMsg(data.message || t.recovery_reset_ok || 'Senha atualizada. Você já pode entrar.');
    } catch (err: any) {
      setErro(err.message || t.recovery_error || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 gap-4">
      <div className="w-full max-w-md flex justify-end">
        <LanguageSwitcher compact />
      </div>
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-8 space-y-5">
        <div className="flex justify-center">
          <BrandMark href="/" size="sm" centered subtitle="Online Reputation" />
        </div>
        <h1 className="text-xl font-bold text-zinc-50 text-center">
          {t.recovery_title || 'Recuperação de senha'}
        </h1>
        <p className="text-sm text-zinc-400 text-center">
          {modo === 'pedir'
            ? t.recovery_subtitle_request ||
              'Use o mesmo e-mail do cadastro da empresa. Link válido por 1 hora.'
            : t.recovery_subtitle_reset ||
              'Defina uma nova senha forte para a conta da empresa.'}
        </p>

        {erro && (
          <p className="text-sm text-red-300 bg-red-950/50 border border-red-900 rounded-xl px-3 py-2">
            {erro}
          </p>
        )}
        {msg && (
          <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-900 rounded-xl px-3 py-2">
            {msg}
          </p>
        )}
        {avisoSmtp && (
          <p className="text-sm text-amber-200 bg-amber-950/40 border border-amber-800 rounded-xl px-3 py-2">
            {avisoSmtp}
          </p>
        )}

        {modo === 'pedir' ? (
          <form onSubmit={pedirLink} className="space-y-4">
            <div>
              <label htmlFor="email-recup" className="block text-sm font-medium text-zinc-300">
                {t.recovery_email_label || 'E-mail da empresa'}
              </label>
              <input
                id="email-recup"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder={t.recovery_email_placeholder || t.ph_email || 'seu@email.com'}
                autoComplete="email"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {loading
                ? t.recovery_sending || 'Enviando…'
                : t.recovery_send_link || 'Enviar link por e-mail'}
            </button>
            <button
              type="button"
              className="w-full text-sm text-zinc-400 hover:text-zinc-200 underline"
              onClick={() => setModo('redefinir')}
            >
              {t.recovery_have_token || 'Já tenho o link / token do e-mail'}
            </button>
          </form>
        ) : (
          <form onSubmit={redefinir} className="space-y-4">
            <div>
              <label htmlFor="token-recup" className="block text-sm font-medium text-zinc-300">
                {t.recovery_token_label || 'Token (do e-mail)'}
              </label>
              <input
                id="token-recup"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={`${inputClass} font-mono text-sm`}
                required
                placeholder={
                  t.recovery_token_placeholder || 'Cole o token se não abriu pelo link'
                }
              />
            </div>
            <div>
              <label htmlFor="nova-senha" className="block text-sm font-medium text-zinc-300">
                {t.recovery_new_password || 'Nova senha'}
              </label>
              <input
                id="nova-senha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength={8}
                className={inputClass}
                required
                autoComplete="new-password"
              />
              <p className="mt-1.5 text-xs text-zinc-500">{SENHA_EMPRESA_HINT}</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-100 hover:bg-white text-zinc-900 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {loading
                ? t.recovery_saving || 'Salvando…'
                : t.recovery_save || 'Salvar nova senha'}
            </button>
            <button
              type="button"
              className="w-full text-sm text-zinc-400 hover:text-zinc-200 underline"
              onClick={() => setModo('pedir')}
            >
              {t.recovery_request_again || 'Pedir novo link por e-mail'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-zinc-500">
          <Link href="/login" className="underline hover:text-zinc-300">
            {t.recovery_back_login || 'Voltar ao login'}
          </Link>
          {' · '}
          <Link href="/" className="underline hover:text-zinc-300">
            {t.recovery_home || 'Início'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-sm text-zinc-500">
          …
        </div>
      }
    >
      <RecuperarForm />
    </Suspense>
  );
}
