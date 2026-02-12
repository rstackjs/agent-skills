# Jest Migration Deltas

Use this reference when Step 1 identifies Jest.

## High-priority checks

1. Translate Jest config (`jest.config.*` or `package.json#jest`) to `rstest.config.ts`.
2. Update scripts from `jest` to `rstest`.
3. Migrate setup files (`setupFiles`, `setupFilesAfterEnv`) to Rstest equivalents.
4. Replace Jest-specific imports/APIs with `@rstest/core` equivalents based on official guide.
5. Validate transform/alias behavior (for example `moduleNameMapper`, transformer-related settings).

## Source of truth

Follow official mapping details:
https://rstest.rs/guide/migration/jest.md

Prefer `.md` URLs for AI-friendly ingestion.

## Removal gate

Remove `jest` and legacy Jest config only after Rstest tests pass.
