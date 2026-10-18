'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { getEnv } from '../../utils/env';

export default function AdminMfaPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [secret, setSecret] = useState('');
  const [otpauth, setOtpauth] = useState('');
  const [code, setCode] = useState('');
  const [backups, setBackups] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState('');

  const api = () => getEnv('NEXT_PUBLIC_API_URL');

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const me = await fetch(`${api()}/api/admin/me`, { credentials: 'include' });
      if (!me.ok) {
        router.push('/admin/login');
        return;
      }
      const st = await fetch(`${api()}/api/admin/mfa/status`, { credentials: 'include' });
      if (!st.ok) throw new Error('Não foi possível ler o status MFA.');
      const data = await st.json();
      setEnabled(!!data.enabled);
    } catch (e: any) {
      setErro(e.message || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const iniciarSetup = async () => {
    setBusy(true);
    setErro('');
    setMsg('');
    setBackups([]);
    try {
      const res = await fetch(`${api()}/api/admin/mfa/setup`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no setup');
      setSecret(data.secret);
      setOtpauth(data.otpauth_url);
      setMsg(data.message || 'Escaneie o QR e confirme o código.');
    } catch (e: any) {
      setErro(e.message || 'Erro');
    } finally {
      setBusy(false);
    }
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErro('');
    try {
      const res = await fetch(`${api()}/api/admin/mfa/confirm`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.replace(/\s/g, '') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Código inválido');
      setBackups(data.backup_codes || []);
      setEnabled(true);
      setSecret('');
      setOtpauth('');
      setCode('');
      setMsg('MFA ativado. Guarde os códigos de backup.');
    } catch (e: any) {
      setErro(e.message || 'Erro');
    } finally {
      setBusy(false);
    }
  };

  const desativar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErro('');
    try {
      const res = await fetch(`${api()}/api/admin/mfa/disable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode.replace(/\s/g, '') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao desativar');
      setEnabled(false);
      setDisableCode('');
      setBackups([]);
      setMsg('MFA desativado.');
    } catch (e: any) {
      setErro(e.message || 'Erro');
    } finally {
      setBusy(false);
    }
  };

  const qrUrl = otpauth
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Autenticação multifator</h1>
              <p className="text-sm text-slate-500">Proteção extra do painel admin</p>
            </div>
          </div>
          <a href="/admin" className="text-sm text-indigo-600 underline">
            Voltar ao painel
          </a>
        </div>

        {erro && (
          <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {erro}
          </div>
        )}
        {msg && (
          <div className="flex gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            {msg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Status:{' '}
            <span className={`font-semibold ${enabled ? 'text-emerald-600' : 'text-amber-600'}`}>
              {enabled ? 'MFA ativo' : 'MFA desativado'}
            </span>
          </p>

          {!enabled && !otpauth && (
            <button
              type="button"
              disabled={busy}
              onClick={iniciarSetup}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'Gerando…' : 'Ativar MFA (TOTP)'}
            </button>
          )}

          {otpauth && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                1. Escaneie o QR no Google Authenticator, Authy ou app similar.
              </p>
              {qrUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="QR MFA"
                  className="mx-auto rounded-lg border border-slate-200"
                  width={200}
                  height={200}
                />
              )}
              <div className="bg-slate-50 rounded-xl p-3 text-xs font-mono break-all text-slate-700">
                <span className="text-slate-400 block mb-1">Secret (manual):</span>
                {secret}
                <button
                  type="button"
                  className="ml-2 inline-flex items-center gap-1 text-indigo-600"
                  onClick={() => navigator.clipboard.writeText(secret)}
                >
                  <Copy size={12} /> copiar
                </button>
              </div>
              <form onSubmit={confirmar} className="space-y-3">
                <p className="text-sm text-slate-600">2. Digite o código de 6 dígitos:</p>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-center font-mono tracking-widest"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {busy ? 'Confirmando…' : 'Confirmar e ativar'}
                </button>
              </form>
            </div>
          )}

          {backups.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-900">Códigos de backup (salve agora)</p>
              <ul className="grid grid-cols-2 gap-1 font-mono text-xs text-amber-950">
                {backups.map((c) => (
                  <li key={c} className="bg-white/70 rounded px-2 py-1">
                    {c}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-800">Cada código vale uma vez se perder o celular.</p>
            </div>
          )}

          {enabled && (
            <form onSubmit={desativar} className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">Desativar MFA (código TOTP ou backup):</p>
              <input
                type="text"
                required
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                placeholder="Código TOTP ou backup"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full border border-red-200 text-red-700 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Desativar MFA
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
