---
description: Summarise progress on the active iteration plan. Auto-detects the plan folder; pass --dir <path> to override
allowed-tools: Read, Glob, Bash(git log:*), Bash(git status), Bash(git branch:*)
argument-hint: [N] [--dir <path>]
---

Show progress on the active iteration plan. Plan-folder-agnostic — works with whatever planning folder this project currently has.

Argument: `$ARGUMENTS` — optional iteration number and/or `--dir <path>`. Examples:
- empty → show the index from the auto-detected plan folder + the most recently touched iteration
- `3` → focus on iteration 3
- `--dir plan` → override auto-detection
- `3 --dir roadmap` → both

## Plan folder discovery

Resolve the plan folder in this order:

1. If `--dir <path>` is in `$ARGUMENTS`, use it.
2. Otherwise check the repo root for first existing folder of: `current-working-plan/`, `plan/`, `planning/`, `roadmap/`.
3. Otherwise `Glob` for `*/ITER-*.md`, `*/STEP-*.md`, `*/PHASE-*.md` and take the first matching parent directory.
4. If nothing is found, abort with a short message asking the user to point at the plan folder.

## Workflow

1. Read the index file in the resolved folder (`README.md` or `INDEX.md`).
2. If a specific iteration was requested in `$ARGUMENTS`, read `<plan-folder>/ITER-<N>.md` (or `STEP-<N>.md` / `PHASE-<N>.md` — match the actual filename pattern in the folder). Summarise: title, planned steps, what's marked done in-file.
3. Cross-check against `git log --oneline -10` on the current branch and `git log --oneline -- <plan-folder>/` to spot which steps appear shipped vs. still pending.
4. Report:
   - Resolved plan folder path
   - Current branch
   - Last 5 commits
   - Per-iteration status as recorded in the plan
   - Any inconsistency between plan-stated status and what's in code/commits

Stay concise — under 300 words. This is a status read, not a plan rewrite.
