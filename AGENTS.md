# Agent guidance

- Read the applicable skill in `.agents/skills/` before changing API contracts, OpenAPI artifacts, authentication, or authorization.
- Preserve tenant isolation, authentication boundaries, rate limits, audit trails, data provenance, and existing API compatibility.
- For endpoints, inspect route handlers, schemas, tests, and OpenAPI ownership before changing behavior. Update the contract and tests together.
- Never log secrets, tokens, personal data, or raw customer content. Use synthetic fixtures for security tests.
- SEO publication and data-indexing changes must preserve source evidence, canonical URLs, sitemap/route consistency, and explicit publication gates.
- Run the narrowest relevant tests and report exact outcomes. Do not deploy or publish generated URLs as part of a code-only change.
- Deploy preference: target a single service when manual deploys are needed, and batch changes into large deploys instead of many small ones. Provider auto-deploys (Render, Vercel) fire on every merge to `main`, so merge PRs in batches.
- Follow `.agents/skills/verification-gates/SKILL.md` for all engineering tasks.
