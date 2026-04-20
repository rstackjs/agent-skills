# Jest Migration Deltas

Use this reference when the current framework is Jest.

## Source of truth

Follow the official migration guide for all Jest → Rstest field/API mapping (config table, CLI option mapping, snapshot format change, `done`/hooks/timeout differences, etc.):

https://rstest.rs/guide/migration/jest.md

## Jest-specific enforcement

1. **Legacy file enumeration for phase (b) of SKILL principle 6.** Scope-local legacy files to delete once the migrated scope is green: `jest.config.*`, `jest.setup.*`, and any companion `jest.*.ts` (for example `jest.global-setup.ts`, `jest.global-teardown.ts`). Shared devDeps to drop only when no other scope still relies on them (final scope only in a partial / mixed-mode migration): `jest`, `ts-jest`, `@types/jest`, `jest-environment-jsdom`, `identity-obj-proxy`.
2. **Defer snapshot re-recording until everything else is green.** Jest's `:` separator in snapshot keys changes to Rstest's `>` (see "Snapshot format" in the official guide), so every snapshot mismatches on the first `rstest` run. Running `rstest -u` too early masks real test failures under formatting noise. Migrate config/API/deps first; run `-u` only when the remaining failures are exclusively key-format mismatches.
