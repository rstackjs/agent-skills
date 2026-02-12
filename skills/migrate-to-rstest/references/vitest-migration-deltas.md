# Vitest Migration Deltas

Use this reference when Step 1 identifies Vitest.

## High-priority checks

1. Translate Vitest config (`vitest.config.*` or `vite.config.*` test block) to `rstest.config.ts`.
2. Update scripts from `vitest` to `rstest`.
3. Replace Vitest imports/APIs with `@rstest/core` equivalents based on official guide.
4. If `globals: true` is enabled, replace global `vi.xxx` and `vitest.xxx` with `rstest.xxx` (see `references/global-api-migration.md`).
5. Validate environment/globals/include-exclude behavior after config migration.
6. Re-check mock behavior for re-export modules in Rspack projects if failures appear.

## Source of truth

Follow official mapping details:
https://rstest.rs/guide/migration/vitest.md

Prefer `.md` URLs for AI-friendly ingestion.

## Removal gate

Remove `vitest` and `vitest.config.*` only after Rstest tests pass.
