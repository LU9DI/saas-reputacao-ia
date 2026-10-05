const STATE_KEY = 'active_origin';
const RETRYABLE = new Set([402, 429, 500, 502, 503, 504, 521, 522, 523, 524]);
const WEBHOOK_PATH = '/_failover/vercel';
const CACHEABLE_PREFIXES = [
  '/', '/en', '/es', '/zh',
  '/filtra-ai', '/avaliacoes-google', '/feedback-de-clientes',
  '/analise-de-avaliacoes-com-ia', '/gestao-de-reputacao-online',
  '/reputacao-google', '/como-melhorar-avaliacoes-google',
  '/monitoramento-reputacao-online', '/gestao-de-feedback', '/blog',
];

function normalizeOrigin(value) { return new URL(value).origin; }

function publicPath(pathname) {
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/painel') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname === WEBHOOK_PATH
  ) return false;
  return CACHEABLE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
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

async function writeState(env, state) { await env.FAILOVER_ORIGIN.put(STATE_KEY, JSON.stringify(state)); }

async function eventProcessed(env, eventId) {
  if (!eventId) return false;
  return (await env.FAILOVER_ORIGIN.get('processed_event:' + eventId)) !== null;
}

async function markEventProcessed(env, eventId) {
  if (!eventId) return;
  await env.FAILOVER_ORIGIN.put('processed_event:' + eventId, JSON.stringify({ processedAt: Date.now() }), { expirationTtl: 86400 });
}

function safeEqualHex(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacSha1(body, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return bytesToHex(signature);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(digest);
}

async function handleFailoverWebhook(request, env) {
  const body = await request.text();
  let payload;
  try { payload = JSON.parse(body); } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const vercelSignature = request.headers.get('x-vercel-signature');
  const monitorSignature = request.headers.get('x-filtra-monitor-secret');
  let source = 'vercel';
  let valid = false;

  if (monitorSignature && env.FAILOVER_MONITOR_SECRET) {
    valid = safeEqualHex(await hmacSha1(body, env.FAILOVER_MONITOR_SECRET), monitorSignature);
    source = '90pct-monitor';
  } else if (vercelSignature && env.VERCEL_WEBHOOK_SECRET) {
    valid = safeEqualHex(await hmacSha1(body, env.VERCEL_WEBHOOK_SECRET), vercelSignature);
  }

  if (!valid) {
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 403, headers: { 'content-type': 'application/json' } });
  }

  const eventId = String(payload.eventId || await sha256(body));
  if (await eventProcessed(env, eventId)) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  const threshold = Number(payload.thresholdPercent);
  let action = 'ignore';
  if (threshold >= 90) action = 'failover';
  else if (threshold === 50 || threshold === 75) action = 'observe';

  if (action === 'failover') {
    const current = await readState(env);
    const cooldownMs = 300000;
    const inCooldown = current.changedAt > 0 && Date.now() - current.changedAt < cooldownMs;

    if (current.origin !== 'fallback' || !inCooldown) {
      await writeState(env, {
        origin: 'fallback',
        changedAt: Date.now(),
        reason: source === '90pct-monitor' ? 'spend-90-monitor' : 'spend-threshold-' + String(threshold),
        nextProbeAt: Date.now() + cooldownMs,
        eventId,
      });
    }
  }

  await markEventProcessed(env, eventId);

  return new Response(JSON.stringify({
    ok: true,
    action,
    source,
    thresholdPercent: Number.isFinite(threshold) ? threshold : null,
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

async function fetchPrimary(request, env) {
  try {
    const response = await fetch(buildTarget(env.PRIMARY_ORIGIN, request.url), new Request(request));
    return { response, retryable: RETRYABLE.has(response.status) };
  } catch {
    return { response: null, retryable: true };
  }
}


const SEO_EDGE = {
  "/": {title:"Filtra.AI | Gestão de reputação online e avaliações Google com IA",description:"Filtra.AI é a plataforma brasileira de gestão de reputação online, avaliações Google e feedback de clientes com IA. Monitore sinais, encontre padrões e transforme feedback em ação.",links:[["/gestao-de-reputacao-online","Gestão de reputação online"],["/avaliacoes-google","Gestão de avaliações Google"],["/analise-de-avaliacoes-com-ia","Análise de avaliações com IA"],["/feedback-de-clientes","Feedback de clientes"],["/agencias","Filtra.AI para agências"],["/auditoria-gratuita","Auditoria gratuita"]]},
  "/agencias": {title:"Filtra.AI para agências de marketing e SEO local | Gestão de reputação",description:"Ofereça gestão de reputação, avaliações Google e análise de feedback como serviço recorrente para seus clientes com o Filtra.AI.",links:[["/gestao-de-reputacao-online","Gestão de reputação online"],["/analise-de-avaliacoes-com-ia","Análise de avaliações com IA"],["/avaliacoes-google","Avaliações Google"],["/auditoria-gratuita","Auditoria gratuita"],["/filtra-ai","Conheça a Filtra.AI"]]},
  "/clinicas": {title:"Gestão de avaliações Google para clínicas | Filtra.AI",description:"Organize avaliações Google, feedback de pacientes e sinais de experiência para clínicas e redes com o Filtra.AI.",links:[["/gestao-de-reputacao-online","Gestão de reputação online"],["/avaliacoes-google","Avaliações Google"],["/feedback-de-clientes","Feedback de pacientes"],["/analise-de-avaliacoes-com-ia","Análise de avaliações com IA"],["/blog/clinica-checklist-avaliacoes-google","Checklist para clínicas"]]},
  "/gestao-de-reputacao-online": {title:"Gestão de reputação online: monitore avaliações e feedback | Filtra.AI",description:"Aprenda a estruturar gestão de reputação online com avaliações, feedback, monitoramento de temas e ações de melhoria.",links:[["/avaliacoes-google","Gestão de avaliações Google"],["/monitoramento-reputacao-online","Monitoramento de reputação"],["/analise-de-avaliacoes-com-ia","Análise de avaliações com IA"],["/feedback-de-clientes","Feedback de clientes"],["/agencias","Para agências"],["/auditoria-gratuita","Auditoria gratuita"]]},
  "/avaliacoes-google": {title:"Gestão de avaliações Google: monitore, analise e responda | Filtra.AI",description:"Organize avaliações Google, entenda os temas dos clientes e conecte feedback à operação com o Filtra.AI.",links:[["/gestao-de-reputacao-online","Gestão de reputação online"],["/reputacao-google","Reputação no Google"],["/analise-de-avaliacoes-com-ia","Análise de avaliações com IA"],["/como-melhorar-avaliacoes-google","Como melhorar avaliações Google"],["/monitoramento-reputacao-online","Monitoramento de reputação"]]},
  "/analise-de-avaliacoes-com-ia": {title:"Análise de avaliações com IA: encontre padrões e riscos | Filtra.AI",description:"Use IA para analisar avaliações de clientes, encontrar temas recorrentes, riscos e oportunidades sem depender de leitura manual.",links:[["/avaliacoes-google","Gestão de avaliações Google"],["/feedback-de-clientes","Feedback de clientes"],["/gestao-de-reputacao-online","Gestão de reputação online"],["/monitoramento-reputacao-online","Monitoramento de reputação"],["/filtra-ai","Filtra.AI"]]},
  "/feedback-de-clientes": {title:"Gestão de feedback de clientes com IA | Filtra.AI",description:"Centralize feedback de clientes, encontre padrões e transforme opiniões em prioridades de crescimento com IA.",links:[["/analise-de-avaliacoes-com-ia","Análise de avaliações com IA"],["/avaliacoes-google","Avaliações Google"],["/gestao-de-reputacao-online","Gestão de reputação online"],["/monitoramento-reputacao-online","Monitoramento de reputação"],["/auditoria-gratuita","Auditoria gratuita"]]},
  "/monitoramento-reputacao-online": {title:"Monitoramento de reputação online e avaliações | Filtra.AI",description:"Monitore avaliações, feedback e sinais de reputação online para identificar mudanças, padrões e prioridades de ação.",links:[["/gestao-de-reputacao-online","Gestão de reputação online"],["/avaliacoes-google","Avaliações Google"],["/analise-de-avaliacoes-com-ia","Análise com IA"],["/feedback-de-clientes","Feedback de clientes"],["/agencias","Para agências"]]},
  "/reputacao-google": {title:"Reputação no Google: gestão de avaliações e confiança | Filtra.AI",description:"Organize avaliações Google e feedback para transformar reputação no Google em decisões de melhoria e crescimento.",links:[["/avaliacoes-google","Avaliações Google"],["/gestao-de-reputacao-online","Gestão de reputação online"],["/como-melhorar-avaliacoes-google","Como melhorar avaliações Google"],["/monitoramento-reputacao-online","Monitoramento de reputação"],["/filtra-ai","Filtra.AI"]]}
};
function seoConfig(pathname){return SEO_EDGE[pathname]||null;}
function rewriteSeoResponse(request,response){
  if(request.method!=="GET"||!response||!response.ok||!String(response.headers.get("content-type")||"").toLowerCase().includes("text/html"))return response;
  const cfg=seoConfig(new URL(request.url).pathname); if(!cfg)return response;
  const rewriter=new HTMLRewriter()
    .on("title",{element(el){el.setInnerContent(cfg.title);}})
    .on("meta",{element(el){const name=(el.getAttribute("name")||"").toLowerCase();const property=(el.getAttribute("property")||"").toLowerCase();if(name==="description"||property==="og:description")el.setAttribute("content",cfg.description);if(property==="og:title"||name==="twitter:title")el.setAttribute("content",cfg.title);if(property==="og:description"||name==="twitter:description")el.setAttribute("content",cfg.description);}})
    .on("link",{element(el){if((el.getAttribute("rel")||"").toLowerCase()==="canonical")el.setAttribute("href","https://filtraai.com"+new URL(request.url).pathname);}})
    .on("main",{element(el){const links=cfg.links.map(([href,title])=>"<li><a href=\""+href+"\"><strong>"+title+"</strong></a></li>").join("");el.append("<section aria-label=\"Filtra.AI recursos de reputação\" style=\"max-width:1120px;margin:48px auto 24px;padding:24px;border-top:1px solid rgba(255,255,255,.1)\"><p style=\"margin:0 0 12px;font-weight:700\">Aprofunde sua estratégia de reputação com o Filtra.AI</p><ul style=\"display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;list-style:none;padding:0;margin:0\">"+links+"</ul></section>",{html:true});}});
  return rewriter.transform(response);
}

async function cacheResponse(request, response) {
  if (request.method !== 'GET' || !response || !response.ok) return;
  if (!publicPath(new URL(request.url).pathname)) return;

  const cached = response.clone();
  const headers = new Headers(cached.headers);
  if (!headers.has('cache-control')) headers.set('cache-control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');

  await caches.default.put(request, new Response(cached.body, {
    status: cached.status,
    statusText: cached.statusText,
    headers,
  }));
}

async function readCache(request) {
  if (request.method !== 'GET') return null;
  const cached = await caches.default.match(request);
  return cached ? new Response(cached.body, cached) : null;
}

function decorate(response, origin) {
  const headers = new Headers(response.headers);
  headers.set('x-filtra-failover-origin', origin);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function fallbackResponse(request, reason) {
  if (publicPath(new URL(request.url).pathname)) {
    const cached = await readCache(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('x-filtra-failover-origin', 'cloudflare-cache');
      headers.set('x-filtra-failover-reason', reason);
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
  }

  return new Response('Filtra.AI temporarily unavailable', {
    status: 503,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-filtra-failover-origin': 'cloudflare-fallback',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === WEBHOOK_PATH && request.method === 'POST') {
      return handleFailoverWebhook(request, env);
    }

    const probeInterval = Math.max(60000, Number(env.RECOVERY_PROBE_INTERVAL_MS || 300000));
    let state = await readState(env);

    if (state.origin === 'fallback') {
      if (Date.now() >= state.nextProbeAt) {
        state = { ...state, nextProbeAt: Date.now() + probeInterval };
        await writeState(env, state);

        const primary = await fetchPrimary(request, env);
        if (primary.response && !primary.retryable) {
          await writeState(env, {
            origin: 'primary',
            changedAt: Date.now(),
            reason: 'automatic-recovery',
            nextProbeAt: 0,
          });

          const enhanced=rewriteSeoResponse(request, primary.response);
          await cacheResponse(request, enhanced);
          return decorate(enhanced, 'primary');
        }
      }

      return fallbackResponse(request, 'configured-fallback');
    }

    const primary = await fetchPrimary(request, env);

    if (primary.response && !primary.retryable) {
      const enhanced=rewriteSeoResponse(request, primary.response);
      await cacheResponse(request, enhanced);
      return decorate(enhanced, 'primary');
    }

    await writeState(env, {
      origin: 'fallback',
      changedAt: Date.now(),
      reason: primary.response ? 'primary-http-' + primary.response.status : 'primary-network-error',
      nextProbeAt: Date.now() + probeInterval,
    });

    return fallbackResponse(request, primary.response ? 'primary-http-' + primary.response.status : 'primary-network-error');
  },
};
