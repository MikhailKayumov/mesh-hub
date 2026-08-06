---
description: Audit and (optionally) clean orphaned files in server/files/ — temp uploads, files referenced by deleted DB rows, etc.
allowed-tools: Read, Glob, Bash(ls:*), Bash(find:*), Bash(stat:*), Bash(rm:*), Bash(du:*)
argument-hint: [--apply]
---

Audit orphaned files under `server/files/` (or `data/files/` in Docker production layout).

Argument: `$ARGUMENTS` — `--apply` to actually delete; without it, run in dry-run mode and only print what would be deleted.

Workflow:

1. **Temp directory**: list files in `server/files/models-3d/temp/` older than 1 hour — these are abandoned multer uploads.
2. **Avatars**: list files in `server/files/avatars/` whose filename (without extension) doesn't match any `users.user_meta.avatar` reference in the DB.
3. **Model files**: walk `server/files/models-3d/<modelId>/`. For each `<modelId>` directory:
   - If no `model_3d.id = <modelId>` (or `deleted_at IS NOT NULL` AND older than retention) → orphan
4. **Scene files**: walk `server/files/scenes/<sceneId>/`. Same logic against `scene` table.
5. **Embed logos**: walk `server/files/embed/logos/`. Match against `embed_project.logo_path`.

For each candidate, print: path, size, age, why it's flagged.

Output summary:
- Count of orphans by category
- Total reclaimable bytes
- Sample of file paths (first 10 per category)

In `--apply` mode:
- **Confirm with the user before deletion.** Show the summary, then ask for explicit go-ahead. Do not bypass — files in `data/` are user-generated content.
- After deletion, print actual freed bytes.

In dry-run mode (default), end with: `Run with --apply to delete these files.`

Hard rules:
- Don't delete the `temp/` directory itself, only its contents.
- Don't touch `.git`, `.log`, or any non-`files/` directories.
- If S3 storage is configured for any org, do not attempt to clean S3 — only local FS. Mention S3 cleanup is out of scope and suggest an admin tool.
- If any DB query fails, abort — don't delete based on a partial picture.
