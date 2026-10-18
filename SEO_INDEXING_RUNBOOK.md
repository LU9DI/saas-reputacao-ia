# Filtra.AI — SEO indexing runbook

This runbook is for the production publication window. Do not submit URLs before the static export is deployed and the production hostname serves the expected artifact.

## Before publishing

1. Wait for the full GitHub Actions CI to complete successfully, including the static export and `seo:audit` job.
2. Confirm the Cloudflare Pages deployment completed and that production routing points at the intended artifact. A successful Pages upload alone does not prove that `https://filtraai.com` serves that deployment.
3. Check these public endpoints in a browser or with HTTP requests:
   - `https://filtraai.com/robots.txt`
   - `https://filtraai.com/sitemap.xml`
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

## Bing Webmaster Tools and IndexNow

1. Verify `filtraai.com` in Bing Webmaster Tools and import the verified Search Console property if offered.
2. Submit `https://filtraai.com/sitemap.xml` in the Sitemaps area.
3. The deployment workflow sends sitemap URLs to IndexNow after the deployment step. The public key file must remain reachable at the exact URL declared by `frontend/scripts/submit-indexnow.mjs`.
4. Treat an accepted IndexNow request as a notification, not proof of crawling or indexing. Check Bing Webmaster Tools for crawl and indexing results.

## Post-deploy smoke checks

- Confirm all sitemap URLs return the intended page (not a generic shell, 404, login, or fallback error).
- Confirm redirects and canonical URLs converge on HTTPS `filtraai.com` and do not point to an obsolete deployment host.
- Confirm the sitemap contains only public, canonical URLs; private dashboard, Dot (`/dot`), evaluation, widget, admin, recovery, and test routes must not appear.
- Confirm `robots.txt` does not block pages whose HTML must communicate `noindex`. Blocking crawling can prevent search engines from observing that directive.
- Re-run the CI audit on every material SEO or routing change.

## Priority

- Core: homepage, `/filtra-ai`, `/gestao-de-reputacao-online`, `/avaliacoes-google`, `/reputacao-google`, `/analise-de-avaliacoes-com-ia`, `/feedback-de-clientes`, `/como-melhorar-avaliacoes-google`, `/monitoramento-reputacao-online`, and `/gestao-de-feedback`.
- Next: free audit and industry pages; then related articles and their translations.
- This strategy aims to improve discovery and competitiveness for relevant Top 3/Top 10 queries, but does not promise rankings or immediate indexing.

## Important limitations

Sitemaps and IndexNow help discovery but do not guarantee indexing, ranking, or a timeline. Do not request indexing for URLs that are unavailable, thin, duplicate, or intentionally private. Do not publish until production routing has been verified; the Pages project name alone is not evidence that the main domain serves it. Google Search Console submission and inspection require authorized access to the property and must not be reported as completed without confirmation there.
