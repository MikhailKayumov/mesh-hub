# MeshHub Copilot Instructions (Repository-Wide)

These instructions apply to the whole repository.
Path-specific instructions in [instructions](instructions) are applied automatically when file paths match their `applyTo` patterns.

## Core Project Rules

- Follow architecture and conventions from [AGENTS.md](../AGENTS.md), [server/AGENTS.md](../server/AGENTS.md), and [client/AGENTS.md](../client/AGENTS.md).
- Do not create a second RTK Query `createApi` instance in client code.
- Do not bypass backend conventions (repositories, mappers, DTO validation, AppHttpException usage).
- Keep frontend imports aligned with FSD direction: app -> pages -> widgets -> entities -> shared.
- Prefer minimal, scoped changes; do not refactor unrelated code.
- When API contracts change, update client DTOs in [client/src/app/api/dto.ts](../client/src/app/api/dto.ts).
- Keep docs in sync for meaningful behavior changes in [client/docs](../client/docs) and [server/docs](../server/docs).

## Path-Specific Instruction Set

For files matching each instruction's `applyTo`, use the linked guidance in addition to this file:

- [nestjs.instructions.md](instructions/nestjs.instructions.md)
- [nodejs-javascript-vitest.instructions.md](instructions/nodejs-javascript-vitest.instructions.md)
- [playwright-typescript.instructions.md](instructions/playwright-typescript.instructions.md)
- [security-and-owasp.instructions.md](instructions/security-and-owasp.instructions.md)
- [performance-optimization.instructions.md](instructions/performance-optimization.instructions.md)
- [github-actions-ci-cd-best-practices.instructions.md](instructions/github-actions-ci-cd-best-practices.instructions.md)
- [containerization-docker-best-practices.instructions.md](instructions/containerization-docker-best-practices.instructions.md)
- [update-docs-on-code-change.instructions.md](instructions/update-docs-on-code-change.instructions.md)
- [markdown-gfm.instructions.md](instructions/markdown-gfm.instructions.md)
- [code-review-generic.instructions.md](instructions/code-review-generic.instructions.md)
- [instructions.instructions.md](instructions/instructions.instructions.md)

## Skill Index

Project skills are listed in [skills/README.md](skills/README.md).

Use these directly in chat with `/skill-name`:

- [codeql](skills/codeql/SKILL.md)
- [create-implementation-plan](skills/create-implementation-plan/SKILL.md)
- [create-specification](skills/create-specification/SKILL.md)
- [dependabot](skills/dependabot/SKILL.md)
- [documentation-writer](skills/documentation-writer/SKILL.md)
- [gh-cli](skills/gh-cli/SKILL.md)
- [multi-stage-dockerfile](skills/multi-stage-dockerfile/SKILL.md)
- [polyglot-test-agent](skills/polyglot-test-agent/SKILL.md)
- [premium-frontend-ui](skills/premium-frontend-ui/SKILL.md)
- [security-review](skills/security-review/SKILL.md)
- [update-implementation-plan](skills/update-implementation-plan/SKILL.md)
- [webapp-testing](skills/webapp-testing/SKILL.md)

## Priority

- Repository-wide rules from this file are the baseline.
- If a path-specific instruction is more specific for the current file type, follow the path-specific instruction.
- If guidance conflicts, prioritize project AGENTS files and existing codebase conventions.
