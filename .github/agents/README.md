# Custom Agents Catalog

This repository includes the following custom GitHub Copilot agents in `.github/agents/`.

| Agent File | Primary Use | Typical Prompt |
| --- | --- | --- |
| `expert-react-frontend-engineer.agent.md` | React 19 + TypeScript frontend implementation and refactoring | "Implement this UI feature in the client using existing FSD patterns and Mantine components." |
| `api-architect.agent.md` | API design and contract planning for backend endpoints | "Design the REST contract for this feature, including DTO shapes and validation rules." |
| `qa-subagent.agent.md` | QA planning, edge-case analysis, and verification checklists | "Build a QA checklist for this change and call out high-risk regressions." |
| `se-security-reviewer.agent.md` | Security-focused review (OWASP, auth/session risks, hardening) | "Review this auth-related change for security issues and propose remediations." |
| `github-actions-expert.agent.md` | GitHub Actions pipeline design and security hardening | "Create a CI workflow for client and server with least-privilege permissions." |
| `frontend-performance-investigator.agent.md` | Frontend runtime performance diagnostics and optimization guidance | "Investigate likely performance bottlenecks in the 3D viewer route." |
| `polyglot-test-generator.agent.md` | Structured multi-phase test generation | "Generate missing tests for this feature across client and server." |
| `specification.agent.md` | Formal specification drafting and updates | "Write a specification for this feature before implementation." |
| `adr-generator.agent.md` | Architectural Decision Records (ADR) creation | "Create an ADR for choosing this storage strategy." |
| `tech-debt-remediation-plan.agent.md` | Technical debt assessment and remediation planning | "Produce a prioritized remediation plan for this module." |
| `se-technical-writer.agent.md` | Developer documentation and technical writing | "Draft/update docs for this endpoint and include usage examples." |

## Quick Start

1. Open Copilot Chat.
2. Select one of the installed agents.
3. Use one of the typical prompts above and adapt it to your task.

## Notes

- These files were sourced from `github/awesome-copilot` and placed in `.github/agents/`.
- Keep files updated by replacing them with the latest raw versions when needed.
