---
name: verification-gates
description: Plan small changes, define acceptance checks, and report verifiable evidence of completion.
---

# Verification Gates

Use for implementation, bug fixes, refactors, security work, data pipelines, and releases.

1. Define observable acceptance criteria before editing.
2. Inspect the relevant source, tests, and project instructions.
3. Make narrow changes and preserve existing contracts unless a change is requested.
4. Add regression tests for the bug or behavior.
5. Run targeted checks, then required broader validation when practical.
6. Report exact checks and separate passed, failed, skipped, and not-run items.
7. Never bypass failures by disabling checks, weakening assertions, or hiding errors.
8. Do not claim deployment or production readiness from unit tests alone.
9. Ask for authorization before destructive, external, or production side effects.
10. List unresolved assumptions and blockers.
