# Jest Migration Deltas

Use this reference when the current framework is Jest.

## Source of truth

Use the official guide for exact field/API mappings:

https://rstest.rs/guide/migration/jest.md

When local docs are available, prefer the checked-out source, for example `website/docs/en/guide/migration/jest.mdx`.

## High-signal deltas

- Scripts: `jest` -> `rstest`; `--watch` / `--watchAll` -> `rstest --watch`; `--runInBand` -> `--pool.maxWorkers 1`; Jest `-w` means workers, but Rstest `-w` means watch.
- Config: create `rstest.config.ts` with `defineConfig` from `@rstest/core`. Map every important Jest field through the official guide; do not silently drop unknown fields.
- Transforms: remove `preset`, `ts-jest`, and most `transform` config where possible. Rstest uses SWC by default; use `tools.swc`, `output.bundleDependencies`, or an Rsbuild plugin only when the project needs custom behavior.
- Setup: merge Jest `setupFiles` and `setupFilesAfterEnv` into Rstest `setupFiles` because Rstest setup runs after framework registration.
- Globals/APIs: `@jest/globals` -> `@rstest/core`; `jest.<api>` -> `rs.<api>`. If globals remain, set `globals: true` and add `@rstest/core/globals` types.
- Async tests: `done` callback tests are unsupported; convert to Promise or `async` / `await`.
- Hooks: `beforeEach` / `beforeAll` return values are cleanup functions in Rstest. Wrap setup-only arrow expressions in braces when needed.
- Environment: `testEnvironmentOptions` becomes `testEnvironment: { name, options }`; file-level Jest environment comments are recognized during migration, but `@rstest-environment` is native.
- CJS mocking: use `rs.mockRequire()` for code paths using `require()`.
- Coverage: install the matching Rstest provider; Jest `coverageProvider: 'babel'` maps to Rstest `istanbul`, and Jest `coverageProvider: 'v8'` maps to Rstest `v8` with `@rstest/coverage-v8`.

## Version compatibility

- Latest Rstest uses Rsbuild/Rspack 2.x; Rstest 0.8.x uses Rsbuild/Rspack 1.x.
- If replacing `babel-jest`, `ts-jest`, or custom transformers with Rsbuild plugins such as `@rsbuild/plugin-babel`, choose plugin versions that satisfy the installed `@rsbuild/core` peer range.
- Choose `@rstest/adapter-*` versions by peer compatibility with `@rstest/core` and the underlying Rsbuild/Rslib/Rspack version. Treat Rsbuild/Rspack/plugin schema or peer errors as dependency skew first, not test failures.

## Jest-specific enforcement

1. Delete scope-local `jest.config.*`, `jest.setup.*`, and companion `jest.*.ts` only after the migrated scope is green. Drop shared Jest devDeps only after no scope still uses Jest.
2. Defer snapshot re-recording until all non-snapshot failures are fixed. Jest `:` snapshot key separators become Rstest `>`, so early `rstest -u` creates noisy churn.
3. Review snapshot diffs by body, not key churn. Separator-only key renames are formatting; body changes are behavior signals.
