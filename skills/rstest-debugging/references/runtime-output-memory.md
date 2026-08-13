# Runtime, Output, and Memory Experiments

Use this reference after trace evidence implicates assets, console output, worker/process lifecycle, isolation, or memory.

## Assets

Imported images/fonts can be emitted for every built test entry even when tests only need module resolution. Compare `output.emitAssets: false` only when no test reads emitted files or asserts emitted URLs/content. Treat successful compilation alone as insufficient proof; run all asset-related tests and snapshots.

## Console output

Large successful-test output can dominate reporter I/O and cross-process messaging. Measure output lines/bytes and list the highest-volume files. When the installed version supports it, compare:

```ts
export default defineConfig({
  silent: 'passed-only',
});
```

The primary benefit may be usability rather than stable speed. Confirm failed tests still replay their captured logs. Do not globally mock `console` or application loggers when tests assert logging or failures need context.

## Pools and workers

Compare `forks` and `threads` only after build/dependency strategy is stable. Keep worker count fixed or use the same default, alternate several full-scope runs, and compare build separately from tests/runtime.

Threads avoid per-process startup and can reduce console transport cost, but each worker still has a V8 isolate and environment. Native modules, process-global assumptions, and test isolation can behave differently. Keep an explicit pool only with measured benefit and full-suite stability.

Change `maxWorkers` only when CPU/memory contention is reproducible. A lower worker count can reduce peaks while increasing wall time; report the tradeoff.

## Isolation

Treat `isolate: false` as a semantic change, not a normal optimization. Run the full scope repeatedly and look for order-dependent mocks, singleton state, environments, timers, globals, and module caches. Do not keep it if any random or cross-file failure appears.

## Memory

Measure the previous runner before migration when memory comparison matters. Aggregate controller/worker RSS can double-count shared pages. Prefer:

- Linux cgroup peak memory for CI/process-tree physical usage.
- macOS `footprint` for shared-page-aware physical usage.
- Heap profiles for allocation sources, not total native/Rspack memory.

If the previous runner lacks the same measurement, report only Rstest's absolute observation. Do not claim improvement or regression.

## Experiment discipline

Keep behavior and manifest fixed. Change one field, repeat the representative file and full scope, then remove any option without a repeatable benefit. Do not keep benchmark-only reporters, traces, profiles, caches, local runner links, or debug hooks.
