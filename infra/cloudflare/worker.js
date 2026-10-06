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


const SEO_RESCUE = {"grouped":{"en":[{"slug":"ai","title":"AI Review Analysis and Customer Feedback Intelligence","description":"Turn customer reviews and feedback into actionable insights for reputation, customer experience and growth with Filtra.AI.","h1":"Turn customer voice into business growth with AI","intro":"Filtra.AI analyzes reviews and customer feedback to reveal recurring problems, opportunities and priorities your team can act on.","bullets":["Analyze customer reviews with AI","Identify recurring complaints and opportunities","Turn feedback into clear action priorities","Improve online reputation and customer experience"],"cta":"Start your free audit"},{"slug":"customer-feedback","title":"Customer Feedback Management with AI","description":"Centralize customer feedback, identify patterns and turn customer voice into growth opportunities.","h1":"Customer feedback that becomes action","intro":"Customer feedback is more than a collection of comments. Filtra.AI turns what customers say into decisions that improve experience and growth.","bullets":["Organize customer feedback","Detect patterns across reviews","Prioritize the issues that matter","Measure reputation and experience signals"],"cta":"See how Filtra.AI works"},{"slug":"ai-review-analysis","title":"AI Review Analysis for Businesses","description":"Analyze online reviews with AI, detect trends and identify what customers value or criticize most.","h1":"Analyze reviews with AI","intro":"Understand the meaning behind your reviews without reading every comment manually.","bullets":["Find recurring themes","Detect negative experience signals","Discover customer strengths","Create actionable priorities"],"cta":"Get a free audit"},{"slug":"online-reputation-management","title":"AI Online Reputation Management","description":"Monitor customer reviews and transform reputation signals into actions for visibility, trust and growth.","h1":"Manage online reputation with intelligence","intro":"Your reputation is built by customer experiences. Filtra.AI helps teams understand reputation signals and act on them.","bullets":["Monitor reputation signals","Understand negative reviews","Identify improvement opportunities","Turn reputation into a growth asset"],"cta":"Explore reputation management"},{"slug":"google-reviews","title":"Google Reviews Management and Analysis","description":"Analyze Google reviews with AI and discover opportunities to improve customer experience and online reputation.","h1":"Turn Google Reviews into growth signals","intro":"Google reviews influence how customers perceive a business. Filtra.AI helps you understand what those reviews reveal.","bullets":["Analyze Google review patterns","Find recurring customer issues","Understand positive experience drivers","Build a stronger review strategy"],"cta":"Start with a free audit"},{"slug":"filtra-ai","title":"Filtra.AI — AI Online Reputation Management","description":"Filtra.AI helps businesses manage online reputation, Google reviews and customer feedback with AI.","h1":"Turn customer voice into business growth with AI","intro":"Filtra.AI helps businesses transform reviews, customer feedback and reputation signals into practical growth decisions.","bullets":["Manage online reputation with AI","Organize Google reviews and feedback","Find recurring themes and priorities","Turn customer voice into action"],"cta":"Start your free audit"},{"slug":"google-reputation","title":"Google Reputation Management | Filtra.AI","description":"Manage Google reputation, review signals and customer feedback with Filtra.AI.","h1":"Google reputation management","intro":"Turn Google review signals into a continuous reputation management routine.","bullets":["Understand public reputation signals","Create a consistent review flow","Read themes beyond stars","Connect reviews to operational action"],"cta":"Start with a free audit"},{"slug":"improve-google-reviews","title":"How to Improve Google Reviews | Filtra.AI","description":"Practical ways to improve Google reviews by improving experience and making honest review collection easier.","h1":"How to improve Google reviews","intro":"Improve the experience first, then make it easier for satisfied customers to share honest reviews.","bullets":["Start with the customer experience","Reduce friction with direct links","Ask at the right moment","Learn from recurring criticism"],"cta":"Start with a free audit"},{"slug":"online-reputation-monitoring","title":"Online Reputation Monitoring | Filtra.AI","description":"Monitor reviews, recurring themes and changes in customer perception with Filtra.AI.","h1":"Online reputation monitoring","intro":"Monitor meaningful changes in reviews, themes and customer perception and turn them into management priorities.","bullets":["Track review volume and themes","Spot meaningful changes","Prioritize actionable signals","Build a weekly monitoring routine"],"cta":"Start with a free audit"},{"slug":"customer-feedback-management","title":"Customer Feedback Management | Filtra.AI","description":"Structure customer feedback collection, analysis and follow-up to turn opinions into measurable improvement.","h1":"Customer feedback management","intro":"Route the right feedback to the right team and close the loop with measurable action.","bullets":["Collect feedback close to experience","Organize by theme and priority","Separate public and private signals","Track operational improvement"],"cta":"Start with a free audit"},{"slug":"hotels","title":"Hotel Reputation Management and Guest Reviews | Filtra.AI","description":"Manage hotel reviews and guest feedback with AI to identify recurring experience issues and opportunities.","h1":"Hotel reputation management that turns guest reviews into action","intro":"Filtra.AI organizes guest reviews and feedback so hotel teams can see recurring themes across rooms, service, breakfast, cleanliness and the guest journey.","bullets":["Analyze guest reviews with AI","Find recurring experience problems","Compare patterns by property or location","Turn feedback into operational priorities"],"cta":"Start a free hotel audit"},{"slug":"tourism","title":"Tourism Reputation Management and Reviews | Filtra.AI","description":"Use AI to analyze tourism reviews and feedback across hotels, tours, destinations and visitor experiences.","h1":"Turn tourism reviews into better visitor experiences","intro":"Organize feedback across the visitor journey, separate public reputation signals from internal issues and identify recurring opportunities to improve.","bullets":["Analyze reviews across tourism operations","Compare themes by service or destination","Identify recurring visitor friction","Build a continuous reputation routine"],"cta":"Start a free tourism audit"},{"slug":"agencies","title":"Reputation Management for Agencies | Filtra.AI","description":"Offer AI-powered review and reputation management as a recurring service for local SEO and marketing clients.","h1":"Add reputation management to your agency offer","intro":"Filtra.AI gives agencies a repeatable way to organize reviews, feedback and reporting alongside local SEO and marketing services.","bullets":["Add reputation operations to client retainers","Turn reviews into local SEO evidence","Create recurring client reports","Start with one pilot account"],"cta":"Start an agency audit"},{"slug":"clinics","title":"Clinic Reputation Management and Patient Reviews | Filtra.AI","description":"Manage clinic reviews and patient feedback with AI while separating public reputation from issues that need internal care.","h1":"Clinic reputation management before the next Google review","intro":"Filtra.AI helps clinics collect, organize and analyze patient feedback to find recurring service friction and improve experience.","bullets":["Analyze patient reviews and feedback","Find recurring experience issues","Compare multiple clinic locations","Route private issues to the right team"],"cta":"Start a free clinic audit"},{"slug":"franchises","title":"Franchise Reputation Management by Location | Filtra.AI","description":"Monitor reputation across franchise locations, compare review themes and identify where customers need a better experience.","h1":"Manage franchise reputation by location","intro":"Filtra.AI helps franchise networks compare review signals, identify recurring patterns and give each location clearer priorities.","bullets":["See reputation signals by location","Compare recurring themes across units","Support franchisees with evidence","Scale the workflow without losing context"],"cta":"Start a franchise audit"},{"slug":"associations","title":"Association Feedback and Reputation Management | Filtra.AI","description":"Organize member and stakeholder feedback with AI to identify patterns, priorities and reputation opportunities.","h1":"Turn member feedback into better management","intro":"Filtra.AI organizes feedback from members, companies and other audiences so associations can see recurring patterns and decide where to focus.","bullets":["Collect structured stakeholder feedback","Find patterns by segment or region","Connect reputation and delivered experience","Build a recurring feedback routine"],"cta":"Start a free association audit"},{"slug":"restaurants","title":"Restaurant Reputation Management and Google Reviews | Filtra.AI","description":"Manage restaurant reviews and customer feedback with AI to improve service, experience and Google reputation.","h1":"Restaurant reputation management that learns from every review","intro":"Filtra.AI organizes restaurant reviews around service, food, waiting time, ambience and recurring customer experience signals.","bullets":["Analyze restaurant reviews with AI","Find recurring service problems","Connect QR feedback to public reviews","Track reputation changes over time"],"cta":"Start a free restaurant audit"},{"slug":"how-it-works","title":"How Filtra.AI Works for Reviews and Reputation","description":"See how Filtra.AI captures feedback, analyzes reviews and turns customer signals into reputation management actions.","h1":"How Filtra.AI works from feedback to reputation","intro":"Filtra.AI creates a structured feedback flow, organizes review signals with AI and helps teams turn customer voice into action.","bullets":["Capture the customer experience signal","Separate public and private feedback","Analyze themes and recurring issues","Turn signals into management priorities"],"cta":"See how Filtra.AI works"},{"slug":"partners","title":"Filtra.AI Partner Program for Reputation Management","description":"Partner with Filtra.AI to add review, feedback and reputation management to your consulting, agency or professional offer.","h1":"Bring reputation management to more businesses","intro":"Consultancies, agencies and professionals can use Filtra.AI as an operational layer for customer feedback and reputation management.","bullets":["Add a reputation service to your offer","Start with one pilot customer","Use evidence in client conversations","Scale a repeatable workflow"],"cta":"Start a partner audit"},{"slug":"ask-for-stars-vs-filtering","title":"Ask for 5 Stars vs Reputation Filtering | Filtra.AI","description":"Compare simply asking for stars with a feedback-first reputation workflow that learns from customer experience.","h1":"Asking for 5 stars is not the same as managing reputation","intro":"A feedback-first flow helps a business understand the customer experience before inviting honest public reviews and acting on recurring issues.","bullets":["Capture feedback before public review","Learn from criticism instead of hiding it","Make honest review collection easier","Turn signals into operational action"],"cta":"Compare the two approaches"},{"slug":"free-review-audit","title":"Free Google Review and Reputation Audit | Filtra.AI","description":"Get a free review and online reputation audit to identify patterns, risks and opportunities in your customer feedback.","h1":"Get a free review and reputation audit","intro":"Start with a practical view of your reviews, recurring themes and reputation signals before deciding what to change.","bullets":["Identify recurring review themes","Find reputation risks and opportunities","Understand what customers value most","Build a focused improvement plan"],"cta":"Request your free audit"}],"es":[{"slug":"ia","title":"Análisis de reseñas con IA e inteligencia de clientes","description":"Convierte reseñas y comentarios de clientes en información accionable para reputación, experiencia y crecimiento.","h1":"Convierte la voz del cliente en crecimiento con IA","intro":"Filtra.AI analiza reseñas y comentarios para revelar problemas recurrentes, oportunidades y prioridades de acción.","bullets":["Analiza reseñas con IA","Detecta quejas y oportunidades","Convierte comentarios en prioridades","Mejora reputación y experiencia"],"cta":"Solicitar auditoría gratuita"},{"slug":"feedback-clientes","title":"Gestión de feedback de clientes con IA","description":"Centraliza el feedback, identifica patrones y convierte la voz del cliente en oportunidades de crecimiento.","h1":"Feedback de clientes que se convierte en acción","intro":"Filtra.AI ayuda a convertir lo que dicen los clientes en decisiones que mejoran experiencia y crecimiento.","bullets":["Organiza el feedback","Detecta patrones en reseñas","Prioriza problemas importantes","Mide señales de reputación"],"cta":"Cómo funciona Filtra.AI"},{"slug":"analisis-resenas-ia","title":"Análisis de reseñas con IA para empresas","description":"Analiza reseñas online con IA, detecta tendencias y descubre qué valoran o critican más tus clientes.","h1":"Analiza reseñas con IA","intro":"Comprende el significado de tus reseñas sin leer cada comentario manualmente.","bullets":["Encuentra temas recurrentes","Detecta experiencia negativa","Descubre fortalezas","Crea prioridades accionables"],"cta":"Obtener auditoría gratuita"},{"slug":"gestion-reputacion-online","title":"Gestión de reputación online con IA","description":"Monitorea reseñas y convierte señales de reputación en acciones para mejorar confianza y crecimiento.","h1":"Gestiona tu reputación online con inteligencia","intro":"Filtra.AI ayuda a entender las señales de reputación y actuar sobre ellas.","bullets":["Monitorea señales","Comprende reseñas negativas","Encuentra oportunidades","Convierte reputación en crecimiento"],"cta":"Explorar gestión de reputación"},{"slug":"resenas-google","title":"Gestión y análisis de reseñas de Google","description":"Analiza reseñas de Google con IA y descubre oportunidades para mejorar experiencia y reputación.","h1":"Convierte las reseñas de Google en señales de crecimiento","intro":"Filtra.AI ayuda a entender qué revelan las reseñas de Google sobre tu negocio.","bullets":["Analiza patrones","Encuentra problemas recurrentes","Comprende experiencias positivas","Construye una estrategia de reseñas"],"cta":"Solicitar auditoría gratuita"},{"slug":"filtra-ai","title":"Filtra.AI — gestión de reputación online con IA","description":"Filtra.AI ayuda a las empresas a gestionar reputación online, reseñas de Google y feedback con IA.","h1":"Convierte la voz del cliente en crecimiento con IA","intro":"Filtra.AI ayuda a convertir reseñas, feedback y señales de reputación en decisiones prácticas.","bullets":["Gestiona reputación con IA","Organiza reseñas y feedback","Detecta temas y prioridades","Convierte la voz del cliente en acción"],"cta":"Solicitar auditoría gratuita"},{"slug":"reputacion-google","title":"Gestión de reputación en Google | Filtra.AI","description":"Gestiona reputación en Google, señales de reseñas y feedback con Filtra.AI.","h1":"Gestión de reputación en Google","intro":"Convierte las señales de Google en una rutina continua de gestión de reputación.","bullets":["Entiende señales públicas","Crea un flujo constante de reseñas","Analiza temas más allá de las estrellas","Conecta reseñas con acciones"],"cta":"Solicitar auditoría gratuita"},{"slug":"mejorar-resenas-google","title":"Cómo mejorar las reseñas de Google | Filtra.AI","description":"Formas prácticas de mejorar las reseñas de Google mejorando la experiencia y facilitando opiniones honestas.","h1":"Cómo mejorar las reseñas de Google","intro":"Mejora primero la experiencia y facilita que los clientes satisfechos compartan reseñas honestas.","bullets":["Empieza por la experiencia","Reduce la fricción","Pregunta en el momento adecuado","Aprende de críticas recurrentes"],"cta":"Solicitar auditoría gratuita"},{"slug":"monitoreo-reputacion-online","title":"Monitoreo de reputación online | Filtra.AI","description":"Monitorea reseñas, temas recurrentes y cambios de percepción con Filtra.AI.","h1":"Monitoreo de reputación online","intro":"Convierte los cambios relevantes de reseñas, temas y percepción en prioridades de gestión.","bullets":["Monitorea volumen y temas","Detecta cambios relevantes","Prioriza señales accionables","Crea una rutina semanal"],"cta":"Solicitar auditoría gratuita"},{"slug":"gestion-feedback-clientes","title":"Gestión de feedback de clientes | Filtra.AI","description":"Estructura la recogida, análisis y seguimiento del feedback para convertir opiniones en mejoras medibles.","h1":"Gestión de feedback de clientes","intro":"Lleva cada señal al equipo adecuado y cierra el ciclo con acciones medibles.","bullets":["Recoge feedback cerca de la experiencia","Organiza por tema y prioridad","Separa señales públicas y privadas","Mide mejoras operativas"],"cta":"Solicitar auditoría gratuita"},{"slug":"hoteles","title":"Gestión de reputación para hoteles y reseñas de huéspedes | Filtra.AI","description":"Gestiona reseñas de hoteles y feedback de huéspedes con IA para detectar problemas y oportunidades recurrentes.","h1":"Gestión de reputación para hoteles a partir de las reseñas","intro":"Filtra.AI organiza reseñas y feedback de huéspedes para detectar patrones en habitaciones, servicio, desayuno, limpieza y experiencia.","bullets":["Analiza reseñas de huéspedes con IA","Detecta problemas recurrentes de experiencia","Compara patrones por hotel o ubicación","Convierte feedback en prioridades operativas"],"cta":"Solicitar auditoría para hoteles"},{"slug":"turismo","title":"Gestión de reputación para turismo y reseñas | Filtra.AI","description":"Analiza con IA reseñas y feedback del sector turístico en hoteles, tours, destinos y experiencias.","h1":"Convierte las reseñas turísticas en mejores experiencias","intro":"Organiza el feedback del recorrido del visitante, separa señales públicas de problemas internos y detecta oportunidades recurrentes.","bullets":["Analiza reseñas de operaciones turísticas","Compara temas por servicio o destino","Detecta fricciones recurrentes de visitantes","Crea una rutina continua de reputación"],"cta":"Solicitar auditoría de turismo"},{"slug":"agencias","title":"Gestión de reputación para agencias | Filtra.AI","description":"Añade gestión de reseñas y reputación con IA como servicio recurrente para clientes de SEO local y marketing.","h1":"Añade gestión de reputación a tu oferta de agencia","intro":"Filtra.AI ofrece a las agencias una forma repetible de organizar reseñas, feedback e informes junto con SEO local y marketing.","bullets":["Añade operaciones de reputación a los contratos","Convierte reseñas en evidencia para SEO local","Crea informes recurrentes para clientes","Empieza con una cuenta piloto"],"cta":"Solicitar auditoría para agencias"},{"slug":"clinicas","title":"Gestión de reputación para clínicas y reseñas de pacientes | Filtra.AI","description":"Gestiona reseñas y feedback de pacientes con IA y separa la reputación pública de los problemas internos.","h1":"Gestión de reputación para clínicas antes de la próxima reseña","intro":"Filtra.AI ayuda a las clínicas a organizar y analizar feedback de pacientes para detectar fricciones recurrentes y mejorar la experiencia.","bullets":["Analiza reseñas y feedback de pacientes","Detecta problemas recurrentes de experiencia","Compara varias unidades","Lleva los problemas privados al equipo adecuado"],"cta":"Solicitar auditoría para clínicas"},{"slug":"franquicias","title":"Gestión de reputación para franquicias por unidad | Filtra.AI","description":"Monitoriza la reputación de las franquicias por ubicación, compara temas de reseñas y detecta dónde mejorar.","h1":"Gestiona la reputación de tu franquicia por unidad","intro":"Filtra.AI ayuda a redes de franquicias a comparar señales, detectar patrones y dar a cada unidad prioridades más claras.","bullets":["Ve señales por ubicación","Compara temas recurrentes entre unidades","Apoya a franquiciados con evidencia","Escala el flujo sin perder contexto"],"cta":"Solicitar auditoría para franquicias"},{"slug":"asociaciones","title":"Feedback y gestión de reputación para asociaciones | Filtra.AI","description":"Organiza el feedback de asociados y públicos con IA para encontrar patrones, prioridades y oportunidades de reputación.","h1":"Convierte el feedback de asociados en mejor gestión","intro":"Filtra.AI organiza el feedback de asociados, empresas y otros públicos para detectar patrones y decidir dónde concentrar la atención.","bullets":["Recoge feedback estructurado","Encuentra patrones por segmento o región","Relaciona reputación y experiencia entregada","Crea una rutina recurrente de feedback"],"cta":"Solicitar auditoría para asociaciones"},{"slug":"restaurantes","title":"Gestión de reputación para restaurantes y Google Reviews | Filtra.AI","description":"Gestiona reseñas de restaurantes y feedback de clientes con IA para mejorar experiencia y reputación en Google.","h1":"Gestión de reputación para restaurantes que aprende de cada reseña","intro":"Filtra.AI organiza reseñas sobre atención, comida, tiempos de espera, ambiente y señales recurrentes de experiencia.","bullets":["Analiza reseñas de restaurantes con IA","Detecta problemas recurrentes de servicio","Conecta feedback QR con reseñas públicas","Mide cambios de reputación"],"cta":"Solicitar auditoría para restaurantes"},{"slug":"como-funciona","title":"Cómo funciona Filtra.AI para reseñas y reputación","description":"Descubre cómo Filtra.AI recoge feedback, analiza reseñas y convierte señales de clientes en acciones.","h1":"Cómo funciona Filtra.AI: del feedback a la reputación","intro":"Filtra.AI crea un flujo de feedback estructurado, organiza señales con IA y ayuda a convertir la voz del cliente en acción.","bullets":["Captura la señal de experiencia","Separa feedback público y privado","Analiza temas y problemas recurrentes","Convierte señales en prioridades de gestión"],"cta":"Ver cómo funciona Filtra.AI"},{"slug":"socios","title":"Programa de socios de Filtra.AI para gestión de reputación","description":"Asóciate con Filtra.AI para añadir reseñas, feedback y gestión de reputación a tus servicios.","h1":"Lleva la gestión de reputación a más empresas","intro":"Consultoras, agencias y profesionales pueden usar Filtra.AI como capa operativa de feedback y reputación.","bullets":["Añade un servicio de reputación a tu oferta","Empieza con un cliente piloto","Usa evidencia en conversaciones","Escala un flujo repetible"],"cta":"Solicitar auditoría para socios"},{"slug":"pedir-estrellas-vs-filtrar","title":"Pedir 5 estrellas vs filtrar feedback | Filtra.AI","description":"Compara pedir estrellas directamente con un flujo de reputación basado en feedback y experiencia del cliente.","h1":"Pedir 5 estrellas no es lo mismo que gestionar la reputación","intro":"Un flujo basado en feedback permite entender la experiencia antes de invitar a reseñas públicas honestas y actuar sobre problemas recurrentes.","bullets":["Captura feedback antes de la reseña pública","Aprende de las críticas","Facilita reseñas honestas","Convierte señales en acciones"],"cta":"Comparar los dos enfoques"},{"slug":"auditoria-gratuita","title":"Auditoría gratuita de reseñas y reputación online | Filtra.AI","description":"Haz una auditoría gratuita de reseñas y reputación online para identificar patrones, riesgos y oportunidades.","h1":"Obtén una auditoría gratuita de reseñas y reputación","intro":"Empieza con una visión práctica de tus reseñas, temas recurrentes y señales de reputación antes de decidir qué cambiar.","bullets":["Identifica temas recurrentes","Encuentra riesgos y oportunidades","Entiende qué valoran tus clientes","Crea un plan de mejora enfocado"],"cta":"Solicitar auditoría gratuita"}],"zh":[{"slug":"ai","title":"AI 评论分析与客户反馈智能","description":"使用 Filtra.AI 将客户评论和反馈转化为可执行洞察，改善声誉、客户体验和业务增长。","h1":"用 AI 将客户声音转化为业务增长","intro":"Filtra.AI 分析评论和客户反馈，发现重复问题、机会和行动优先级。","bullets":["使用 AI 分析客户评论","发现重复投诉和机会","将反馈转化为行动优先级","改善在线声誉和客户体验"],"cta":"开始免费审计"},{"slug":"customer-feedback","title":"AI 客户反馈管理","description":"集中管理客户反馈，发现模式，并将客户声音转化为增长机会。","h1":"让客户反馈真正产生行动","intro":"Filtra.AI 帮助企业将客户声音转化为改善体验和增长的决策。","bullets":["整理客户反馈","发现评论中的模式","确定重要问题优先级","衡量声誉和体验信号"],"cta":"了解 Filtra.AI"},{"slug":"ai-review-analysis","title":"企业 AI 评论分析","description":"使用 AI 分析在线评论，发现趋势并了解客户最重视或最不满意的方面。","h1":"使用 AI 分析客户评论","intro":"无需手动阅读每一条评论，也能理解评论背后的业务信号。","bullets":["发现重复主题","识别负面体验","发现客户认可的优势","建立可执行优先级"],"cta":"获取免费审计"},{"slug":"online-reputation-management","title":"AI 在线声誉管理","description":"监测客户评论，将声誉信号转化为改善信任、可见度和增长的行动。","h1":"用智能管理在线声誉","intro":"Filtra.AI 帮助团队理解声誉信号并及时行动。","bullets":["监测声誉信号","理解负面评论","发现积极体验机会","将声誉转化为增长资产"],"cta":"了解声誉管理"},{"slug":"google-reviews","title":"Google 评论管理与分析","description":"使用 AI 分析 Google 评论，发现改善客户体验和在线声誉的机会。","h1":"将 Google 评论转化为增长信号","intro":"Filtra.AI 帮助企业理解 Google 评论揭示的信息。","bullets":["分析 Google 评论模式","发现重复客户问题","了解积极体验驱动因素","建立更好的评论策略"],"cta":"开始免费审计"},{"slug":"filtra-ai","title":"Filtra.AI — AI 在线声誉管理","description":"Filtra.AI 帮助企业使用 AI 管理在线声誉、Google 评价和客户反馈。","h1":"用 AI 将客户声音转化为业务增长","intro":"Filtra.AI 将评价、客户反馈和声誉信号转化为实际增长决策。","bullets":["使用 AI 管理在线声誉","整理 Google 评价和反馈","发现重复主题和优先事项","将客户声音转化为行动"],"cta":"开始免费审计"},{"slug":"google-reputation","title":"Google 声誉管理 | Filtra.AI","description":"使用 Filtra.AI 管理 Google 声誉、评价信号和客户反馈。","h1":"Google 声誉管理","intro":"将 Google 评价信号转化为持续的声誉管理流程。","bullets":["理解公开声誉信号","建立稳定评价流程","关注星级之外的主题","将评价连接到运营行动"],"cta":"开始免费审计"},{"slug":"improve-google-reviews","title":"如何改善 Google 评价 | Filtra.AI","description":"通过改善体验和降低真实评价收集摩擦来改善 Google 评价。","h1":"如何改善 Google 评价","intro":"先改善客户体验，再让满意客户更容易分享真实评价。","bullets":["从客户体验开始","降低评价摩擦","在合适时机请求","从重复批评中学习"],"cta":"开始免费审计"},{"slug":"online-reputation-monitoring","title":"在线声誉监测 | Filtra.AI","description":"使用 Filtra.AI 监测评价、重复主题和客户感知变化。","h1":"在线声誉监测","intro":"监测评价、主题和客户感知的重要变化，并转化为管理优先事项。","bullets":["跟踪评价数量和主题","发现有意义的变化","优先处理可行动信号","建立每周监测机制"],"cta":"开始免费审计"},{"slug":"customer-feedback-management","title":"客户反馈管理 | Filtra.AI","description":"建立客户反馈收集、分析和跟进流程，将意见转化为可衡量的改进。","h1":"客户反馈管理","intro":"将正确的反馈交给正确团队，并通过可衡量的行动完成闭环。","bullets":["在体验附近收集反馈","按主题和优先级整理","区分公开与私密信号","跟踪运营改善"],"cta":"开始免费审计"},{"slug":"hotels","title":"酒店声誉管理与宾客评价 | Filtra.AI","description":"使用 AI 管理酒店评价和宾客反馈，发现重复的体验问题与改进机会。","h1":"让酒店宾客评价真正推动服务改进","intro":"Filtra.AI 整理宾客评价与反馈，帮助酒店发现客房、服务、早餐、清洁和旅程中的重复主题。","bullets":["使用 AI 分析宾客评价","发现重复的体验问题","按酒店或地点比较模式","将反馈转化为运营优先级"],"cta":"开始酒店免费审计"},{"slug":"tourism","title":"旅游业声誉管理与评价 | Filtra.AI","description":"使用 AI 分析旅游行业评价和反馈，覆盖酒店、旅行团、目的地与游客体验。","h1":"将旅游评价转化为更好的游客体验","intro":"整理游客旅程中的反馈，区分公开声誉信号与内部问题，并发现重复的改进机会。","bullets":["分析不同旅游业务的评价","按服务或目的地比较主题","发现重复的游客摩擦","建立持续的声誉管理流程"],"cta":"开始旅游业免费审计"},{"slug":"agencies","title":"代理机构声誉管理服务 | Filtra.AI","description":"为本地 SEO 和营销客户提供 AI 驱动的评价与声誉管理服务。","h1":"将声誉管理加入您的代理机构服务","intro":"Filtra.AI 帮助代理机构以可重复的方式整理评价、反馈和报告，并与本地 SEO 和营销服务结合。","bullets":["把声誉运营加入客户服务","将评价转化为本地 SEO 证据","创建持续的客户报告","从一个试点客户开始"],"cta":"开始代理机构免费审计"},{"slug":"clinics","title":"诊所声誉管理与患者评价 | Filtra.AI","description":"使用 AI 管理诊所评价和患者反馈，将公开声誉与需要内部处理的问题分开。","h1":"在下一条 Google 评价之前管理诊所声誉","intro":"Filtra.AI 帮助诊所收集、整理和分析患者反馈，发现重复的服务摩擦并改善体验。","bullets":["分析患者评价与反馈","发现重复的体验问题","比较不同诊所地点","将私密问题交给合适团队"],"cta":"开始诊所免费审计"},{"slug":"franchises","title":"连锁与加盟声誉管理 | Filtra.AI","description":"按门店监测加盟网络声誉，比较评价主题并找到需要改善的位置。","h1":"按门店管理连锁企业的声誉","intro":"Filtra.AI 帮助连锁网络比较评价信号、发现重复模式，并为每个门店提供清晰的改进重点。","bullets":["按门店查看声誉信号","比较不同门店的重复主题","用证据支持加盟商","规模化流程同时保留上下文"],"cta":"开始加盟网络免费审计"},{"slug":"associations","title":"协会反馈与声誉管理 | Filtra.AI","description":"使用 AI 整理会员与利益相关者反馈，发现模式、优先级和声誉机会。","h1":"将会员反馈转化为更好的管理","intro":"Filtra.AI 整理会员、企业和其他受众的反馈，让协会能够发现重复模式并明确关注重点。","bullets":["收集结构化利益相关者反馈","按细分或地区发现模式","连接声誉与实际体验","建立持续反馈机制"],"cta":"开始协会免费审计"},{"slug":"restaurants","title":"餐厅声誉管理与 Google 评价 | Filtra.AI","description":"使用 AI 管理餐厅评价和客户反馈，改善服务、体验与 Google 声誉。","h1":"从每一条评价中学习的餐厅声誉管理","intro":"Filtra.AI 围绕服务、食物、等待时间、环境和重复体验信号整理餐厅评价。","bullets":["使用 AI 分析餐厅评价","发现重复服务问题","连接二维码反馈与公开评价","持续追踪声誉变化"],"cta":"开始餐厅免费审计"},{"slug":"how-it-works","title":"Filtra.AI 如何管理评价与声誉","description":"了解 Filtra.AI 如何收集反馈、分析评价并将客户信号转化为行动。","h1":"Filtra.AI 如何从反馈走向声誉管理","intro":"Filtra.AI 建立结构化反馈流程，使用 AI 整理评价信号，并帮助团队将客户声音转化为行动。","bullets":["捕捉客户体验信号","区分公开与私密反馈","分析主题与重复问题","把信号转化为管理重点"],"cta":"了解 Filtra.AI 如何工作"},{"slug":"partners","title":"Filtra.AI 声誉管理合作伙伴计划","description":"与 Filtra.AI 合作，将评价、反馈和声誉管理加入您的咨询或专业服务。","h1":"将声誉管理带给更多企业","intro":"咨询公司、代理机构和专业人士可以把 Filtra.AI 作为客户反馈与声誉管理的运营层。","bullets":["把声誉服务加入现有方案","从一个试点客户开始","在客户沟通中使用证据","扩展可复制的工作流"],"cta":"开始合作伙伴审计"},{"slug":"request-stars-vs-filter","title":"请求五星 vs 反馈筛选 | Filtra.AI","description":"比较直接请求五星与以客户反馈为基础的声誉管理流程。","h1":"请求五星不等于管理企业声誉","intro":"以反馈为先的流程可以先理解客户体验，再邀请真实公开评价，并对重复问题采取行动。","bullets":["在公开评价前收集反馈","从批评中学习","让真实评价更容易产生","把信号转化为运营行动"],"cta":"比较两种方式"},{"slug":"free-review-audit","title":"免费 Google 评价与在线声誉审计 | Filtra.AI","description":"免费分析 Google 评价和在线声誉，发现模式、风险与机会。","h1":"获取免费的评价与声誉审计","intro":"先了解评价、重复主题和声誉信号，再决定哪些问题值得优先改善。","bullets":["发现重复评价主题","识别声誉风险与机会","了解客户最重视什么","建立聚焦的改进计划"],"cta":"申请免费审计"}]},"pageMap":{"en":["ai","customer-feedback","ai-review-analysis","online-reputation-management","google-reviews","filtra-ai","google-reputation","improve-google-reviews","online-reputation-monitoring","customer-feedback-management","hotels","tourism","agencies","clinics","franchises","associations","restaurants","how-it-works","partners","ask-for-stars-vs-filtering","free-review-audit"],"es":["ia","feedback-clientes","analisis-resenas-ia","gestion-reputacion-online","resenas-google","filtra-ai","reputacion-google","mejorar-resenas-google","monitoreo-reputacion-online","gestion-feedback-clientes","hoteles","turismo","agencias","clinicas","franquicias","asociaciones","restaurantes","como-funciona","socios","pedir-estrellas-vs-filtrar","auditoria-gratuita"],"zh":["ai","customer-feedback","ai-review-analysis","online-reputation-management","google-reviews","filtra-ai","google-reputation","improve-google-reviews","online-reputation-monitoring","customer-feedback-management","hotels","tourism","agencies","clinics","franchises","associations","restaurants","how-it-works","partners","request-stars-vs-filter","free-review-audit"]},"blogMap":{"en":["get-google-reviews","online-reputation-management-guide","ai-review-analysis-guide","local-seo-google-reviews"],"es":["conseguir-resenas-google","guia-gestion-reputacion-online","analisis-resenas-ia","seo-local-resenas-google"],"zh":["google-reviews-guide","online-reputation-management-guide","ai-review-analysis-guide","local-seo-google-reviews"]},"ptPaths":["/ia","/feedback-de-clientes","/analise-de-avaliacoes-com-ia","/gestao-de-reputacao-online","/avaliacoes-google","/filtra-ai","/reputacao-google","/como-melhorar-avaliacoes-google","/monitoramento-reputacao-online","/gestao-de-feedback","/hoteis","/turismo","/agencias","/clinicas","/franquias","/restaurantes","/como-funciona","/parceiros","/pedir-estrela-vs-filtrar","/auditoria-gratuita"],"blogs":{"en":[{"slug":"get-google-reviews","title":"How to Get More Genuine Google Reviews","description":"A practical guide to collecting more genuine Google reviews without pressuring customers or selecting reviews by rating.","kicker":"Google Reviews · Guide","lead":"More reviews start with a better customer journey and a simple invitation at the right moment. The goal is not to control the rating; it is to make honest feedback easier to share."},{"slug":"online-reputation-management-guide","title":"Online Reputation Management: A Practical Guide","description":"Learn how to build a repeatable online reputation management process around reviews, feedback, analysis and action.","kicker":"Online Reputation · Guide","lead":"Reputation management works better as an operating process than as a crisis response. The strongest teams monitor signals, understand causes and close the loop."},{"slug":"ai-review-analysis-guide","title":"AI Review Analysis: How to Turn Comments into Decisions","description":"Use AI to organize customer reviews, detect recurring themes and turn large volumes of comments into practical priorities.","kicker":"AI · Review Analysis","lead":"Reading every review manually becomes harder as volume grows. AI can reduce the search work so teams spend more time interpreting context and acting on evidence."},{"slug":"local-seo-google-reviews","title":"Local SEO and Google Reviews: What Businesses Should Monitor","description":"Connect local SEO, Google reviews and customer experience with a practical reputation workflow for local businesses.","kicker":"Local SEO · Reviews","lead":"Local visibility is not only about publishing a profile. Businesses also need a credible customer experience and a steady process for learning from reviews."}],"es":[{"slug":"conseguir-resenas-google","title":"Cómo conseguir más reseñas genuinas en Google","description":"Guía práctica para aumentar reseñas genuinas en Google sin presionar a los clientes ni seleccionar opiniones por valoración.","kicker":"Reseñas de Google · Guía","lead":"Más reseñas empiezan por una mejor experiencia y una invitación sencilla en el momento adecuado. El objetivo no es controlar la nota, sino facilitar que el cliente comparta su opinión."},{"slug":"guia-gestion-reputacion-online","title":"Gestión de reputación online: guía práctica","description":"Aprende a crear un proceso repetible de gestión de reputación online basado en reseñas, feedback, análisis y acción.","kicker":"Reputación online · Guía","lead":"La reputación funciona mejor como un proceso operativo que como una respuesta a crisis. Los equipos fuertes monitorizan señales, entienden causas y cierran el ciclo."},{"slug":"analisis-resenas-ia","title":"Análisis de reseñas con IA: de los comentarios a las decisiones","description":"Usa IA para organizar reseñas, detectar temas recurrentes y convertir grandes volúmenes de comentarios en prioridades prácticas.","kicker":"IA · Análisis de reseñas","lead":"Leer cada reseña manualmente se vuelve difícil cuando crece el volumen. La IA puede reducir el trabajo de búsqueda para que el equipo dedique más tiempo al contexto y a la acción."},{"slug":"seo-local-resenas-google","title":"SEO local y reseñas de Google: qué debe monitorizar una empresa","description":"Conecta SEO local, reseñas de Google y experiencia del cliente con una rutina práctica de reputación para negocios locales.","kicker":"SEO local · Reseñas","lead":"La visibilidad local no depende solo de tener un perfil. También necesitas una experiencia creíble y un proceso constante para aprender de las reseñas."}],"zh":[{"slug":"google-reviews-guide","title":"如何获得更多真实的 Google 评价","description":"通过真实、非选择性的评价邀请，提高 Google 评价数量，同时避免给客户施加评分压力。","kicker":"Google 评价 · 指南","lead":"更多评价首先来自更好的客户体验，以及在合适时间发出的简单邀请。目标不是控制评分，而是让真实反馈更容易发生。"},{"slug":"online-reputation-management-guide","title":"在线声誉管理：企业实用指南","description":"建立围绕评价、客户反馈、分析和行动的可重复在线声誉管理流程。","kicker":"在线声誉 · 指南","lead":"声誉管理更适合作为持续运营流程，而不是危机发生后的临时反应。优秀团队会监测信号、理解原因并完成闭环。"},{"slug":"ai-review-analysis-guide","title":"AI 评论分析：如何把评论转化为管理决策","description":"使用 AI 整理客户评论、发现重复主题，并把大量评论转化为可执行优先级。","kicker":"AI · 评论分析","lead":"当评论越来越多时，人工逐条阅读会变慢。AI 可以减少寻找信号的工作，让团队把更多时间用于理解背景和采取行动。"},{"slug":"local-seo-google-reviews","title":"本地 SEO 与 Google 评价：企业应该监测什么","description":"把本地 SEO、Google 评价和客户体验连接起来，为本地企业建立可持续的声誉管理流程。","kicker":"本地 SEO · 评价","lead":"本地可见度不仅仅是建立一个商家资料。企业还需要可信的客户体验，以及持续学习评价内容的方法。"}]}};
const SEO_RESCUE_LABELS = {
  en:{why:'What this page helps you solve',how:'A practical workflow',resources:'Guides and resources',next:'Continue with Filtra.AI',back:'See the full strategy',home:'/en',audit:'/en/free-review-audit'},
  es:{why:'Qué problema ayuda a resolver esta página',how:'Un flujo de trabajo práctico',resources:'Guías y recursos',next:'Continúa con Filtra.AI',back:'Ver la estrategia completa',home:'/es',audit:'/es/auditoria-gratuita'},
  zh:{why:'本页面可以帮助解决什么问题',how:'实用的管理流程',resources:'指南与资源',next:'继续了解 Filtra.AI',back:'查看完整策略',home:'/zh',audit:'/zh/free-review-audit'}
};
function escHtml(value){return String(value).replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function rescueLookup(pathname){
  const m=pathname.match(/^\/(en|es|zh)\/([^/]+)(?:\/)?$/);
  if(m){
    const lang=m[1],slug=m[2],idx=SEO_RESCUE.pageMap[lang].indexOf(slug);
    if(idx>=0)return {kind:'page',lang,slug,idx,item:SEO_RESCUE.grouped[lang][idx]};
  }
  const b=pathname.match(/^\/(en|es|zh)\/blog\/([^/]+)(?:\/)?$/);
  if(b){
    const lang=b[1],slug=b[2],idx=SEO_RESCUE.blogMap[lang].indexOf(slug);
    if(idx>=0)return {kind:'blog',lang,slug,idx,item:SEO_RESCUE.blogs[lang][idx]};
  }
  return null;
}
function localizedPagePath(lang,idx){return '/'+lang+'/'+SEO_RESCUE.pageMap[lang][idx];}
function localizedBlogPath(lang,idx){return '/'+lang+'/blog/'+SEO_RESCUE.blogMap[lang][idx];}
function rescueResponse(request){
  if(request.method!=='GET')return null;
  const pathname=new URL(request.url).pathname;
  const found=rescueLookup(pathname); if(!found)return null;
  const {kind,lang,idx,item}=found, t=SEO_RESCUE_LABELS[lang];
  const title=item.title, description=item.description;
  const intro=kind==='page'?item.intro:item.lead;
  const audit=t.audit;
  const related=kind==='page'
    ? [1,2,3,4].map(o=>(idx+o)%SEO_RESCUE.pageMap[lang].length).map(i=>({href:localizedPagePath(lang,i),title:SEO_RESCUE.grouped[lang][i].title,description:SEO_RESCUE.grouped[lang][i].description}))
    : [1,2,3].map(o=>(idx+o)%SEO_RESCUE.blogMap[lang].length).map(i=>({href:localizedBlogPath(lang,i),title:SEO_RESCUE.blogs[lang][i].title,description:SEO_RESCUE.blogs[lang][i].description}));
  const bullets=kind==='page'?item.bullets:[
    lang==='en'?'Understand the topic with a structured, practical workflow':lang==='es'?'Entiende el tema con un flujo práctico y estructurado':'用结构化、实用的流程理解这一主题',
    lang==='en'?'Connect customer signals to operational priorities':lang==='es'?'Conecta señales de clientes con prioridades operativas':'把客户信号连接到运营优先事项',
    lang==='en'?'Turn feedback into measurable improvement':lang==='es'?'Convierte el feedback en mejoras medibles':'把反馈转化为可衡量的改进'
  ];
  const relatedHtml=related.map(x=>'<a href="'+x.href+'" style="display:block;padding:16px;border:1px solid #27272a;border-radius:14px;background:#09090b;color:#fafafa;text-decoration:none"><strong>'+escHtml(x.title)+'</strong><span style="display:block;margin-top:6px;color:#a1a1aa;font-size:14px;line-height:1.5">'+escHtml(x.description)+'</span></a>').join('');
  const bulletsHtml=bullets.map(x=>'<div class="card">'+escHtml(x)+'</div>').join('');
  const hreflang = kind==='page'
    ? ['en','es','zh'].map(code=>'<link rel="alternate" hreflang="'+code+'" href="https://filtraai.com'+localizedPagePath(code,idx)+'">').join('')+
      '<link rel="alternate" hreflang="pt-BR" href="https://filtraai.com'+SEO_RESCUE.ptPaths[idx]+'"><link rel="alternate" hreflang="x-default" href="https://filtraai.com'+SEO_RESCUE.ptPaths[idx]+'">'
    : ['en','es','zh'].map(code=>'<link rel="alternate" hreflang="'+code+'" href="https://filtraai.com'+localizedBlogPath(code,idx)+'">').join('');
  const canonical='https://filtraai.com'+pathname;
  const jsonLd=JSON.stringify({
    '@context':'https://schema.org','@type':'WebPage',name:title,description,url:canonical,inLanguage:lang,
    isPartOf:{'@type':'WebSite',name:'Filtra.AI',url:'https://filtraai.com/'}
  }).replace(/</g,'\\u003c');
  const jsonBread=JSON.stringify({
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem',position:1,name:'Filtra.AI',item:'https://filtraai.com'+t.home},
      {'@type':'ListItem',position:2,name:title,item:canonical}
    ]
  }).replace(/</g,'\\u003c');
  const heading=kind==='page'?item.h1:title;
  const kicker=kind==='blog'?(item.kicker||'Filtra.AI'):'Filtra.AI';
  const action=kind==='page'?item.cta:(lang==='en'?'Continue with Filtra.AI':lang==='es'?'Continuar con Filtra.AI':'继续了解 Filtra.AI');
  const html='<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+escHtml(title)+'</title><meta name="description" content="'+escHtml(description)+'"><meta name="robots" content="index,follow">'+
    '<link rel="canonical" href="'+canonical+'">'+hreflang+
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Filtra.AI"><meta property="og:title" content="'+escHtml(title)+'"><meta property="og:description" content="'+escHtml(description)+'">'+
    '<script type="application/ld+json">'+jsonLd+'</script><script type="application/ld+json">'+jsonBread+'</script>'+
    '<style>body{margin:0;background:#000;color:#f4f4f5;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:1040px;margin:0 auto;padding:24px}.top{border-bottom:1px solid #27272a}.brand{font-weight:700;text-decoration:none}.hero{padding:72px 0}.kicker{color:#818cf8;font-weight:600}.h1{font-size:clamp(36px,6vw,66px);line-height:1.05;max-width:900px}.lead{font-size:20px;line-height:1.7;color:#d4d4d8;max-width:780px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.card{padding:18px;border:1px solid #27272a;border-radius:16px;background:#09090b}.muted{color:#a1a1aa;line-height:1.7}.cta{display:inline-block;margin-top:28px;padding:13px 18px;border-radius:12px;background:#6366f1;color:#fff;text-decoration:none;font-weight:700}.foot{margin:60px 0 20px;color:#a1a1aa;font-size:14px}</style></head><body>'+
    '<header class="top"><div class="wrap"><a class="brand" href="'+t.home+'">Filtra.AI</a></div></header><main class="wrap">'+
    '<section class="hero"><div class="kicker">'+escHtml(kicker)+'</div><h1 class="h1">'+escHtml(heading)+'</h1><p class="lead">'+escHtml(intro)+'</p><a class="cta" href="'+audit+'">'+escHtml(action)+'</a></section>'+
    '<section><h2>'+escHtml(t.why)+'</h2><p class="muted">'+escHtml(lang==='en'?
      'The goal is to understand customer signals and turn them into decisions, not simply collect more comments.':
      lang==='es'?'El objetivo es entender las señales de los clientes y convertirlas en decisiones, no solo acumular comentarios.':
      '目标是理解客户信号并把它们转化为决策，而不是简单收集更多评论。')+'</p></section>'+
    '<section style="margin-top:42px"><div class="grid">'+bulletsHtml+'</div></section>'+
    '<section style="margin-top:42px"><h2>'+escHtml(t.how)+'</h2><p class="muted">'+escHtml(lang==='en'?
      'Start with the customer experience, organize the relevant signals, identify recurring patterns, route the right issue to the right team and monitor change over time.':
      lang==='es'?'Empieza por la experiencia, organiza las señales, identifica patrones recurrentes, lleva cada problema al equipo adecuado y mide los cambios con el tiempo.':
      '从客户体验开始，整理相关信号，发现重复模式，把问题交给合适团队，并持续观察变化。')+'</p></section>'+
    '<section style="margin-top:42px"><h2>'+escHtml(t.next)+'</h2><div class="grid">'+relatedHtml+'</div></section>'+
    '<section class="foot"><a href="'+(kind==='page'?'/'+lang+'/blog':+'/'+lang+'/blog')+'">'+escHtml(t.resources)+'</a> · <a href="'+t.home+'">'+escHtml(t.back)+'</a></section>'+
    '</main></body></html>';
  return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400','x-filtra-seo-rescue':'1'}});
}
async function enhanceResponse(request,response){
  const pathname=new URL(request.url).pathname;
  const found=rescueLookup(pathname);
  if(found && request.method==='GET' && response){
    if(response.status===404)return rescueResponse(request);
    const ct=String(response.headers.get('content-type')||'').toLowerCase();
    if(response.status===200 && ct.includes('text/html')){
      try{
        const body=await response.clone().text();
        const key=found.kind==='page'?found.item.h1:found.item.title;
        if(body.length<7000 || !body.includes(key))return rescueResponse(request);
      }catch{}
    }
  }
  return rewriteSeoResponse(request,response);
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

async function fetchFallback(request, env) {
  try {
    const configured = await env.FAILOVER_ORIGIN.get('FAILOVER_ORIGIN');
    if (configured) {
      const response = await fetch(buildTarget(configured, request.url), new Request(request));
      return { response, retryable: RETRYABLE.has(response.status) };
    }
  } catch {}
  return { response: null, retryable: true };
}

async function fallbackResponse(request, env, reason) {
  const fallback = await fetchFallback(request, env);
  if (fallback.response && !fallback.retryable) {
    const enhanced = await enhanceResponse(request, fallback.response);
    await cacheResponse(request, enhanced);
    return decorate(enhanced, 'fallback');
  }

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

          const enhanced=await enhanceResponse(request, primary.response);
          await cacheResponse(request, enhanced);
          return decorate(enhanced, 'primary');
        }
      }

      return fallbackResponse(request, env, 'configured-fallback');
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

    return fallbackResponse(request, env, primary.response ? 'primary-http-' + primary.response.status : 'primary-network-error');
  },
};
