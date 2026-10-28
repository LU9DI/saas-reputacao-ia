# Filtra.AI — SEO indexing runbook

This runbook is for the production publication window. Do not submit URLs before the static export is deployed and the production hostname serves the expected artifact.

## Before publishing

1. Wait for the full GitHub Actions CI to complete successfully, including the static export and `seo:audit` job.
2. Confirm the Cloudflare Pages deployment completed and that production routing points at the intended artifact. A successful Pages upload alone does not prove that `https://filtraai.com` serves that deployment.
3. Check these public endpoints in a browser or with HTTP requests:
   - `https://filtraai.com/robots.txt`
   - `https://filtraai.com/sitemap.xml`
   - `https://filtraai.com/sitemap-index.xml`
   - `https://filtraai.com/`
   - `https://filtraai.com/en`, `/es`, and `/zh`
   - At least one public landing page and one blog article per language.
4. Inspect the returned HTML, not only the rendered browser view. Confirm each indexable page has a self-referencing canonical, useful title and description, and expected language alternates. Confirm private routes carry `noindex`.

## Google Search Console

1. Open the verified Domain property for `filtraai.com`. If no Domain property exists, verify it using the DNS TXT method in Search Console.
2. Open **Sitemaps** and submit `https://filtraai.com/sitemap.xml`.
3. Review the sitemap status and discovered URL count. Resolve fetch/parsing errors before requesting individual indexing.
4. Use **URL inspection** for a small priority set after deployment: homepage, core product/solution pages, free audit page, and representative translated pages.
5. Use **Test live URL** first. If the page is accessible and indexable, request indexing. Requests are rate-limited and do not guarantee inclusion.
6. Review **Page indexing** and **Manual actions / Security issues** reports over subsequent days. Distinguish crawled-not-indexed, duplicate/canonical, blocked, and server errors instead of repeatedly resubmitting the same URL.

## Central sitemap index

`https://filtraai.com/sitemap-index.xml` is the single discovery entry point for the canonical host. It is a `<sitemapindex>` that lists only sitemap files:

- `https://filtraai.com/sitemap.xml` — the main site leaf (same directory).
- `https://filtraai.com/indice/sitemap/0.xml` — the Índice Filtra.AI leaf (below the index).

Rules this artifact must keep satisfying:

1. Every child sitemap must be on the same site as the index. Cross-site submission is not configured, so a child on another host is an error.
2. Every child must be in the same directory as the index or lower in the site hierarchy.
3. List leaves, not nested indexes. `/indice/sitemap-index.xml` is itself a `<sitemapindex>` and is not referenced by the central index.
4. Never list page URLs here. Pages belong to the leaves; duplicating them makes counts unreliable.
5. No `<lastmod>` in the index. Index-level `lastmod` describes the sitemap file, not the pages. The UTF-8 `<lastmod>` that matters lives on each URL inside the leaves.

`frontend/scripts/validate-seo.mjs` fails when the declared shard list diverges from the real Índice URL count (it reads `indice/scripts/audit-indexability.mjs`). Adding a shard means: bump the list in `frontend/src/app/sitemap-index.xml/route.ts`, run `npm run seo:validate`, then resubmit.

`/sitemap.xml` stays a `<urlset>` leaf on purpose. `scripts/submit-indexnow.mjs` and external consumers read that exact URL.

### Precondition before submitting

The Índice app must answer consistently before the index points at it. On 2026-10-28 the same shard alternated between `200` and `502` across consecutive requests (`200, 502, 200, 502, 200`), and `/indice/metodologia`, `/indice/llms.txt`, and `/indice/llms-full.txt` returned `502` with `X-Indice-Origem: render`. Submitting a central index that points at an intermittently failing origin only documents the failure in Search Console. Require at least 20 consecutive `200` responses from `/indice/sitemap/0.xml` before submitting.

### Tracking each group separately

Search Console reports indexing per property, not per sitemap. The Sitemaps report shows read status and discovered URLs, not indexed coverage per file. To isolate the Índice:

- Keep the Domain property for `filtraai.com` and submit the central index there.
- Add a URL-prefix property for `https://filtraai.com/indice` (no trailing slash — the canonical form of the Índice home is `/indice` without a slash) and verify it with the same DNS TXT record.

## Bing Webmaster Tools and IndexNow

1. Verify `filtraai.com` in Bing Webmaster Tools and import the verified Search Console property if offered.
2. Submit `https://filtraai.com/sitemap.xml` in the Sitemaps area.
3. The deployment workflow sends sitemap URLs to IndexNow after the deployment step. The public key file must remain reachable at the exact URL declared by `frontend/scripts/submit-indexnow.mjs`.
4. Treat an accepted IndexNow request as a notification, not proof of crawling or indexing. Check Bing Webmaster Tools for crawl and indexing results.

## Post-deploy smoke checks

- Confirm all sitemap URLs return the intended page (not a generic shell, 404, login, or fallback error).
- Confirm redirects and canonical URLs converge on HTTPS `filtraai.com` and do not point to an obsolete deployment host.
- Confirm the sitemap contains only public, canonical URLs; private dashboard, evaluation, widget, admin, recovery, and test routes must not appear.
- Confirm `robots.txt` does not block pages whose HTML must communicate `noindex`. Blocking crawling can prevent search engines from observing that directive.
- Re-run the CI audit on every material SEO or routing change.

## Priority

- Core: homepage, `/filtra-ai`, `/gestao-de-reputacao-online`, `/avaliacoes-google`, `/reputacao-google`, `/analise-de-avaliacoes-com-ia`, `/feedback-de-clientes`, `/como-melhorar-avaliacoes-google`, `/monitoramento-reputacao-online`, and `/gestao-de-feedback`.
- Next: free audit and industry pages; then related articles and their translations.
- This strategy aims to improve discovery and competitiveness for relevant Top 3/Top 10 queries, but does not promise rankings or immediate indexing.

## Important limitations

Sitemaps and IndexNow help discovery but do not guarantee indexing, ranking, or a timeline. Do not request indexing for URLs that are unavailable, thin, duplicate, or intentionally private. Do not publish until production routing has been verified; the Pages project name alone is not evidence that the main domain serves it. Google Search Console submission and inspection require authorized access to the property and must not be reported as completed without confirmation there.
