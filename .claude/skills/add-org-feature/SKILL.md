---
name: add-org-feature
description: Use when adding an organization-scoped or workspace-scoped backend feature where every read/write must check member role. Layered on top of `add-backend-feature` — adds the membership/role guard discipline that org-scoped data needs.
---

# Add an org/workspace-scoped feature

Use this skill *together with* [add-backend-feature](../add-backend-feature/SKILL.md) when the new feature operates on data scoped to an organization or workspace. The base skill covers scaffolding; this skill covers the authorization layer.

## Trust model recap

- `organizations.org_member` — `(user_id, organization_id, role)` rows. Roles: `owner` / `admin` / `viewer` (verify against the entity).
- `workspaces.workspace_member` — M:N between `workspace` and `org_member`.
- A user's effective access to org-scoped data: must be a member of the org (any role for read; admin+ for write usually). Workspace-scoped data: must additionally be a workspace member.

## Authorization checks (every endpoint)

For each controller method, the service must:

1. **Resolve the org/workspace** the request operates on. Either from the path (`/organizations/:orgId/...`) or by looking up the parent of the targeted resource (`scene.workspace.organization`).
2. **Verify membership.** Query `org_member` (and `workspace_member` if applicable) for the caller. If no row → `AppHttpException` (403 / `Forbidden`).
3. **Verify role.** If the operation requires admin+, check the role. Don't trust `@Roles(UserRoles.Admin)` for org roles — that decorator gates *system* roles, not org roles.
4. **Enforce on the resource fetch.** When loading the target by ID, `WHERE` clause must include `org_id = :orgId` (or join through workspace). This prevents IDOR via direct ID guesses across orgs.

## Recommended helper

If the codebase has an `OrgAuthorization` service or guard, reuse it. If not, consider adding one:

```ts
// pseudocode
async assertMember(userId: string, orgId: string, minRole?: OrgRole): Promise<OrgMemberEntity> { ... }
```

Then every org-scoped service starts with `await this.orgAuth.assertMember(user.id, orgId, OrgRole.Admin)`.

## Steps (additions to `add-backend-feature`)

1. Decide org-scoped, workspace-scoped, or both.
2. Add `org_id` (or workspace FK) to your entity. Migrate.
3. In every repository query, include the scope filter — never `findOneById` without an org/workspace clause.
4. In every service method, call the membership/role assertion before the action.
5. In every controller method, design the URL so the org/workspace is in the path (`/organizations/:orgId/widgets/:id`) — makes the scope explicit, simplifies the membership check.
6. Add tests (or at minimum manual verification): a member of org A cannot see/modify entities of org B even with a guessed ID.

## Don't

- Don't rely on the JWT cookie alone — it identifies the user, not their org context.
- Don't trust `req.body.orgId` — derive the scope from the URL or a server-side lookup.
- Don't omit the org filter in `find` queries with the rationale "the controller already checked" — defense in depth; one bug in the controller leaks across orgs.
- Don't expose internal IDs of other orgs in error messages (e.g. "Org X owns this resource") — leaks org existence.
