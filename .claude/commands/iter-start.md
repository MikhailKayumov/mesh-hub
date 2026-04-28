---
description: Switch focus to a specific iteration plan, summarise scope, and produce an actionable todo list. Auto-detects the plan folder
allowed-tools: Read, Glob, Grep, Bash(git status), Bash(git log:*), Bash(git branch:*)
argument-hint: <N> [--dir <path>]
---

Start (or resume) work on a specific iteration. Plan-folder-agnostic — works with whatever planning folder this project currently has.

Argument: `$ARGUMENTS` — required iteration number, plus optional `--dir <path>`. Examples:
- `3` → iteration 3, auto-detect plan folder
- `3 --dir plan` → iteration 3 in `plan/`

If no iteration number is given, list available iterations from the resolved plan folder and ask.

## Plan folder discovery

Resolve the plan folder in this order:

1. If `--dir <path>` is in `$ARGUMENTS`, use it.
2. Otherwise check the repo root for first existing folder of: `current-working-plan/`, `plan/`, `planning/`, `roadmap/`.
3. Otherwise `Glob` for `*/ITER-*.md`, `*/STEP-*.md`, `*/PHASE-*.md` and take the first matching parent directory.
4. If nothing is found, abort and ask the user to point at the plan folder.

## Workflow

1. In the resolved plan folder, read `ITER-<N>.md` (or `STEP-<N>.md` / `PHASE-<N>.md` — match the folder's filename pattern). If the file doesn't exist, list what's available and ask.
2. Cross-check status against:
   - Current branch (`git branch --show-current`)
   - Recent commits (`git log --oneline -15`)
   - Glob/Grep for files the plan introduces (entities, modules, widgets, panels, viewer classes)
3. Categorise each plan step as ✅ done / 🔶 partial / ⏳ pending based on actual code, not commit messages alone.
4. Produce an action list:
   - Resolved plan folder + iteration title + current branch
   - Per-step status
   - **Next 3–5 actions** in dependency order, each annotated with the suggested agent (`nestjs-backend`, `fsd-frontend`, `threejs-engineer`, `scene-editor-engineer`, `model-display-engineer`, `embed-engineer`, `migration-author`, etc.)
   - Open questions / risks

Stay under 400 words. This is the first step of a session; be concise so the user can act on it.

Don't modify the plan file or any code. This command only reads and reports.
