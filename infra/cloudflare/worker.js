const STATE_KEY = 'active_origin';
const RETRYABLE = new Set([502, 503, 504, 521, 522, 523, 524]);

function normalizeOrigin(value) {
  return new URL(value).origin;
}

function buildTarget(origin, requestUrl) {
  const incoming = new URL(requestUrl);
  const target = new URL(normalizeOrigin(origin));
  target.pathname = incoming.pathname;
  target.search = incoming.search;
  return target.toString();
}

async function readState(env) {
  const raw = await env.FAILOVER_ORIGIN.get(STATE_KEY);
  if (!raw) return { origin: 'primary', changedAt: 0, reason: 'default', nextProbeAt: 0 };
  try {
    const state = JSON.parse(raw);
    return {
      origin: state.origin === 'fallback' ? 'fallback' : 'primary',
      changedAt: Number(state.changedAt) || 0,
      reason: String(state.reason || 'unknown'),
      nextProbeAt: Number(state.nextProbeAt) || 0,
      eventId: state.eventId ? String(state.eventId) : undefined,
    };
  } catch {
    return { origin: 'primary', changedAt: 0, reason: 'invalid-state', nextProbeAt: 0 };
  }
}

async function writeState(env, state) {
  await env.FAILOVER_ORIGIN.put(STATE_KEY, JSON.stringify(state));
}

async function callOrigin(request, origin) {
  try {
    const response = await fetch(buildTarget(origin, request.url), new Request(request));
    return { response, retryable: RETRYABLE.has(response.status) };
  } catch {
    return { response: null, retryable: true };
  }
}

function responseFrom(response, origin) {
  const headers = new Headers(response.headers);
  headers.set('x-filtra-failover-origin', origin);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const primary = normalizeOrigin(env.PRIMARY_ORIGIN);
    const fallback = normalizeOrigin(env.FALLBACK_ORIGIN);
    const probeInterval = Math.max(60_000, Number(env.RECOVERY_PROBE_INTERVAL_MS || 300_000));
    let state = await readState(env);

    if (state.origin === 'fallback') {
      if (Date.now() >= state.nextProbeAt) {
        state = { ...state, nextProbeAt: Date.now() + probeInterval };
        await writeState(env, state);

        const primaryAttempt = await callOrigin(request, primary);
        if (primaryAttempt.response && !primaryAttempt.retryable) {
          await writeState(env, {
            origin: 'primary',
            changedAt: Date.now(),
            reason: 'automatic-recovery',
            nextProbeAt: 0,
          });
          return responseFrom(primaryAttempt.response, 'primary');
        }
      }

      const fallbackAttempt = await callOrigin(request, fallback);
      if (!fallbackAttempt.response) {
        return new Response('Fallback unavailable', { status: 503 });
      }
      return responseFrom(fallbackAttempt.response, 'fallback');
    }

    const primaryAttempt = await callOrigin(request, primary);
    if (primaryAttempt.response && !primaryAttempt.retryable) {
      return responseFrom(primaryAttempt.response, 'primary');
    }

    const fallbackAttempt = await callOrigin(request, fallback);
    if (!fallbackAttempt.response) {
      return new Response('Both origins unavailable', { status: 503 });
    }

    await writeState(env, {
      origin: 'fallback',
      changedAt: Date.now(),
      reason: primaryAttempt.response
        ? 'primary-http-' + primaryAttempt.response.status
        : 'primary-network-error',
      nextProbeAt: Date.now() + probeInterval,
    });

    return responseFrom(fallbackAttempt.response, 'fallback');
  },
};
