---
name: auth-implementation-patterns
description: Implement or review authentication, authorization, sessions, JWT handling, and tenant boundaries in Filtra.AI.
---

# Authentication implementation patterns

Use for changes involving login, registration, JWT/session handling, middleware, account ownership, admin access, or protected routes.

## Mandatory safeguards
1. Trace the existing authentication flow end to end before editing; do not introduce a second competing auth mechanism.
2. Verify tokens server-side, enforce expiry and intended claims, and keep signing secrets in environment/secret storage. Never log tokens or credentials.
3. Separate authentication from authorization. Check role and resource ownership on the server for every protected operation.
4. Prevent insecure direct object references: a valid user must not access another customer's reports, reviews, integrations, billing records, or settings by changing an ID.
5. Use least privilege for admin and service credentials. Do not infer admin status from client-controlled fields.
6. Avoid account enumeration and unsafe password reset flows. Follow the repository's established password hashing and rate-limit controls.
7. Fail closed if identity, role, tenant, or required configuration is missing or invalid.
8. Add regression tests for expired/invalid tokens, role boundaries, cross-tenant reads/writes, and unauthenticated requests.
9. Do not rotate production secrets, alter live accounts, or weaken existing controls as part of a code change.

## Before completion
Run the narrowest relevant tests and type checks available. Report what ran, what failed, and what remains unverified.
