# Migration Performance Diagnosis

Use this migration-specific fallback after the scope is semantically green when Rstest materially regresses in CLI wall time, runner time, build, test runtime, output volume, or memory. When the `rstest-debugging` skill is available, load it instead: it is the canonical and more complete performance workflow. Keep this reference so `migrate-to-rstest` remains useful when installed alone.

## Protect the comparison

Use the same machine, Node version, installed runner version, test manifest, coverage mode, cache state, environment, and worker settings. Record the exact command and working directory.

Measure both a representative file and the full scope. Prefer several alternating runs when differences are small. A local Rstest checkout may be used for labeled diagnostics, but final correctness and performance claims must use the project's installed dependency.

Record separately:

- CLI wall time from process start to exit.
- Runner-reported duration.
- Build and tests/runtime durations when reported.
- Files/tests/skips.
- Output lines/bytes when logs are material.
- Memory only with a declared method.

Do not add worker durations together when they overlap.

## Trace before tuning

When the installed target supports it, run:

```bash
rstest run --trace
```

Use the generated summary first, then the Perfetto trace to inspect overlap. Relevant per-file phases include `prepare`, `envSetup`, `load`, `setupFiles`, `collect`, `tests`, `coverage`, and `teardown`; host build spans are separate. Runner duration is not necessarily the entire CLI wall, which can also include config loading, compiler setup, reporter I/O, worker startup/shutdown, and process teardown.

Use `DEBUG=rstest` to inspect resolved config and temporary build output. Starting with Rstest 0.11.7, `DEBUG=rstest:bundle-coverage` can write an experimental per-test asset manifest under `.rstest`; with V8 coverage enabled, it also records raw V8 data for correlating carried assets with executed code. Without V8 coverage, `rawV8` is `null`. Load `rstest-debugging` for the canonical workflow and output fields. This interface was introduced by [Rstest PR #1694](https://github.com/web-infra-dev/rstest/pull/1694) and may change, so check the installed version and output schema, and do not use the diagnostic run for final timing claims.

## Classify the bottleneck

### Build or host startup

Signals: host build spans dominate, temporary output is large, or one representative file is already slow.

Inspect entry/issuer chains, styles/assets, plugins, and dependency bundling. Use Rsdoctor when the compiler distribution remains unclear.

### Runtime load, setup, or collect

Signals: `load`, `setupFiles`, or `collect` grows with test-file count while test bodies are cheap.

Inspect repeated Node CJS/ESM loading, global setup imports, compile-time globals, and mocked modules whose real graphs were still built. Read `dependency-bundling-performance.md` and `mocked-module-build-graph.md`. Full dependency bundling can outperform externalization here.

### Test bodies or hooks

Signals: `tests` dominates a few files or cases.

Use verbose output/trace to isolate them before changing bundle config. Check real I/O, timers, retries, oversized fixtures, and repeated `beforeEach` work without changing the test's intent.

### CLI overhead outside runner reporting

Signals: runner duration improves but CLI wall remains high.

Measure reporter output, worker/process startup and teardown, config loading, trace/debug overhead, and open handles. Do not attribute the unexplained gap to build without lifecycle evidence.

## Run a single-variable experiment loop

Choose experiments from evidence, commonly in this order:

1. Exact fully mocked boundaries in `output.externals`.
2. `bundleDependencies` default versus `false` versus `true`.
3. Asset emission when tests do not inspect emitted files.
4. `forks` versus `threads`, preserving isolation and checking full-suite stability.
5. Successful-test log capture such as `silent: 'passed-only'` when the target version supports it.

Keep pool, workers, cache, and unrelated config fixed around each experiment. Do not treat logging changes as a stable speedup without repeated data; their primary benefit may be usability.

## Measure memory honestly

Aggregate controller/worker RSS can double-count shared pages. Prefer cgroup peak memory on Linux or `footprint` on macOS when claiming physical-memory changes. If the previous runner was not measured with the same method, report only Rstest's absolute observation and do not claim a regression or improvement.

## Finalize

Re-run the representative file and full scope with the final minimal config and installed Rstest. Report same-scope results separately from any expanded discovery scope, and remove traces, profiles, caches, debug hooks, benchmark-only settings, local package links, and `.rstest` files created by diagnostics. Remove the `.rstest` directory only if the diagnostic run created it and no pre-existing or unrelated files remain.
