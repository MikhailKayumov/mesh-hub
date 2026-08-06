---
description: Print storage quota for a specific organization — disk usage vs subscription plan limit, file counts by type
allowed-tools: Read, Glob, Grep, Bash(cd server && npx ts-node:*), Bash(du:*), Bash(ls:*)
argument-hint: <org-id-or-slug>
---

Show storage quota usage for an org.

Argument: `$ARGUMENTS` — required org ID (UUID) or slug. If omitted, ask.

Workflow:

1. Locate the storage quota service in `server/src/modules/storage-quota/` — verify with Glob that the module exists in current code; if not, fall back to direct repository queries.
2. For the requested org:
   - Resolve org ID from slug if needed
   - Read `org_subscription` plan and storage limit
   - Sum file sizes from the appropriate `IFileStorageStrategy` impl:
     - For `FsFileStorageStrategy`: `du -sb data/files/` filtered by org's owned files (model files for org-owned models, scene assets for org workspaces, embed logos)
     - For `S3FileStorageStrategy`: query the bucket via the S3 SDK (or surface the latest cached metric from `org_subscription`)
3. Compute used vs limit, percentage, and breakdown by category (models, scenes, embed assets).

Output:

```
Org: <name>  (<id>)
Plan: <plan-name>      Limit: <X> GB

Used: <Y> GB (<pct>% of limit)

  Models:    <a> GB  (<n> files)
  Scenes:    <b> GB  (<n> files)
  Embed:     <c> GB  (<n> files)
  Avatars:   <d> GB  (<n> files, billable: org members)
```

If the org is at >90% capacity, flag it. Don't modify any data — read-only command.
