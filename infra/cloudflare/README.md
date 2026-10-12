# Cloudflare SEO / IndexNow Worker

Source of truth for the Worker named `filtra-indexnow-key`.

## Responsibilities

- Serves the IndexNow verification key at `/a3d7f1c94b2e6a805d1f7c3b9e4a6d82.txt`.
- Serves `/robots.txt` with the private application paths disallowed and the canonical sitemap URL.
- Serves `/sitemap.xml` from the curated URL list in the Worker.
- On a **GET** to the key file, submits the URL list to IndexNow asynchronously. A successful HTTP response from the key route is not proof that IndexNow accepted the submission.

## Production routing

The Worker is attached to exact routes for the key file, `/robots.txt`, and `/sitemap.xml`. Do not replace the broad `filtraai.com/*` route or alter the fallback Worker without a separate routing audit; those changes can interrupt the live frontend.

## Deployment and validation

The production Worker is updated through the Cloudflare Workers API. After changing this source, deploy the same contents to the Worker named `filtra-indexnow-key`, then verify its latest deployment/version in Cloudflare. Public HTTP verification of the domain and confirmation of IndexNow acceptance remain separate checks.

Keep this file synchronized with the deployed Worker. The frontend Pages deployment is a separate process managed by `.github/workflows/deploy-cloudflare.yml`.
