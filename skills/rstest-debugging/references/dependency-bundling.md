# Dependency Bundling

Use this reference when compiler cost or repeated runtime module loading may depend on whether Rstest bundles `node_modules`. Browser mode always bundles dependencies and does not support this tuning path.

## Understand the tradeoff

Rstest builds tests with Rsbuild/Rspack before execution:

- `node` externalizes third-party dependencies by default.
- Browser-like non-browser environments such as `jsdom` and `happy-dom` bundle them by default.
- Browser mode always bundles them.

Bundling increases compiler work, output size, and possibly build memory. Externalization moves work into each isolated runtime: Node can repeatedly resolve package exports, read package metadata/files, compile CJS/ESM, and initialize modules. Large suites can therefore run faster with full bundling even if a single file builds faster when externalized.

Check the installed types before using `output.bundleDependencies`; it was introduced in Rstest v0.9.5.

## Compare three baselines

Keep command, manifest, Node, coverage, cache, pool, and workers fixed. Measure one representative file and the full scope:

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

Interpret build and runtime separately:

- Externalization lowers build but raises `load`/`setupFiles`/`collect`: repeated Node loading or initialization is likely material.
- Bundling raises build but lowers full-suite wall: shared assets avoided repeated runtime work.
- A single-file win can reverse across many isolated files.
- Output size alone does not identify the faster strategy.

When a Node-environment trace shows `collect` dominating while test bodies are small, compare `bundleDependencies: true` early. It is a high-signal baseline for repeated runtime module loading; only add selective bundling or exact externals after measuring it against the environment default.

## Add selectivity only after baselines

An array externalizes by default and bundles matching requests:

```ts
export default defineConfig({
  output: {
    bundleDependencies: ['esm-only-package', 'source-package/*'],
  },
});
```

It does not re-bundle transitive dependencies reachable only through an already externalized parent. A long allowlist should be compared with `true`; keep each entry only for a measured compatibility or performance reason.

Bundle when Rspack transformation is needed for ESM/TypeScript source, imports without extensions, aliases, CSS/assets, or measured shared-chunk/lazy-barrel value. Externalize when the package runs correctly in Node and its compiler graph dominates without offsetting runtime cost.

`output.externals` overrides the baseline for matching requests. Use it for exact measured heavy boundaries, especially fully mocked modules, after reading `mocked-module-build-graph.md`.

## Validate

- Check ESM/CommonJS interop, package exports, aliases, styles/assets, snapshots, and coverage.
- Repeat the representative file and full scope enough to separate a real win from noise.
- Remove experiment-only allowlists, aliases, caches, and debug output.
- Explain retained policy in terms of measured build versus runtime behavior.
