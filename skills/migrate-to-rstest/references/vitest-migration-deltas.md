# Vitest Migration Deltas

Use this reference when the current framework is Vitest.

## Source of truth

Follow the official migration guide for all Vitest → Rstest field/API mapping (config table, CLI option mapping, setup adapter rewrite, mock-async pattern, path-resolution caveat, `mergeConfig` substitute, etc.):

https://rstest.rs/guide/migration/vitest.md

## Vitest-specific enforcement

1. **Legacy file enumeration for phase (b) of SKILL principle 6.** Once Rstest is green, delete: `vitest.config.*`, `vitest.workspace.*`, `vitest.setup.*` (rename `vitest.setup.*` → `rstest.setup.*` only when the file is genuinely reused). Remove from `devDependencies` the ones that actually appear: `vitest`, `@vitest/coverage-v8`, and any other `@vitest/*` packages.
2. **Do not re-record Vitest snapshots.** Vitest and Rstest snapshot files are byte-compatible below the header line (see the "Snapshots" section in the official guide). Running `rstest -u` during a Vitest → Rstest migration rewrites every snapshot file's first line with zero behavioural change and floods the migration diff. Only run `-u` when a snapshot test is actually failing and the body diff is expected.
