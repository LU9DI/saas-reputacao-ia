# Independent reputation-data SEO property

This project is a **separate public data/content property**, not a set of extra routes inside the Filtra.AI SaaS. The implementation follows the reference post's layered model:

1. **Product property** — Filtra remains focused on the SaaS, conversion, core product pages and a manageable editorial blog.
2. **Editorial property** — sector guides, comparisons, methodology and case studies, only where there is genuinely distinct material.
3. **Public data property** — scalable pages generated from real, documented, aggregated reputation data. This is the potential long-tail engine; it must not fabricate market averages or publish generic text at scale.

## Current behavior

- The 50 × 10 sector/intent matrix is an **editorial opportunity inventory**, not 500 ready-to-index pages.
- `npm run build` creates an inventory of 500 candidates. It renders HTML and adds a URL to the sitemap **only when a matching data record passes quality gates**.
- Unqualified or missing-data candidates produce no HTML route, and never appear in a sitemap.
- Every indexable page needs source/methodology details, a real period, a minimum cohort of 20 distinct businesses and at least 100 underlying reviews. These thresholds reduce privacy risk and unstable samples; review before changing them.
- The builder outputs sitemap shards of at most 40,000 URLs plus a sitemap index, so growth does not hit the 50,000-URL per-file ceiling.
- `lastmod` comes from the dataset's real `updatedAt`, never the build timestamp.
- The dataset must contain only authorized, aggregated data. Never expose customer records, reviewer text, identifiers, or confidential account metrics.

## Data contract

Populate `data/benchmarks.json` with reviewed records. Each record has:
`sector`, `state`, `sampleBusinesses`, `reviewCount`, `periodStart`, `periodEnd`, `averageRating`, `responseRate`, `topThemes`, `sourceDescription`, `sourceUrl`, `sourceLicense`, `sourceAttribution`, `methodologyUrl`, `updatedAt`. Every public page must display a clickable source, license and attribution; records missing any of these are rejected.

A page is generated only for records with valid state/sector identifiers, non-sensitive aggregated metrics, cohort thresholds, valid dates, and a methodology/source reference. Empty sample data is intentional: the builder should generate zero indexable pages until the source data exists.

## Commands

- `npm run build`: builds candidate inventory, eligible HTML pages, sitemap shards and sitemap index.
- `npm test`: tests the candidate count, uniqueness, quality gates, sitemap sharding and truthful lastmod.

Set `SEO_PROPERTY_ORIGIN` to the actual public property's origin when deploying. This repository folder is isolated from `frontend/`; it does not alter Filtra routes or deploy anything.
