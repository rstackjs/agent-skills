# DOM Dependency Bundling and Peak RSS

Use this reference when a migrated scope runs in `jsdom`, `happy-dom`, or another browser-like test environment and Rstest has materially higher peak RSS or build cost than Jest/Vitest.

## Source of truth

- Rstest output configuration: https://rstest.rs/config/build/output
- Rstest profiling guide: https://rstest.rs/guide/advanced/profiling
- Rspack lazy barrel optimization: https://rspack.rs/guide/optimization/lazy-barrel

## Understand the default

Rstest builds tests with Rsbuild/Rspack before executing them. In browser-like test environments, it bundles all third-party dependencies from `node_modules` by default; the `node` environment externalizes them by default. A migration can therefore increase build-time memory even when test-runtime behavior is unchanged.

Do not confuse a browser-like environment with Rstest browser mode. `output.bundleDependencies: false` can change bundling for `jsdom` or `happy-dom` in non-browser mode. When `browser.enabled` is active, all dependencies remain bundled and that setting is unsupported.

`output.bundleDependencies` was added in Rstest v0.9.5. Apply the dependency/version gate before using it.

## Confirm the bottleneck

Compare equivalent cold runs before editing the config: use the same Node version, test selection, coverage mode, worker count, and cache state. Record peak RSS and wall time for Rstest and the previous runner.

If possible, use `DEBUG=rstest` and inspect whether the build stage or temporary output under `dist/.rstest-temp` is disproportionately large. If the regression is only in test execution, investigate concurrency, environment setup, and leaks instead of changing the bundle strategy.

## Choose a bundling strategy

### Externalize all dependencies

Start here when most dependencies can run directly in Node and the DOM environment does not need them transformed by the bundler:

```ts
import { defineConfig } from '@rstest/core';

export default defineConfig({
  testEnvironment: 'jsdom',
  output: {
    bundleDependencies: false,
  },
});
```

### Externalize by default and bundle exceptions

Use an allowlist when only a few ESM or source-distributed packages still need Rstest/Rspack transformation:

```ts
import { defineConfig } from '@rstest/core';

export default defineConfig({
  testEnvironment: 'jsdom',
  output: {
    bundleDependencies: ['esm-only-package', 'source-package/*'],
  },
});
```

An array sets an externalized baseline and bundles only matching package requests. It does not re-bundle transitive dependencies that are reachable only through an already externalized parent.

### Preserve measured lazy-barrel wins

Treat full externalization as a diagnostic baseline, not an automatic final config. A bundled dependency can benefit from Rspack's default lazy barrel optimization, which skips building unused re-export branches in an eligible barrel file.

Consider adding a package back to the `bundleDependencies` allowlist only when all of these signals are present:

- The relevant entry or barrel file uses ESM, and the test imports a small subset through named exports. CommonJS is unsupported, and `export *` re-exports have limited optimization.
- The relevant barrel path is explicitly side-effect-free through package metadata (`"sideEffects": false`, or a `sideEffects` pattern that does not match it) or `rules[].sideEffects: false`. Merely enabling `optimization.sideEffects` is not enough for lazy barrel's early build skipping.
- The package is large or frequently imported enough that avoiding its unused re-export branches could offset the cost of bundling it.

Do not scan every installed package or attempt to prove an internal Rspack optimization hit by reconstructing the whole module graph. Start from large packages observed in the build output, add one candidate at a time, and compare it with the fully externalized baseline. Keep the package bundled only when the same tests pass and the measured RSS or wall-time tradeoff improves; explicit side-effect metadata makes a package eligible, not automatically beneficial.

### Keep the DOM default and externalize heavy exceptions

Use `output.externals` when most dependencies should stay bundled but a few large packages dominate build memory:

```ts
import { defineConfig } from '@rstest/core';

export default defineConfig({
  testEnvironment: 'jsdom',
  output: {
    externals: ['react', 'lodash'],
  },
});
```

`output.bundleDependencies` sets the baseline; `output.externals` adds per-package exceptions and takes priority when both match.

## Validate each change

After each adjustment:

1. Run the same migrated test scope and confirm behavior, mocks, module resolution, and coverage remain correct.
2. Re-measure peak RSS and wall time under the same conditions.
3. Keep the narrowest configuration that produces a meaningful improvement.

Externalized packages load at runtime instead of being transformed in the bundle. If externalization exposes ESM/CommonJS interop, syntax, alias, or package-condition failures, bundle the affected package or subpath again rather than rewriting tests to mask the issue.
