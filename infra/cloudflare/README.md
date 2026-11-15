# Cloudflare SEO / Índice / IndexNow Workers

Sources of truth for the production Workers `filtra-indexnow-key` (`filtra-indexnow-key.js`) and `filtra-indice-proxy` (`filtra-indice-proxy.js`).

## Responsibilities

- Serves the IndexNow verification key at `/a3d7f1c94b2e6a805d1f7c3b9e4a6d82.txt`.
- Serves `/robots.txt` and `/sitemap.xml` on exact routes, with a validated fallback chain.
- On a **GET** to the key file, reads the canonical sitemap and submits its valid, non-`/zh` URLs to IndexNow asynchronously. A successful HTTP response from the key route is not proof that IndexNow accepted the submission.
- Does not maintain a second, hard-coded list of SEO routes. When no integral copy is available, the Worker returns `503` rather than serving stale or divergent SEO metadata.

## Sitemap fallback chain

1. **Primary — Render runtime:** `https://filtra-ai-web-runtime.onrender.com`.
2. **Fallback — Vercel:** `https://saas-reputacao-ia.vercel.app`. The project builds the same `main` and serves `/sitemap.xml` as a `force-static` route, so it is the canonical alternate origin while Render is unavailable.
3. **Last known-good — internal Cache API:** entries are stored under `https://filtraai.com/__seo-cache-v2/{primary|fallback}/...`. They are considered fresh for 60 seconds and can be served stale for up to 7 days with `Warning: 110`.
4. **503:** only when neither origin answers and there is no integral cached copy.

The retired static export `https://filtra-ai-frontend.filtra-ai.workers.dev` is **not read at runtime**. On 2026-11-11 it served 125 raw URLs, 28 of them `/zh`, and only 97 canonical URLs — 10 fewer than the primary. It remains documented as historical context, not as a fallback.

### Parity guardrail

- The fallback is sanitized to HTTPS `filtraai.com`, without query/hash, trailing slash (except the root), duplicates or `/zh`.
- When a last known-good primary set exists, the fallback must contain **every** URL in that set. Extra URLs are discarded, so the served set is exactly the known canonical set.
- A cold cache has no reference set. In that case the fallback must still contain at least 100 URLs; a truncated export (such as the 97-URL copy) is rejected and the Worker returns `503`.
- `CACHE_VERSION` is `v2`. Bumping it invalidates old cache entries without a zone purge and without touching unrelated paths. The previous `__seo-cache` keys are intentionally ignored.

### Public response headers

`/sitemap.xml` and `/robots.txt` are always served with `cache-control: no-store` so an edge copy cannot outlive a deploy. Diagnostic headers:

- `x-filtra-seo-origin`: `render-primary`, `vercel-fallback`, `generated-robots-fallback`.
- `x-filtra-seo-cache`: `fresh`, `miss`, `stale`, `generated`.
- `x-filtra-seo-version`: cache contract version (`v2`).
- `x-filtra-seo-urls`: sitemap URL count (sitemap only).

## Production routing

The Worker is attached to exact routes for the key file, `/robots.txt`, and `/sitemap.xml`. Do not replace the broad `filtraai.com/*` route or alter the fallback Worker without a separate routing audit; those changes can interrupt the live frontend.

## Deployment and validation

The production Workers are updated through the Cloudflare Workers API. After changing a source, deploy the same contents to its matching Worker (`filtra-indexnow-key` or `filtra-indice-proxy`), then verify the latest deployment/version in Cloudflare.

`filtra-indice-proxy.js` caches public HTML/Markdown pages at the edge for 24 hours and sitemap XML for 60 seconds, with a last-known-good fallback for up to 7 days during transient Render outages. It must never cache requests with cookies, authorization, query strings, or responses marked private/no-store.

CI runs both Worker suites:

```bash
node --test infra/cloudflare/filtra-indexnow-key.test.mjs
node --test infra/cloudflare/filtra-indice-proxy.test.mjs
```

The IndexNow suite executes the Worker in a `vm` context with controlled `fetch`/`caches` and covers the 125 → 97 legacy sanitization, 107-URL parity, divergence rejection, v2 cache isolation, the cold-cache 503 and the IndexNow URL list. It does not depend on the network.

After a deploy, verify production with:

```bash
cd frontend
npm run seo:verify:sitemap-fallback
```

The script compares the primary, Vercel, public edge and retired host sets, and checks the public headers. Public HTTP verification of the domain and confirmation of IndexNow acceptance remain separate checks.
