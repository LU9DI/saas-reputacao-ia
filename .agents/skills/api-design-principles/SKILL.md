---
name: api-design-principles
description: Design and review consistent, versionable, secure REST and GraphQL API contracts.
---

# API Design Principles

Source inspiration: https://github.com/sickn33/agentic-awesome-skills/tree/main/skills/api-design-principles

Use when adding or changing public/internal endpoints, request/response schemas, pagination, error contracts, versioning, authentication boundaries, or rate limits.

## Workflow
1. Inspect existing route conventions and consumers before designing a new shape.
2. Prefer resource-oriented paths, consistent HTTP methods/status codes, explicit request/response schemas, and stable error formats.
3. Define authorization, tenant scope, validation, pagination limits, idempotency, and rate-limit behavior explicitly.
4. Preserve backwards compatibility unless a versioned or intentionally breaking change is approved.
5. Update relevant tests and API documentation in the same change.
6. Check edge cases: missing fields, invalid types, oversized input, unauthorized access, unknown resources, duplicate requests, and dependency failures.
7. Do not invent an OpenAPI source of truth; inspect whether the repo is spec-first, code-first, or hybrid.
8. Report which contract checks and tests were run.
