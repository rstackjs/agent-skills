# Mocked Modules and the Build Graph

Use this reference when an expensive module is fully replaced by `rs.mock()` but Rspack still compiles its source graph.

## Why it happens

`rs.mock()` is runtime replacement, not build-graph pruning. Rspack discovers static imports and can compile the real reachable graph before the runtime installs or uses the mock. Test execution can be cheap while build, assets, or runtime initialization remain expensive.

## Test the narrow boundary

1. Confirm the mock fully replaces the module and the test does not need real exports, initialization side effects, or coverage.
2. Externalize the exact mocked request, not a broad transitive dependency layer.
3. Run the affected file and every test in the config/project that imports the request.
4. Compare build, runtime, wall, and memory with the unchanged baseline.

For a stable request, start narrowly:

```ts
export default defineConfig({
  output: {
    externals: ['@app/MarkdownRender'],
  },
});
```

When an explicitly CommonJS runtime external is required and the installed config supports typed values:

```ts
export default defineConfig({
  output: {
    externals: [
      {
        '@app/MarkdownRender': 'commonjs @app/MarkdownRender',
      },
    ],
  },
});
```

Match the request string seen by Rspack. Choose the module format required by the built test runtime; do not copy `commonjs` into an ESM-only setup. If each rule declares its type, a global `externalsType` is normally redundant, but verify against the installed types and behavior.

A plain external can fail before the runtime mock is consulted: Node may attempt an ESM dynamic import of a workspace export whose built `.js` file does not exist while the repository only has TypeScript source. If the built test runtime expects CommonJS, test an explicit `commonjs <request>` external. Retain it only when the exact mock still intercepts the request and the full config/project remains green.

## Safety checks

- Do not use this for partial mocks, `importActual`, `{ spy: true }`, or tests that exercise real side effects.
- Confirm the mock is registered before tested code loads the request.
- Remember that `output.externals` applies to the whole config/project, not only the motivating file.
- A missed mock can make Node load an externalized local TypeScript/source module without Rspack transformation.
- Recheck aliases, ESM/CommonJS interop, package conditions, snapshots, and coverage.
- If only one subset always mocks the module, isolate that subset as a separate project rather than weakening unrelated tests.

Use bundle-utilization diagnostics when available to confirm that real assets were built but unused. Otherwise the exact external experiment plus full-scope validation is the evidence.
