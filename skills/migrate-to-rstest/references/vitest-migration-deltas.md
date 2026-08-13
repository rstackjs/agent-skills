# Vitest Migration Deltas

Use this reference when the current framework is Vitest.

## Source of truth

Use the official guide for exact field/API mappings:

https://rstest.rs/guide/migration/vitest.md

When local docs are available, prefer the checked-out source, for example `website/docs/en/guide/migration/vitest.mdx`.

## High-signal deltas

- Scripts: `vitest run` / `vitest --run` -> `rstest`; plain Rstest already runs once and exits. Watch mode is `rstest --watch` or `rstest watch`.
- Config imports: `defineConfig` comes from `@rstest/core`; `defineWorkspace` is removed; use the `projects` field.
- Config composition: replace Vitest `mergeConfig` with capability-supported `mergeRstestConfig`; use `mergeProjectConfig` when composing project entries. Do not import shared configuration from `vitest/config` into an Rstest config.
- Projects: use `defineInlineProject({ name, ... })` only when the `dependency-install-gate.md` capability gate allows it; otherwise use plain named objects. Use `defineProject` for top-level project config exports.
- Config shape: remove Vitest's `test` wrapper and inspect every nested field. Move supported fields to the Rstest top level, rename `environment` to `testEnvironment`, fold `environmentOptions` into its object form, and report unsupported fields rather than dropping them silently.
- Mock lifecycle: Vitest `mockReset` maps to Rstest `resetMocks`; `clearMocks` and `restoreMocks` keep their names. Do not confuse `maxConcurrency` inside one file with `pool.maxWorkers` across files.
- Global setup: Rstest calls setup without Vitest's `TestProject` argument. Rewrite uses of `provide`, `inject`, or `onTestsRerun`; use static `env` or deliberately propagated `process.env` values only when equivalent.
- Coverage: add a provider supported by the target version and use `coverage.reporters` (plural). Preserve include/exclude and thresholds exactly; remove Vitest-only provider fields only after reporting that they have no equivalent. Replace `@vitest/coverage-*` only during cleanup after the Rstest scope is green.
- Reporters: replace Vitest-only reporters; import third-party reporter classes instead of passing incompatible names.
- Setup: replace `@testing-library/jest-dom/vitest` with matcher registration via `expect.extend(...)` from `@rstest/core`.
- Globals/APIs: imports from `vitest` -> `@rstest/core`; `vi.<api>` / `vitest.<api>` -> `rs.<api>`. Avoid mixing `vi` and `rs` in a migrated file.
- Mocks: translate `vi.hoisted`, `vi.mocked`, `vi.doMock`, timers, globals, and environment helpers through the installed Rstest API rather than assuming every Vitest helper exists. `rs.mock('./module')` auto-mocking behavior is version-gated; use explicit factories/manual mocks or `{ mock: true }` according to the target capability.
- Async mock factories: Rstest does not support returning an async function when mocking a module value. Migrate Vitest patterns that await the actual module inside the factory to static `importActual` imports plus a synchronous factory.
- CJS mocking: use `rs.mockRequire()` / `rs.doMockRequire()` for `require()` paths.
- Snapshots: preserve existing snapshot bodies and custom serializers. Move `snapshotSerializers` registration into setup via `expect.addSnapshotSerializer`; verify any custom `resolveSnapshotPath` signature against Rstest before reuse.

## Build config

- Rstest uses Rsbuild/Rspack instead of Vite/Rollup. Prefer an Rslib/Rsbuild adapter when the project already has that config. Otherwise translate Vite `define` to `source.define`, test aliases to `resolve.alias`, and dependency inline/external intent to measured `output.bundleDependencies` / `output.externals` behavior.
- Classify aliases before copying them. Preserve semantic source aliases; do not duplicate aliases already inherited from an adapter; remove Vitest/Vite-only resolver workarounds unless Rstest reproduces the failure.
- Do not carry Vite plugins into Rstest. Replace each required capability with an adapter, Rsbuild plugin, or Rstest/SWC behavior. Do not add a React plugin solely because Vitest used `@vitejs/plugin-react`; first verify whether the project's JSX/runtime/style graph already works.
- Treat Vitest dependency inline/external config as intent, not a direct mapping. Rstest bundling can trade compiler work for repeated Node runtime loading; use `dependency-bundling-performance.md` for a measured decision.

## Discovery and mock-graph parity

Compare Vitest and Rstest test manifests with `discovery-parity.md`, including workspace/project entries, include/exclude, CLI project filters, and file-level environment comments. Do not silently expand or shrink scope.

Vitest and Rstest both hoist runtime mocks, but a fully mocked module can still enter Rstest's Rspack build graph. If a heavy mock boundary affects build/runtime cost, use `mocked-module-build-graph.md`; never externalize partial mocks or `importActual` paths.

## Vitest-specific enforcement

1. Delete scope-local `vitest.config.*` and truly legacy `vitest.setup.*` only after the migrated scope is green. If a setup file was rewritten and is still referenced by Rstest `setupFiles`, rename or copy it to a Rstest-owned name such as `rstest.setup.*` before deleting the legacy Vitest-named file. Drop shared `vitest.workspace.*`, root shared config, and `@vitest/*` devDeps only after no scope still uses Vitest.
2. Do not re-record Vitest snapshots just to update headers. Vitest and Rstest snapshot files are byte-compatible below the header line; run `-u` only for expected body diffs.
3. In a partial monorepo migration, keep shared Vitest config and root Vitest dependencies for untouched projects. Copy only the migrated scope's effective settings into an independent Rstest config.
4. Do not carry the Vite mental model into Rstest. Prefer adapters and Rsbuild/Rspack config translations over custom test rewrites.
