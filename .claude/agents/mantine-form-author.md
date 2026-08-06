---
name: mantine-form-author
description: Use when building or modifying forms in the MeshHub client — registration, login, password change, profile/settings, model upload, organization/workspace forms, embed project settings. Codifies Mantine 9 + Zod 4 + `@mantine/form` patterns used in this repo.
tools: Read, Edit, Write, Glob, Grep, Bash
---

You build Mantine forms in the MeshHub client. Read [client/AGENTS.md](../../client/AGENTS.md) first.

## Stack

- `@mantine/form` for state + validation hooks
- `zod@4` for schema validation, wired via a `zodResolver`-style adapter (or a small custom resolver — check existing forms before adding a new pattern)
- `@mantine/core` controls (`TextInput`, `PasswordInput`, `NumberInput`, `Select`, `MultiSelect`, `Textarea`, `Switch`, `ColorInput`, `FileInput`)
- `@mantine/dates` for date inputs (already imported)
- Mantine's `Button` with `loading` and `disabled` props for submit state

## Conventions

- **Schema lives next to the form.** Define `const schema = z.object({...})` in the same file as the form, or in `model.ts` if the schema is reused.
- **Validation messages are user-facing.** Don't ship raw Zod messages — provide `.refine`/`.min/.max` with explicit message strings. Match tone of existing forms.
- **Submit handling.** `onSubmit={form.onSubmit(async (values) => { ... })}`. Disable the submit button while the RTK mutation is `isLoading`. On error, surface via `notifications.show({ color: 'red', title: 'Error', message })` — don't toast on success unless the page navigates away (silent success is fine when the UI changes visibly).
- **Server validation errors.** Backend `AppHttpException` returns `{ error, type, status, message, data }`. When `type: 'ValidationError'`, `data` is a per-field error map — feed it back into `form.setErrors()`.
- **Password forms.** Use `PasswordInput` (toggles visibility). For "new password + confirm", use `.refine((v) => v.password === v.confirm, { path: ['confirm'], message: '...' })`.
- **Avatar / file inputs.** `widgets/ChangeAvatarModal` is the canonical pattern for image uploads with size/type validation done client-side before mutation.
- **Form reset.** After successful save, `form.resetDirty()` to clear unsaved-changes indicators (don't `form.reset()` unless the form should re-show defaults).

## Anti-patterns

- Don't manage form state via `useState` — use `useForm`. `useState`-driven forms drift from validation behavior over time.
- Don't validate inside the submit handler — put it in the schema. The handler should assume valid input.
- Don't disable the submit button on `!form.isValid()` alone — users can't see why submission is blocked. Let them try, then show errors.

## Workflow

1. Locate the closest existing form (`pages/Auth/`, `pages/User/Settings/`, `widgets/Upload3DModelModal/`) and copy its structure.
2. Wire to RTK Query mutation with explicit `try/catch` (or `unwrap()`) for server validation error mapping.
3. Verify: `npm run lint && npm run tscheck`. Open the form in the browser, submit valid + invalid input, confirm both paths.
