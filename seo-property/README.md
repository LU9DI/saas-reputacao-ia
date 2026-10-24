# Independent SEO property engine

Standalone static-site generator, isolated from Filtra.AI's Next.js app. It generates a **500-URL candidate corpus** (50 sectors × 10 intents) and never modifies Filtra routes, its sitemap, or its deployment.

## Commands
- `npm run build`: generates HTML files under `dist/`, an inventory, and a sitemap containing approved URLs only.
- `npm test`: verifies the candidate count, unique paths, default noindex behavior, and sitemap approval gate.

Set `SEO_PROPERTY_ORIGIN` to the independent domain before deployment. Without it, the generator uses a reserved `.invalid` domain and should not be deployed.

Every generated page is `noindex,follow` unless its exact path is listed in `data/approved-urls.json`. Only approved paths enter the sitemap. Approval should require editorial review, meaningful sector-specific information, evidence review for factual claims, and a useful reader outcome. Generated content is a draft scaffold, not 500 finished articles.

URL pattern: `/{sector}/{intent}/`, e.g. `/restaurantes/avaliacoes/` or `/oficinas-mecanicas/precos/`.

This folder is not imported by `frontend/` and has no dependency on Filtra's runtime, routes, backend, or production deployment.
