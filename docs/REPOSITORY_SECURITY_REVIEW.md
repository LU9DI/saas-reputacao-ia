# Repository security and hygiene review

Review date: 2026-10-26
Scope: static review of repository manifests, CI workflow configuration, ignore rules, and project structure. This is not a full source-code penetration test.

## Verified findings

### High priority — CI can silently bypass locked dependency installation
The backend and frontend jobs previously fell back from `npm ci` to `npm install`, hiding lockfile drift and allowing non-reproducible dependency resolution. This PR removes those fallbacks so lockfile problems fail visibly. The Cloudflare static-export job is also aligned to Node 22 to match `frontend/package.json`.

### Medium priority — frontend Node versions are inconsistent
`frontend/package.json` declares Node `22.x`, but the Cloudflare static-export CI job uses Node 20 while the Vercel build job uses Node 22. Align both frontend jobs with the declared runtime and verify the static export.

### Medium priority — monorepo requires per-package dependency auditing
The repository contains root, backend, frontend, indice, and infrastructure package manifests. A single root audit does not establish the status of every package. Audit each lockfile in its own working directory and report production and development dependencies separately.

### Medium priority — root scripts do not describe the complete validation surface
The root `test` and `typecheck` scripts currently delegate only to backend commands. They do not by themselves validate frontend, indice, or infrastructure packages.

## Safe remediation plan

1. **Applied in this PR:** remove CI fallback from `npm ci` and align Cloudflare frontend CI to Node 22.
2. Add a documented root-level validation command that runs package-specific checks without hiding failures.
3. The new dependency-audit workflow passed for root, backend, frontend, and indice: `npm audit` reported zero vulnerabilities in each package on this run. Re-run it on future dependency changes.
4. Check Git history and GitHub secret-scanning alerts separately; this review did not establish that no secret was ever committed.

## Not claimed

- No claim that all dependencies are vulnerability-free.
- No claim that production endpoints were penetration-tested.
- No runtime tests were executed as part of this static review.
