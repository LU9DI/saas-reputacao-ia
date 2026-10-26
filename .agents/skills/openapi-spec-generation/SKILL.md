---
name: openapi-spec-generation
description: Create or update OpenAPI documentation for Filtra.AI backend endpoints and verify it against implementation and tests.
---

# OpenAPI spec generation

Use when an API endpoint is added, changed, deprecated, or needs a client-facing contract.

## Workflow
1. Locate the current OpenAPI file or API documentation convention. If none exists, propose a minimal, version-controlled spec before adding a new toolchain.
2. Inspect the actual Express routes, middleware, schemas, and response behavior. Treat implementation and tests as evidence; do not invent endpoints.
3. Describe path/query parameters, request bodies, response schemas, authentication requirements, common errors, and pagination.
4. Mark required versus optional fields accurately and include useful examples without real customer data, credentials, or production identifiers.
5. Keep security-sensitive endpoints explicit about authorization. Do not document a bearer token as sufficient for tenant/resource authorization.
6. Update the spec and relevant tests together. If a validator already exists, run it; otherwise provide reproducible validation instructions without claiming validation occurred.
7. Flag any mismatch between implementation and intended contract rather than silently changing runtime behavior.

## Completion report
List files changed, endpoints covered, validation command and actual result, and known gaps.
