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
3. Dependency install gate (blocker check)
4. Migrate configuration and test files following the guide and reference details (minimal patch scope)
5. Check type errors
6. Run tests and fix deltas (apply the `providedExports` checklist below when mocks fail unexpectedly)
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

### Goal

Avoid partial migrations that cannot be validated due to missing dependencies.

### Recommended checks

- Confirm lockfile/package manager context is healthy.
- Install dependencies for the target workspace/package.
- Verify `rstest` executable is resolvable from local dependencies.

### Package manager detection (simplified via `ni`)

Use `ni` as the default install entrypoint to auto-detect the package manager:

```bash
npx @antfu/ni install
```

`ni` chooses the correct manager from project context (lockfile/workspace setup), which keeps migration workflow short and consistent across monorepos.

### Install command policy

- Prefer `npx @antfu/ni install` first.
- In monorepo, still prefer running install/check from the target workspace when possible.
- If `ni` is unavailable or fails for environment reasons, fall back to the repo's native package manager command explicitly.
- Do not mix package managers in one migration attempt unless user explicitly asks.

### If install/check succeeds

- Continue migration normally.

### If install/check fails (blocked mode)

Do **not** continue broad code migration.  
Stop at a minimal safe point and return a blocker report for the user to resolve manually.

Blocked-mode output should include:

1. Exact failed command(s).
2. Error class (network/auth/registry/peer conflict/lockfile mismatch/permission).
3. Concrete next command(s) for the user to run.
4. Whether any files were already changed.
5. Resume point: "after dependencies are installed, continue from Step 4".
6. Install strategy used (`ni` or explicit manager fallback).

### Monorepo guidance

- Prefer workspace-scoped install/check first (target package), then root if needed.
- Avoid changing unrelated packages while blocked.
- If root install is required but unavailable, limit edits to docs or planning notes only.

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
- If mocks fail for re-exported modules under Rspack, use the **ProvidedExports Troubleshooting** section below before rewriting lots of tests.

## ProvidedExports Troubleshooting (Rspack + Mock-heavy tests)

This is a high-frequency migration pitfall and should be checked early.

### When to suspect this

- Test imports and mocks a re-export module (for example `foo-dom` re-exporting from `foo-core`).
- Mock appears to be ignored after migration.
- Failures are concentrated in module-mock tests, especially with `rs.mock('re-export-module', ...)`.
- Runtime behavior suggests code is resolved from source module, not the re-export module.

### Why it happens

Rspack may optimize re-exports with `optimization.providedExports`.  
After optimization, runtime can bypass the re-export layer, so your mock target no longer matches what is actually executed.

### Migration-safe handling order (do this in order)

1. Temporarily disable `providedExports` to stabilize migration.
2. Migrate tests until green.
3. Re-enable `providedExports` and re-run tests.
4. If failures come back, either:
   - keep `providedExports: false` temporarily, or
   - change mocks to the actual resolved source module.

### Temporary config snippet

```ts
export default defineConfig({
  tools: {
    rspack: {
      optimization: {
        providedExports: false,
      },
    },
  },
});
```

### Mock target adjustment example

If code imports from `react-router-dom` but runtime resolves to `react-router`, mock `react-router`:

```ts
rs.mock('react-router', () => ({
  useParams: () => ({ id: 'mocked-id' }),
}));
```

### Documentation expectation in migration summary

If this workaround is used, explicitly record:

- where `providedExports` was changed,
- whether the change is temporary or permanent,
- which tests/modules still rely on it,
- next cleanup action (re-enable and retest scope).

## 6. Summarize changes

- Provide a concise change summary and list files touched.
- Call out any remaining manual steps or TODOs.
