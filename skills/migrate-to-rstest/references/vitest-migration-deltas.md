# Vitest Migration Deltas

Use this reference when the current framework is Vitest.

## Source of truth

Use the official guide for exact field/API mappings:

https://rstest.rs/guide/migration/vitest.md

When local docs are available, prefer the checked-out source, for example `website/docs/en/guide/migration/vitest.mdx`.

## High-signal deltas

- Scripts: `vitest run` / `vitest --run` -> `rstest`; plain Rstest already runs once and exits. Watch mode is `rstest --watch` or `rstest watch`.
- Config imports: `defineConfig` comes from `@rstest/core`; `defineWorkspace` is removed; use the `projects` field.
- Projects: in latest Rstest, use `defineInlineProject({ name, ... })` for object entries inside `projects`; in Rstest 0.8.x, use plain named objects. Use `defineProject` for top-level project config exports.
- Config shape: remove Vitest's `test` wrapper and move fields to the Rstest top level. Map exact fields through the official guide.
- Coverage: replace `@vitest/coverage-*` with Rstest coverage packages and use `coverage.reporters` (plural).
- Reporters: replace Vitest-only reporters; import third-party reporter classes instead of passing incompatible names.
- Setup: replace `@testing-library/jest-dom/vitest` with matcher registration via `expect.extend(...)` from `@rstest/core`.
- Globals/APIs: imports from `vitest` -> `@rstest/core`; `vi.<api>` / `vitest.<api>` -> `rs.<api>`. Avoid mixing `vi` and `rs` in a migrated file.
- Mocks: Rstest `rs.mock('./module')` looks for `__mocks__`; use `{ mock: true }` for auto-mock and `{ spy: true }` to preserve implementations while spying.
- Async mock factories: Rstest does not support returning an async function when mocking a module value. Migrate Vitest patterns that await the actual module inside the factory to static `importActual` imports plus a synchronous factory.
- CJS mocking: use `rs.mockRequire()` / `rs.doMockRequire()` for `require()` paths.

## Build config and version compatibility

- Rstest uses Rsbuild/Rspack instead of Vite/Rollup. Translate Vite `define` to `source.define`, externalization fixes to `output.externals`, and plugins to Rsbuild equivalents where available.
- Prefer `@rstest/adapter-rslib` or `@rstest/adapter-rsbuild` when those configs already exist. Use `@rstest/adapter-rspack` only for Rspack 2.x projects; on Rspack 1.x / Rstest 0.8.x, port the necessary Rspack settings manually.
- Latest Rstest uses Rsbuild/Rspack 2.x; Rstest 0.8.x uses Rsbuild/Rspack 1.x.
- Vite -> Rstest migrations often add `@rsbuild/plugin-*`; choose plugin versions that satisfy the installed `@rsbuild/core` peer range.
- Treat Rsbuild/Rspack/plugin schema or peer errors as dependency skew first, not as a reason to rewrite tests.

## Vitest-specific enforcement

1. Delete scope-local `vitest.config.*` and `vitest.setup.*` only after the migrated scope is green. Drop shared `vitest.workspace.*`, root shared config, and `@vitest/*` devDeps only after no scope still uses Vitest.
2. Do not re-record Vitest snapshots just to update headers. Vitest and Rstest snapshot files are byte-compatible below the header line; run `-u` only for expected body diffs.
3. Do not carry the Vite mental model into Rstest. Prefer adapters and Rsbuild/Rspack config translations over custom test rewrites.
