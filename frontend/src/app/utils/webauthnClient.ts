/** Helpers WebAuthn no browser (digital / Face ID / Windows Hello). */
import { apiFetch } from './apiFailover';

function bufferToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBuffer(s: string): ArrayBuffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function webauthnSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

/** Extrai SPKI da chave pública do credential (para o servidor). */
async function exportPublicKeySpki(cred: PublicKeyCredential): Promise<string> {
  const response = cred.response as AuthenticatorAttestationResponse;
  // getPublicKey() (Chrome 118+)
  const anyResp = response as any;
  if (typeof anyResp.getPublicKey === 'function') {
    const spki: ArrayBuffer | null = anyResp.getPublicKey();
    if (spki) return bufferToB64url(spki);
  }
  throw new Error(
    'Navegador não exportou a chave pública. Use Chrome/Edge/Safari recentes em HTTPS ou localhost.'
  );
}

export async function registerPasskey(apiUrl: string, token: string) {
  const optRes = await apiFetch('/api/webauthn/register/options', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: '{}',
  });
  const opt = await optRes.json();
  if (!optRes.ok) throw new Error(opt.error || 'Falha ao iniciar registro da digital');

  const pk = opt.publicKey;
  const publicKey: PublicKeyCredentialCreationOptions = {
    ...pk,
    challenge: b64urlToBuffer(pk.challenge),
    user: {
      ...pk.user,
      id: b64urlToBuffer(pk.user.id),
    },
    excludeCredentials: (pk.excludeCredentials || []).map((c: any) => ({
      ...c,
      id: b64urlToBuffer(c.id),
    })),
  };

  const cred = (await navigator.credentials.create({
    publicKey,
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Registro cancelado.');

  const attestation = cred.response as AuthenticatorAttestationResponse;
  const publicKeySpki = await exportPublicKeySpki(cred);

  const verifyRes = await apiFetch('/api/webauthn/register/verify', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      challengeId: opt.challengeId,
      credentialId: bufferToB64url(cred.rawId),
      publicKey: publicKeySpki,
      clientDataJSON: bufferToB64url(attestation.clientDataJSON),
      deviceName: navigator.userAgent.slice(0, 80),
      transports: (attestation as any).getTransports?.() || ['internal'],
    }),
  });
  const data = await verifyRes.json();
  if (!verifyRes.ok) throw new Error(data.error || 'Falha ao salvar digital');
  return data;
}

export async function loginWithPasskey(apiUrl: string, cnpj: string) {
  const optRes = await apiFetch('/api/webauthn/login/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cnpj }),
  });
  const opt = await optRes.json();
  if (!optRes.ok) throw new Error(opt.error || 'Falha ao iniciar login digital');

  const pk = opt.publicKey;
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: b64urlToBuffer(pk.challenge),
    timeout: pk.timeout,
    rpId: pk.rpId,
    userVerification: pk.userVerification,
    allowCredentials: (pk.allowCredentials || []).map((c: any) => ({
      type: 'public-key' as const,
      id: b64urlToBuffer(c.id),
      transports: c.transports,
    })),
  };

  const cred = (await navigator.credentials.get({
    publicKey,
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Autenticação cancelada.');

  const assertion = cred.response as AuthenticatorAssertionResponse;
  const verifyRes = await apiFetch('/api/webauthn/login/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId: opt.challengeId,
      credentialId: bufferToB64url(cred.rawId),
      clientDataJSON: bufferToB64url(assertion.clientDataJSON),
      authenticatorData: bufferToB64url(assertion.authenticatorData),
      signature: bufferToB64url(assertion.signature),
    }),
  });
  const data = await verifyRes.json();
  if (!verifyRes.ok) throw new Error(data.error || 'Digital rejeitada');
  return data;
}
