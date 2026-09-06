/** Cliente Web Push no browser. */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePush(apiUrl: string, token: string): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, error: 'Push não suportado neste navegador.' };
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, error: 'Permissão de notificação negada.' };

  const keyRes = await fetch(`${apiUrl}/api/push/vapid-public-key`);
  const keyJson = await keyRes.json().catch(() => ({}));
  if (!keyRes.ok || !keyJson.publicKey) {
    return { ok: false, error: keyJson.error || 'VAPID não configurado no servidor.' };
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    // Cast: DOM lib tipa applicationServerKey de forma incompatível com Uint8Array genérico no TS 5.x
    const key = urlBase64ToUint8Array(String(keyJson.publicKey)) as unknown as BufferSource;
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
  }

  const res = await fetch(`${apiUrl}/api/push/subscribe`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || 'Falha ao registrar push' };
  return { ok: true };
}

export async function sendTestPush(apiUrl: string, token: string) {
  const res = await fetch(`${apiUrl}/api/push/test`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Falha no teste de push');
  return data;
}
