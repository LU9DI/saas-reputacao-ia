---
name: auth-implementation-patterns
description: Engineering checklist for identity, session, and permission changes.
---

# Identity and Access Implementation

Source inspiration: https://github.com/sickn33/agentic-awesome-skills/tree/main/skills/auth-implementation-patterns

Apply this checklist when modifying login, logout, session lifecycle, OAuth/OIDC, API credentials, roles, permissions, or customer-specific data access.

- Trace the identity from entry point to the protected operation.
- Check the server-side permission for the specific resource and tenant on every request.
- Validate token/session status, expiry, intended audience, and required claims according to the existing protocol.
- Treat absent or invalid security configuration as a startup or request failure, not as anonymous access.
- Keep credentials out of logs, test output, URLs, and committed fixtures.
- Cover valid access, missing identity, insufficient permission, expired credentials, malformed input, and cross-tenant attempts in tests.
- Preserve documented key rotation and session invalidation behavior.
- Do not remove a security assertion to make CI pass; report any remaining coverage gaps.
