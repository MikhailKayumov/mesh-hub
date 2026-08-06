---
description: Lint client source for upward FSD imports — flags any cross-layer imports that violate `app → pages → widgets → entities → shared`
allowed-tools: Grep, Glob, Read
---

Audit `client/src/` for FSD layer violations.

The rule (from [client/AGENTS.md](../../client/AGENTS.md)): imports must flow `app → pages → widgets → entities → shared`. Reverse imports break the architecture.

Workflow:

For each layer, grep for upward imports:

1. **`shared/` must not import from any higher layer.**
   ```
   Grep in: client/src/shared/**/*.{ts,tsx}
   Pattern: from ['"]@/(app|pages|widgets|entities)/
   ```

2. **`entities/` must not import from `app`, `pages`, `widgets`.**
   ```
   Grep in: client/src/entities/**/*.{ts,tsx}
   Pattern: from ['"]@/(app|pages|widgets)/
   ```

3. **`widgets/` must not import from `pages` or sibling widgets that don't expose a public `index.tsx`.**
   ```
   Grep in: client/src/widgets/**/*.{ts,tsx}
   Pattern: from ['"]@/pages/
   ```
   For sibling-widget imports, the rule is softer — same-layer is allowed if the target has `index.tsx` as public surface. Flag if a widget imports from another widget's internal file (i.e. path beyond `index.tsx`).

4. **`pages/` may import from any lower layer** — no upward check needed; `pages` is upper-most below `app`.

5. **Relative `..` traversal** that would equate to upward imports — flag any `from '../../shared/...'` style chains where they reach from a lower layer up to a higher one.

Output:

```
FSD layer violations: <total count>

shared/:    <n> violations
  - <file:line> imports from <layer>/<...>
entities/:  <n> violations
  - ...
widgets/:   <n> violations
  - ...
```

If no violations: `Clean — no FSD layer violations found.`

This command does not edit anything — read-only audit.
