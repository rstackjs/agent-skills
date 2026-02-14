# Jest Migration Deltas

Use this reference when Step 1 identifies Jest.

## High-priority checks

1. Translate Jest config (`jest.config.*` or `package.json#jest`) to `rstest.config.ts`.
2. Update scripts from `jest` to `rstest`.
3. Migrate setup files (`setupFiles`, `setupFilesAfterEnv`) to Rstest equivalents.
4. Replace Jest-specific imports/APIs with `@rstest/core` equivalents based on official guide.
5. Validate transform/alias behavior (for example `moduleNameMapper`, transformer-related settings).
6. For global API usage, replace global `jest.<api>` with `rstest.<api>` (see `references/global-api-migration.md`).

## Snapshot deltas to expect

1. Snapshot file header may change from Jest to Rstest format.
2. Snapshot key separators can change. A common Jest key style uses `:`,
   while Rstest snapshots often use hierarchical separators with `>`.
3. Snapshot entry order can change without semantic changes. In large files,
   two keys may swap positions while each key's snapshot body stays identical.

### Updating snapshots with Rstest

Use update mode when snapshot changes are expected:

- Update all snapshots:
  `rstest -u`
- Update a filtered scope (for example overlay-related tests, depending on project script/CLI wiring):
  `rstest -u overlay`
  or
  `rstest overlay -u`

### Example key separator delta

- Before (Jest style):
  `overlay should not show a warning when "client.overlay.warnings" is "false": page html 1`
- After (Rstest style):
  `overlay > should not show a warning when "client.overlay.warnings" is "false" > page html 1`

### Snapshot key anatomy (how to read one key)

For a key like:
`overlay > should not show a warning when "client.overlay.warnings" is "false" > page html 1`

1. `overlay` = suite name (`describe(...)`)
2. `should not show a warning when "client.overlay.warnings" is "false"` = case name (`it(...)` / `test(...)`)
3. `page html` = snapshot label from `.toMatchSnapshot('page html')`
4. `1` = snapshot index for that label in the current test

Implication: many Jest->Rstest diffs are key formatting changes (separator/tokenization) for the same suite/case/snapshot identity.

### Review guidance for migration PRs

1. Treat separator-only key renames as expected migration noise.
2. Distinguish key-order churn from content churn:
   - If only key order changed and snapshot bodies are identical, this is non-functional.
   - If body content changed under the same key, review as behavior change.
3. For noisy snapshot diffs, compare by key+body hash before deciding there is a regression.

## Source of truth

Follow official mapping details:
https://rstest.rs/guide/migration/jest.md

Prefer `.md` URLs for AI-friendly ingestion.

## Removal gate

Remove `jest` and legacy Jest config only after Rstest tests pass.
