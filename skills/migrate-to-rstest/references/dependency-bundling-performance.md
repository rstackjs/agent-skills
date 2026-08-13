# Dependency Bundling Performance

Use this reference when a migrated Node, `jsdom`, or `happy-dom` scope has high build cost, test-runtime startup cost, or peak memory that may depend on `node_modules` bundling. Browser mode always bundles dependencies and does not support this tuning path.

## Source of truth

- Rstest output configuration: https://rstest.rs/config/build/output
- Rstest profiling: https://rstest.rs/guide/debug/profiling
- Rspack lazy barrel: https://rspack.rs/guide/optimization/lazy-barrel

Check the installed Rstest version and types before using `output.bundleDependencies`; it was added in v0.9.5.

## Understand both sides of the tradeoff

Rstest builds test entries with Rsbuild/Rspack before execution:

- `node` externalizes third-party dependencies by default.
- Browser-like non-browser environments such as `jsdom` and `happy-dom` bundle third-party dependencies by default.
- Browser mode always bundles them.

Bundling can increase compiler time, output size, and build memory. Externalizing can move work into every isolated test runtime: Node repeatedly resolves package exports, reads package metadata and files, compiles CJS/ESM, and initializes modules. A large suite can therefore run faster with `bundleDependencies: true` even when its build is larger.

Do not infer the winning strategy from environment defaults or bundle size alone.

## Establish two scales

Measure both:

1. One representative test file that imports the problematic graph.
2. The full migrated scope with the same discovered test manifest as the baseline.

Keep Node version, coverage, cache state, worker settings, and command shape fixed. Record build, test/runtime, CLI wall, and memory when memory is part of the question. A single file exposes fixed compiler/runtime startup; the full scope exposes repeated loader and per-file isolation cost.

## Compare the three baselines

When the target version and non-browser mode support it, compare one variable at a time:

```ts
// A. Environment default
export default defineConfig({});

// B. Externalize dependencies
export default defineConfig({
  output: { bundleDependencies: false },
});

// C. Bundle dependencies
export default defineConfig({
  output: { bundleDependencies: true },
});
```

Treat these as diagnostic baselines, not final recommendations. Keep all tests green and compare several runs when results are noisy.

Interpret the split:

- Lower build time but higher tests/collect/setup time after externalizing indicates repeated Node loader or module initialization cost.
- Higher build time and lower full-suite wall after bundling can be a valid tradeoff when shared chunks avoid repeated runtime loading.
- A win only on one file may disappear or reverse on the full scope.
- A full-suite win with a changed test manifest is not comparable.

## Use a selective policy only after the baselines

An array externalizes by default and bundles only matching requests:

```ts
export default defineConfig({
  output: {
    bundleDependencies: ['esm-only-package', 'source-package/*'],
  },
});
```

It does not re-bundle transitive dependencies reachable only through an already externalized parent. Long allowlists are a warning sign: compare them with `true` and confirm every entry has a measured compatibility or performance reason.

Bundle a dependency when Rspack transformation is required for ESM/TypeScript source, imports without file extensions, aliases, CSS/assets, or a measured shared-chunk/lazy-barrel benefit. Externalize a dependency when it runs correctly in Node and its compiler graph dominates without offsetting runtime cost.

## Combine with exact externals

`output.externals` overrides the bundling baseline for matching requests. Use it for a few measured heavy boundaries, especially modules already fully mocked. Follow `mocked-module-build-graph.md` before externalizing a mocked request.

Do not broadly externalize React, UI libraries, or workspace layers just because they are large. Verify package exports, ESM/CommonJS interop, styles, assets, aliases, snapshots, and coverage.

## Preserve measured lazy-barrel wins

A bundled ESM barrel can benefit from Rspack lazy-barrel optimization when it has explicit side-effect-free metadata and the test imports a small named subset. Eligibility is not proof of benefit. Start from packages observed in build output, change one candidate, and keep it bundled only when the same tests improve.

## Validate the final policy

1. Run the representative file and full scope.
2. Confirm files/tests/skips/snapshots and coverage are unchanged.
3. Repeat enough runs to distinguish a real win from machine noise.
4. Remove experiment-only allowlists, aliases, caches, and diagnostic output.
5. Explain the retained policy next to the config in terms of measured build versus runtime behavior.
