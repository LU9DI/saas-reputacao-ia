# Cloudflare SEO / Índice / IndexNow Workers

Sources of truth for the production Workers `filtra-indexnow-key` (`filtra-indexnow-key.js`) and `filtra-indice-proxy` (`filtra-indice-proxy.js`).

## Responsibilities

- Serves the IndexNow verification key at `/a3d7f1c94b2e6a805d1f7c3b9e4a6d82.txt`.
- Proxies `/robots.txt` and `/sitemap.xml` from the canonical Vercel project origin (`https://saas-reputacao-ia.vercel.app`) so metadata is generated from the same source as the frontend.
- On a **GET** to the key file, reads the canonical sitemap and submits its valid, non-`/zh` URLs to IndexNow asynchronously. A successful HTTP response from the key route is not proof that IndexNow accepted the submission.
- Does not maintain a second, hard-coded list of SEO routes. If the canonical origin is unavailable, the Worker returns `503` rather than serving stale SEO metadata.

## Production routing

The Worker is attached to exact routes for the key file, `/robots.txt`, and `/sitemap.xml`. Do not replace the broad `filtraai.com/*` route or alter the fallback Worker without a separate routing audit; those changes can interrupt the live frontend.

## Deployment and validation

The production Workers are updated through the Cloudflare Workers API. After changing a source, deploy the same contents to its matching Worker (`filtra-indexnow-key` or `filtra-indice-proxy`), then verify the latest deployment/version in Cloudflare. `filtra-indice-proxy.js` retries transient failures for sitemap requests and keeps a last-known-good sitemap in the Worker Cache API for temporary Render outages; it must never cache authenticated or query-string sitemap requests. The Node tests for retry and stale-cache behavior run in CI. Public HTTP verification of the domain and confirmation of IndexNow acceptance remain separate checks.

The canonical sitemap and robots source is the deployed frontend on Vercel. The main site itself is served by the Render frontend runtime, and there is no Cloudflare Pages deployment; the exact-route Worker responses depend only on the Vercel origin.
