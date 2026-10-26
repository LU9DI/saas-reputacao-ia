# Repository security and hygiene review

Review date: 2026-10-26
Scope: static review of repository manifests, CI workflow configuration, ignore rules, and project structure. This is not a full source-code penetration test.

## Verified findings

### High priority — CI can silently bypass locked dependency installation
The backend and frontend jobs in `.github/workflows/ci.yml` try `npm ci`, then fall back to `npm install` if it fails. That can hide a stale or inconsistent lockfile and resolve a different dependency tree in CI. Prefer a hard failure from `npm ci`, then repair and commit the relevant lockfile in a separate change.

### Medium priority — frontend Node versions are inconsistent
`frontend/package.json` declares Node `22.x`, but the Cloudflare static-export CI job uses Node 20 while the Vercel build job uses Node 22. Align both frontend jobs with the declared runtime and verify the static export.

### Medium priority — monorepo requires per-package dependency auditing
The repository contains root, backend, frontend, indice, and infrastructure package manifests. A single root audit does not establish the status of every package. Audit each lockfile in its own working directory and report production and development dependencies separately.

### Medium priority — root scripts do not describe the complete validation surface
The root `test` and `typecheck` scripts currently delegate only to backend commands. They do not by themselves validate frontend, indice, or infrastructure packages.

## Safe remediation plan

1. Remove CI fallback from `npm ci`; make lockfile inconsistency fail visibly.
2. Align the Cloudflare frontend job to Node 22, matching `frontend/package.json`.
3. Add a documented root-level validation command that runs package-specific checks without hiding failures.
4. Run `npm audit` in each package with its lockfile, then update dependencies in small, tested batches.
5. Check Git history and GitHub secret-scanning alerts separately; this review did not establish that no secret was ever committed.

## Not claimed

- No claim that all dependencies are vulnerability-free.
- No claim that production endpoints were penetration-tested.
- No runtime tests were executed as part of this static review.
