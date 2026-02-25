# Vitest Migration Deltas

Use this reference when Step 1 identifies Vitest.

## High-priority checks

1. Translate Vitest config (`vitest.config.*` or `vite.config.*` test block) to `rstest.config.ts`.
   - Remove `test: { ... }` nesting in most Vitest configs and move keys to top-level in `defineConfig`.
   - Rename `environment` to `testEnvironment`.
   - Keep `projects` at top-level (`{ projects: [...] }`), not under `test`.
   - Do not assume `mergeConfig` is available from `@rstest/core`; prefer `defineConfig({ ...base, ...overrides })` unless official docs require otherwise.
2. Update scripts from `vitest` to `rstest`.
3. Replace Vitest imports/APIs with `@rstest/core` equivalents based on official guide.
4. Replace imported `vi.<api>` with `rs.<api>` when tests explicitly import APIs from `@rstest/core`.
5. If `globals: true` is enabled, replace global `vi.<api>` with `rs.<api>` and global `vitest.<api>` with `rstest.<api>` (see `references/global-api-migration.md`).
6. Migrate setup adapters that are Vitest-specific (for example `@testing-library/jest-dom/vitest`) to matcher-based setup via `expect.extend`.
7. Watch for path resolution differences in tests/setup (`new URL(..., import.meta.url)` may need `resolve(__dirname, ...)` fallback depending on transform/runtime mode).
8. Re-check mock behavior for re-export modules in Rspack projects if failures appear.
9. Re-check async mock factories: Rstest migration may require sync factory + `importActual` patterns.
10. Validate environment/globals/include-exclude behavior after config migration.

## Source of truth

Follow official mapping details:
https://rstest.rs/guide/migration/vitest.md

Prefer `.md` URLs for AI-friendly ingestion.

## Removal gate

Remove `vitest` and `vitest.config.*` only after Rstest tests pass.
