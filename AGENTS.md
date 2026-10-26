# Repository agent guidance

Before changing backend routes or API contracts, read the relevant skill under `.agents/skills/`:
- API shape, validation, errors, and tenant boundaries: `.agents/skills/api-design-principles/SKILL.md`
- OpenAPI documentation: `.agents/skills/openapi-spec-generation/SKILL.md`
- Login, tokens, roles, authorization, and ownership: `.agents/skills/auth-implementation-patterns/SKILL.md`

Use only the skill relevant to the task. Inspect existing implementation and tests first. Do not claim checks were run unless they were executed, and do not weaken security controls to satisfy tests.
