# Mocked Modules and the Build Graph

<!-- Keep in sync with skills/rstest-debugging/references/mocked-module-build-graph.md. The debugging copy is canonical when available. -->

Use this reference when Rstest has high build time, runtime initialization cost, or memory even though an expensive module is replaced with `rs.mock()`.

## Source of truth

- Rstest module mocking: https://rstest.rs/api/runtime-api/rstest/mock-modules
- Rstest output configuration: https://rstest.rs/config/build/output

## Why the module is still compiled

Treat `rs.mock()` as runtime module replacement, not build-graph pruning. Rspack discovers the static import while building the test and can still compile the real module and its reachable source graph before Rstest installs or uses the runtime mock.

This commonly appears when a small component test fully mocks a renderer, editor, document processor, or other module whose real implementation imports a large package or source tree. The test execution can be cheap while the build remains expensive.

## Run the narrow experiment

1. Confirm that the heavy module is fully mocked and its real exports, initialization side effects, and coverage are not part of the test's intent.
2. Add only the exact mocked import request to `output.externals`. Do not externalize the large transitive package first: cutting the graph at the already-mocked boundary is narrower and preserves more normal bundling behavior.
3. Run the affected test file with the same Node version, coverage, workers, and cache state. Compare passed tests, peak RSS, and build time with the baseline.
4. Keep the rule only when behavior remains identical and the resource reduction is material. A large RSS/build-time drop with the same tests passing is strong evidence that compiling the unused real module graph was the primary cost.

When bundle-utilization diagnostics are available for the installed or explicitly tested local build, use them to confirm that the real assets are built but not evaluated. Otherwise use the exact external experiment as the proof; do not infer safety from bundle size alone.

For a package or stable alias import, the experiment can be as small as:

```ts
import { defineConfig } from '@rstest/core';

const fullyMockedModule = '@app/MarkdownRender';

export default defineConfig({
  output: {
    externals: [fullyMockedModule],
  },
});
```

Match the request string seen by Rspack. If the import uses a relative path, an alias, or multiple package paths, inspect the effective requests and use the narrowest supported string, regular expression, object, or function rule rather than a broad name fragment.

## Match the runtime module format

The simple string form uses the target's default external type. When the runtime mock must satisfy an explicitly CommonJS external, and the installed output config supports typed object values, declare the type on that rule:

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

Use the module format required by the built test runtime; do not copy `commonjs` into an ESM-only setup without validation. When every rule explicitly declares its type, a global `externalsType` is normally redundant. Verify against the installed Rstest/Rsbuild types and run behavior because older target lines can expose different config shapes.

## Scope and safety checks

`output.externals` applies to the whole Rstest config or project, not only the test file that motivated it. Before keeping the rule:

- Run every test in that config/project which imports the externalized module, including tests that may not mock it.
- Do not use this optimization for partial mocks, `importActual`, `{ spy: true }`, or tests that exercise the real module or its side effects.
- Confirm the mock matches the same module request and is registered before the tested code loads it. A missed mock may make the runtime resolve an externalized local TypeScript/source module without Rspack transformation.
- Recheck module aliases, ESM/CommonJS interop, package export conditions, snapshots, and coverage.

If only one subset fully mocks the module, isolate that subset as a separate Rstest project with its own `output.externals` rule instead of weakening bundling for unrelated tests.
