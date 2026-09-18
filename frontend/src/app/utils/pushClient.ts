/** Cliente Web Push no browser. */
import { apiFetch } from './apiFailover';

function cleanVapidKey(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '');
}

/** Converte VAPID public key (URL-safe base64) em ArrayBuffer isolado (Chrome exige isso). */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const cleaned = cleanVapidKey(base64String);
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
  const base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  // slice cria ArrayBuffer "limpo" — evita "Registration failed - push service error"
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker não suportado neste navegador.');
  }

  // registra de forma explícita no scope raiz
  let reg = await navigator.serviceWorker.getRegistration('/');
  if (!reg) {
    reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }

  // espera controller/active
  if (reg.installing) {
    await new Promise<void>((resolve) => {
      const sw = reg!.installing!;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated' || sw.state === 'installed') resolve();
      });
      setTimeout(() => resolve(), 5000);
    });
  }

  reg = await navigator.serviceWorker.ready;

  // se a página ainda não está controlada, tenta claim via reload suave não forçado
  if (!navigator.serviceWorker.controller && reg.active) {
    // ok em primeiro load; subscribe ainda funciona com registration.ready
  }

  return reg;
}

function authHeaders(token: string): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function mapPushError(e: any): string {
  const msg = String(e?.message || e || '');
  if (/push service error|Registration failed/i.test(msg)) {
    return (
      'Falha no serviço de push do navegador. ' +
      'Tente: 1) recarregar a página 2) permitir notificações 3) em Chrome: ' +
      'configurações do site → redefinir permissões. ' +
      'Se mudou a chave VAPID no servidor, limpamos a subscription antiga automaticamente — clique Ativar de novo.'
    );
  }
  if (/permission/i.test(msg)) {
    return 'Permissão de notificação negada ou bloqueada.';
  }
  return msg || 'Falha ao criar subscription push.';
}

async function subscribeWithKey(
  reg: ServiceWorkerRegistration,
  publicKey: string
): Promise<PushSubscription> {
  const applicationServerKey = urlBase64ToArrayBuffer(publicKey);

  // Se já existe sub com outra chave VAPID, Chrome costuma falhar — remove e recria
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    try {
      await existing.unsubscribe();
    } catch {
      /* ignore */
    }
  }

  try {
    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  } catch (e1: any) {
    // retry uma vez após unsubscribe agressivo
    try {
      const again = await reg.pushManager.getSubscription();
      if (again) await again.unsubscribe();
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 400));
    try {
      return await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch (e2: any) {
      throw new Error(mapPushError(e2?.message ? e2 : e1));
    }
  }
}

export async function enablePush(
  apiUrl: string,
  token: string
): Promise<{ ok: boolean; error?: string; already?: boolean }> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Ambiente inválido.' };
  }
  if (!('PushManager' in window) || !('serviceWorker' in navigator)) {
    return {
      ok: false,
      error:
        'Push não suportado. Use Chrome/Edge no PC ou Android. No iPhone: Adicionar à Tela de Início (PWA).',
    };
  }
  if (!window.isSecureContext && location.hostname !== 'localhost') {
    return { ok: false, error: 'Push exige HTTPS (ou localhost).' };
  }

  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }
  if (perm !== 'granted') {
    return {
      ok: false,
      error:
        perm === 'denied'
          ? 'Notificações bloqueadas no navegador. Libere em configurações do site e tente de novo.'
          : 'Permissão de notificação não concedida.',
    };
  }

  const keyRes = await apiFetch('/api/push/vapid-public-key', {
    credentials: 'include',
  });
  const keyJson = await keyRes.json().catch(() => ({}));
  if (!keyRes.ok || !keyJson.publicKey) {
    return { ok: false, error: keyJson.error || 'VAPID não configurado no servidor.' };
  }

  const publicKey = cleanVapidKey(String(keyJson.publicKey));
  if (publicKey.length < 80) {
    return {
      ok: false,
      error: 'VAPID_PUBLIC_KEY inválida no servidor (muito curta). Regenere com: npx web-push generate-vapid-keys',
    };
  }

  let reg: ServiceWorkerRegistration;
  try {
    reg = await ensureServiceWorker();
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Falha ao registrar service worker.' };
  }

  let sub: PushSubscription;
  try {
    sub = await subscribeWithKey(reg, publicKey);
  } catch (e: any) {
    return { ok: false, error: mapPushError(e) };
  }

  const res = await apiFetch('/api/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(token),
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    return { ok: false, error: 'Sessão expirada. Faça login de novo e clique em Ativar.' };
  }
  if (!res.ok) {
    return { ok: false, error: data.error || 'Falha ao registrar push no servidor.' };
  }
  return { ok: true, already: false };
}

export async function sendTestPush(apiUrl: string, token: string) {
  const res = await apiFetch('/api/push/test', {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error('Sessão expirada. Faça login de novo.');
  if (!res.ok) throw new Error(data.error || 'Falha no teste de push');
  return data as { success?: boolean; sent?: number; subscriptions?: number; errors?: number };
}
