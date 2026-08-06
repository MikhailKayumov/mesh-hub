---
description: Re-initialize the dev database — runs db:init/db:seeds in server/, with optional --hard reset
allowed-tools: Bash(cd server && npm run db:build), Bash(cd server && npm run db:build:hard)
argument-hint: [--hard]
---

Run database initialization for the MeshHub server. Argument: `$ARGUMENTS`.

Behaviour:
- If `$ARGUMENTS` contains `--hard` → run `cd server && npm run db:build:hard` (drops + recreates schemas, runs migrations, then seeds).
- Otherwise → run `cd server && npm run db:build` (creates missing schemas, runs migrations, then seeds).

Before running `--hard`, briefly confirm with the user if there is any chance the database holds state they care about — `--hard` drops all schemas in the configured DB.

After completion, report:
- Migration summary (count run / pending / failed)
- Seed result
- Any errors, with file:line if available
