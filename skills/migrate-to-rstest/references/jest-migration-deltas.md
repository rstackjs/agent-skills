# Jest Migration Deltas

Use this reference when the current framework is Jest.

## Source of truth

Use the official guide for exact field/API mappings:

https://rstest.rs/guide/migration/jest.md

When local docs are available, prefer the checked-out source, for example `website/docs/en/guide/migration/jest.mdx`.

## High-signal deltas

- Scripts: `jest` -> `rstest`; `--watch` / `--watchAll` -> `rstest --watch`; `--runInBand` -> `--pool.maxWorkers 1` only when supported, otherwise config `pool.maxWorkers: 1`; Jest `-w` means workers, but Rstest `-w` means watch.
- Config: create `rstest.config.ts` with `defineConfig` from `@rstest/core`. Map every important Jest field through the official guide; do not silently drop unknown fields.
- Transforms: remove `preset`, `ts-jest`, and most `transform` config where possible. Rstest uses SWC by default; use version-supported SWC/output/Rsbuild plugin config only when needed.
- Setup: merge Jest `setupFiles` and `setupFilesAfterEnv` into Rstest `setupFiles` because Rstest setup runs after framework registration.
- Globals/APIs: `@jest/globals` -> `@rstest/core`; `jest.<api>` -> `rs.<api>`. If globals remain, set `globals: true` and add `@rstest/core/globals` types.
- Async tests: `done` callback tests are unsupported; convert to Promise or `async` / `await`.
- Hooks: `beforeEach` / `beforeAll` return values are cleanup functions in Rstest. Wrap setup-only arrow expressions in braces when needed.
- Environment: `testEnvironmentOptions` becomes `testEnvironment: { name, options }`. File-level env comments are latest-only; older targets should split env-specific files into config/projects.
- CJS mocking: use `rs.mockRequire()` for code paths using `require()`.
- Coverage: install a Rstest provider supported by the target version. Jest `babel` maps to Istanbul; Jest `v8` maps to V8 only when the `dependency-install-gate.md` capability gate allows it.

## Classify Jest virtual mocks

Jest's third argument `{ virtual: true }` has no direct Rstest equivalent. Classify each occurrence before adding an alias:

- If the request is genuinely absent at runtime, use the narrow version-supported Rstest virtual-module mechanism or an exact alias/stub, then test discovery and execution.
- If the request resolves through workspace source, package exports, TypeScript paths, or inherited Rsbuild/Rslib aliases, remove `{ virtual: true }` and keep the normal `rs.mock()` / `rs.doMock()`; do not add a redundant alias.
- If resolution is uncertain, ask the migrated config to resolve or run the narrow test first. Treat the resulting resolver error as evidence instead of assuming every Jest virtual mock refers to a nonexistent module.

Recheck dynamic-import and `resetModules` cases because their mock-registration order can differ from statically imported tests.

## Classify resolver and discovery config

Do not mechanically translate every `moduleNameMapper` entry into an Rstest alias. Classify each mapping first:

- Preserve semantic path aliases used by source/build tooling.
- Replace CSS, asset, or module stubs with the narrowest equivalent only when tests rely on the stubbed behavior.
- Treat mappings for workspace exports without build output, ESM transformation, or Jest-only resolver gaps as legacy workarounds. Start Rstest without them and add a mapping only after reproducing a real resolution failure.

After the scope is green, remove temporary aliases one at a time and rerun the affected file plus the full scope. A working alias is not evidence that it is still necessary.

Audit Jest `roots`, `testMatch`/`testRegex`, `testPathIgnorePatterns`, project filters, and CLI selection with `discovery-parity.md`. Rstest defaults can discover valid tests that Jest never ran; preserve or expand that scope only through an explicit, tested decision.

## Jest-specific enforcement

1. Delete scope-local `jest.config.*`, `jest.setup.*`, and companion `jest.*.ts` only after the migrated scope is green. Drop shared Jest devDeps only after no scope still uses Jest.
2. Defer snapshot re-recording until all non-snapshot failures are fixed. Jest `:` snapshot key separators become Rstest `>`, so early `rstest -u` creates noisy churn.
3. Review snapshot diffs by body, not key churn. Separator-only key renames are formatting; body changes are behavior signals.
