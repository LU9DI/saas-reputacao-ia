---
name: api-design-principles
description: Design or review Filtra.AI HTTP APIs for consistency, compatibility, validation, error semantics, pagination, and tenant isolation.
---

# API design principles

Use this skill when creating or changing backend routes, request/response schemas, or frontend-to-backend contracts.

## Workflow
1. Inspect the existing route, service, middleware, and client conventions before proposing a new pattern.
2. Keep HTTP handlers thin: parse and validate input, authorize the caller, delegate business logic, and return a stable response.
3. Validate untrusted input at the boundary. Reject malformed identifiers, unsupported enum values, oversized payloads, and invalid pagination explicitly.
4. Preserve existing response shapes unless a migration is planned. Document breaking changes and update all callers and tests in the same change.
5. Use consistent status codes and a predictable error envelope; never expose stack traces, secrets, SQL, provider payloads, or internal paths.
6. Enforce authentication and resource-level authorization on every private endpoint. Derive tenant/customer identity from trusted auth context, never from a client-supplied tenant ID alone.
7. Apply bounded pagination and deterministic ordering to collection endpoints. Avoid unbounded reads.
8. Add tests for success, invalid input, unauthenticated access, cross-tenant access, missing resources, and dependency failures as applicable.

## Review checklist
- [ ] Contract and naming match neighboring endpoints.
- [ ] Input validation and output shape are explicit.
- [ ] AuthN and object-level AuthZ are enforced server-side.
- [ ] Errors do not leak sensitive details.
- [ ] Tests and API documentation are updated.
- [ ] No unrelated refactor or speculative endpoint was introduced.
