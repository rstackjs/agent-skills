# Performance Measurement

Use this reference before tuning an Rstest slowdown or explaining runner, build, tests, and CLI wall time.

## Fix the comparison

Record the exact command, working directory, Node and Rstest versions, environment, coverage, pool/workers, isolation, and cache state. Use the same test-file manifest for before/after comparisons.

Measure both:

1. A representative file that imports the suspected graph.
2. The full affected scope.

The file exposes fixed compiler/runtime startup. The full scope exposes repeated per-file loading, setup, logging, and worker scheduling. Prefer several alternating runs when machine noise is visible.

Record separately:

- CLI wall time from process start to exit.
- Runner-reported duration.
- Build and tests/runtime fields when reported.
- Files/tests/skips and coverage.
- Output lines/bytes when logging is material.
- Memory with a declared measurement method.

Do not assume runner, build, and tests are disjoint. Do not add worker phase totals when workers overlap.

## Use trace to classify the lifecycle

When supported by the installed version:

```bash
rstest run --trace
```

Read the generated summary, then use the Perfetto trace to inspect overlap. Per-file phases can include:

- `prepare`: worker runtime, global APIs, and coverage preparation.
- `envSetup`: test environment installation.
- `load`: worker receipt/loading of built assets; host production is separate.
- `setupFiles`: setup module evaluation.
- `collect`: top-level test-module evaluation.
- `tests`: suite/case construction, hooks, and test bodies.
- `coverage` and `teardown`.

CLI wall can additionally contain config loading, compiler initialization, pool startup/shutdown, reporter I/O, artifact writing, and process teardown. Explain an unreported gap with lifecycle evidence rather than assigning it to build by subtraction.

Use `DEBUG=rstest` for resolved configuration and temporary build output.

## Inspect experimental bundle coverage

Starting with Rstest 0.11.7, the exact debug namespace `rstest:bundle-coverage` writes per-test bundle information:

```bash
DEBUG=rstest:bundle-coverage rstest run
```

If the project is pinned below the supporting release and a local Rstest checkout with the feature is available, invoke that checkout's CLI directly for this diagnostic. Do not change the project's dependency or lockfile merely to obtain experimental output. Record the local checkout version/commit, keep business config unchanged, and rerun final tests and timings with the project's installed Rstest.

The current implementation writes `<rootPath>/.rstest/bundle-coverage-<timestamp>.json`. Its version-1 shape contains a `tests` array; each item currently includes:

- `project` and `testPath`.
- `assets`, mapping each asset filename carried by that test runtime to its byte length.
- `rawV8`, containing raw V8 coverage when V8 coverage is enabled, otherwise `null`.

To correlate bundled assets with executed code, run the same narrowed test with V8 coverage enabled, for example:

```bash
DEBUG=rstest:bundle-coverage rstest run --coverage
```

Use the configured V8 provider and verify that `rawV8` is non-null. In the current version-1 output, `rawV8.entries[].filePath` can be compared with `assets` to find assets that were carried by a test runtime but have no observed V8 entry. Treat that result as investigation evidence: confirm the dependency or issuer chain before externalizing or changing mocks.

Asset presence is not sufficient when Rspack emits one large test bundle: the asset is necessarily loaded even if most module wrappers never execute. In that case, inspect raw V8 function ranges/counts within the matching asset and compare candidate configurations using stable signals such as total asset bytes and observed named-function counts. Treat those counts as diagnostic evidence, not exact executed-byte coverage; generated wrappers, source maps, anonymous functions, and V8 range semantics limit that interpretation.

This capability is experimental ([Rstest PR #1694](https://github.com/web-infra-dev/rstest/pull/1694)). The debug namespace, file location, schema, and interpretation may change after 0.11.7. Check the installed version and the top-level output `version` before parsing it, and do not build durable automation against the current schema without a compatibility check. Coverage collection and artifact writing also perturb timings, so use this mode to explain bundles, not to produce final performance numbers.

Before starting, note whether `<rootPath>/.rstest` and any bundle-coverage files already exist. After extracting the needed evidence, delete the `bundle-coverage-<timestamp>.json` files created by the diagnostic run. Remove the `.rstest` directory only when this run created it and no pre-existing or unrelated files remain; never recursively remove a pre-existing debug directory merely to clean this diagnostic output.

## Choose the next tool

- Host build/startup dominates: inspect entries, issuer chains, dependencies, styles/assets, and plugins; use Rsdoctor if distribution remains unclear.
- `load`/`setupFiles`/`collect` grows with file count: inspect repeated Node loading, setup imports, bundled dependencies, and mocked real graphs.
- `tests` dominates a few files: use verbose output, then samply/Node profiling only on the narrowed scope.
- CLI wall exceeds runner materially: inspect reporter output, pool/process lifecycle, debug overhead, and open handles.

Final reports must separate same-scope results from results that intentionally run more tests.
