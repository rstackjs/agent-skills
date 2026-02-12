---
name: migrate-vitest-to-rstest
description: Migrate or convert Vitest test suites and configs to Rstest. Use when asked to move from Vitest to Rstest, replace `vitest` imports with `@rstest/core`, translate Vitest config to `rstest.config.ts`, or update Vite test config to Rsbuild/Rstest equivalents.
---

# Migrate Vitest to Rstest

## Goal

Migrate Vitest-based tests and configuration to Rstest with minimal behavior changes. Use the reference guide as the source of truth for exact API and config mappings.

## Migration principles (must follow)

1. **Smallest-change-first**: prefer the smallest viable change that restores test pass.
2. **Config before code**: prefer fixing in config/tooling/mocks before touching test logic.
3. **Do not change user source behavior**: avoid modifying production/business source files unless user explicitly requests it.
4. **Avoid bulk test rewrites**: do not refactor entire test suites when a local compatibility patch can solve it.
5. **Preserve test intent**: keep assertions and scenario coverage unchanged unless clearly broken by framework differences.
6. **Defer Vitest removal**: keep `vitest` dependency and `vitest.config.*` during migration; remove them only after Rstest tests pass.

## Workflow

1. Inventory current Vitest usage
2. **Open the official migration guide**
   - Use the Official guide as the source of truth:
     - https://rstest.rs/guide/migration/vitest.md
3. Dependency install gate (blocker check, see `references/dependency-install-gate.md`)
4. Migrate configuration and test files following the guide and reference details (minimal patch scope)
5. Check type errors
6. Run tests and fix deltas (if mocks fail unexpectedly, see `references/provided-exports-troubleshooting.md`)
7. Remove `vitest` dependency and legacy `vitest.config.*` only after Rstest is green
8. Summarize changes

## 1. Inventory current Vitest usage

- Locate Vitest config (`vitest.config.*` or `vite.config.*` with a `test` block) and record the format.
- Capture current test commands and test file patterns (include/exclude or globs).
- Run test suite to verify current behavior.
- List setup files, environment settings, and any globals usage.
- Note any Vite config dependencies that tests rely on (aliases, plugins, or defines).

## 3. Dependency install gate (blocker check)

Before large-scale edits, verify dependencies can be installed and test runner binaries are available.
Detailed checks, blocked-mode output format, and `ni` policy are in:
`references/dependency-install-gate.md`

## Patch scope policy (strict)

### Preferred change order

1. CLI/script/config migration (`package.json`, `rstest.config.ts`, include/exclude, test environment).
2. Mock compatibility adjustments (target module path, `{ mock: true }`, `importActual`).
3. Narrow per-test setup fixes (single-file, single-suite level).
4. As a last resort, test body changes.
5. Never modify runtime source logic by default.

### Red lines

- Do not rewrite many tests in one sweep without first proving config-level fixes are insufficient.
- Do not alter business/runtime behavior to satisfy tests.
- Do not change assertion semantics just to make tests pass.
- Do not broaden migration to unrelated packages in monorepo.
- Do not delete `vitest` dependency or `vitest.config.*` before confirming Rstest tests pass.

### Escalation rule for large edits

If a fix would require either:

- editing many test files, or
- changing user source files,

stop and provide:

1. why minimal fixes failed,
2. proposed large-change options,
3. expected impact/risk per option,
4. recommended option.

## 5. Run tests and fix deltas

- Run the test suite and fix failures iteratively.
- Fix configuration and resolver errors first, then address mocks/timers/snapshots, and touch test logic last.
- If mocks fail for re-exported modules under Rspack, use:
  `references/provided-exports-troubleshooting.md`

## 6. Summarize changes

- Provide a concise change summary and list files touched.
- Call out any remaining manual steps or TODOs.
