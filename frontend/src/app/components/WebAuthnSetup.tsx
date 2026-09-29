'use client';

import { useState } from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { getEnv } from '../utils/env';
import { apiFetch } from '../utils/apiFailover';

function authHeaders(json = true): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  try {
    const t = localStorage.getItem('filtra_token');
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* */
  }
  return h;
}

function b64urlToBuffer(s: string): ArrayBuffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function bufferToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function extractPublicKeyB64(credential: PublicKeyCredential): Promise<string> {
  const response = credential.response as AuthenticatorAttestationResponse;
  if (typeof (response as any).getPublicKey === 'function') {
    const spki = (response as any).getPublicKey() as ArrayBuffer;
    if (spki) return bufferToB64url(spki);
  }
  throw new Error(
    'Seu navegador não expôs a chave pública. Use Chrome/Edge atualizado ou HTTPS.'
  );
}

export function WebAuthnSetup() {
  const { t } = useLanguage();
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const api = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');

  const supported =
    typeof window === 'undefined' ? true : Boolean(window.PublicKeyCredential);

  if (!supported) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
        <p className="text-sm font-medium text-zinc-100">{t.webauthn_title}</p>
        <p className="text-xs text-zinc-500 mt-1">
          {t.webauthn_unsupported}
        </p>
      </section>
    );
  }

  const registrar = async () => {
    setLoading(true);
    setMsg('');
    try {
      const optRes = await apiFetch(`/api/webauthn/register/options`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const opt = await optRes.json().catch(() => ({}));
      if (optRes.status === 401) {
        throw new Error(t.webauthn_login_again);
      }
      if (!optRes.ok) throw new Error(opt.error || t.webauthn_start_error);

      const publicKey = { ...opt.publicKey };
      publicKey.challenge = b64urlToBuffer(publicKey.challenge);
      publicKey.user = {
        ...publicKey.user,
        id: b64urlToBuffer(publicKey.user.id),
      };
      if (publicKey.excludeCredentials) {
        publicKey.excludeCredentials = publicKey.excludeCredentials.map((c: any) => ({
          ...c,
          id: b64urlToBuffer(c.id),
        }));
      }

      const cred = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential | null;
      if (!cred) throw new Error(t.webauthn_cancelled);

      const rawId = bufferToB64url(cred.rawId);
      const att = cred.response as AuthenticatorAttestationResponse;
      const publicKeyB64 = await extractPublicKeyB64(cred);

      const finish = await apiFetch(`/api/webauthn/register/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({
          challengeId: opt.challengeId,
          credentialId: rawId,
          publicKey: publicKeyB64,
          clientDataJSON: bufferToB64url(att.clientDataJSON),
          deviceName: navigator.userAgent.slice(0, 80),
          transports: (att as any).getTransports?.() || ['internal'],
        }),
      });
      const data = await finish.json().catch(() => ({}));
      if (!finish.ok) throw new Error(data.error || t.webauthn_save_error);
      setMsg(t.webauthn_success);
    } catch (e: any) {
      setMsg(e.message || t.webauthn_error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-100">Login por digital / Face ID</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {t.webauthn_desc}
        </p>
        {msg && (
          <p
            className={`text-xs mt-1 ${
              msg === t.webauthn_success ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {msg}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={registrar}
        className="text-sm px-4 py-2 rounded-xl bg-zinc-100 text-zinc-900 font-medium hover:bg-white disabled:opacity-50"
      >
        {loading ? t.webauthn_wait : t.webauthn_register}
      </button>
    </section>
  );
}
