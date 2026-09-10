/** Cliente Web Push no browser. */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker não suportado neste navegador.');
  }
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg = await navigator.serviceWorker.register('/sw.js');
  }
  // espera ativo (senão getSubscription/subscribe falha em silêncio em alguns browsers)
  if (reg.installing) {
    await new Promise<void>((resolve) => {
      reg!.installing!.addEventListener('statechange', () => {
        if (reg!.installing?.state === 'installed' || reg!.active) resolve();
      });
      setTimeout(() => resolve(), 4000);
    });
  }
  return navigator.serviceWorker.ready;
}

function authHeaders(token: string): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
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

  const keyRes = await fetch(`${apiUrl}/api/push/vapid-public-key`);
  const keyJson = await keyRes.json().catch(() => ({}));
  if (!keyRes.ok || !keyJson.publicKey) {
    return { ok: false, error: keyJson.error || 'VAPID não configurado no servidor.' };
  }

  let reg: ServiceWorkerRegistration;
  try {
    reg = await ensureServiceWorker();
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Falha ao registrar service worker.' };
  }

  let already = false;
  let sub = await reg.pushManager.getSubscription();
  if (sub) {
    already = true;
  } else {
    try {
      const key = urlBase64ToUint8Array(String(keyJson.publicKey)) as unknown as BufferSource;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
    } catch (e: any) {
      return {
        ok: false,
        error: e?.message || 'Falha ao criar subscription push no navegador.',
      };
    }
  }

  const res = await fetch(`${apiUrl}/api/push/subscribe`, {
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
  return { ok: true, already };
}

export async function sendTestPush(apiUrl: string, token: string) {
  const res = await fetch(`${apiUrl}/api/push/test`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error('Sessão expirada. Faça login de novo.');
  if (!res.ok) throw new Error(data.error || 'Falha no teste de push');
  return data as { success?: boolean; sent?: number; subscriptions?: number; errors?: number };
}
