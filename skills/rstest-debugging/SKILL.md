---
name: rstest-debugging
description: Debug Rstest issues systematically, including performance regressions. First determine whether the slowdown is in build startup or test execution, then run controlled config or code experiments and compare before/after timings.
---

# Rstest Debugging Workflow

Use this skill when Rstest is slower than expected, slower than Jest or Vitest, slower than a previous Rstest baseline, or when users report that tests spend a long time before starting.

The goal is not to guess a root cause from config names alone. First identify where time is being spent, then change one variable at a time and compare the result.

## 1. Establish a reproducible baseline

Before changing config or code:

- Pick the narrowest representative command. Prefer a single file, package, or fixture over the whole workspace.
- Record the exact command, working directory, test environment (`node`, `jsdom`, `happy-dom`, browser mode), and relevant worker settings.
- Measure at least one cold run and one warm run with the same command.
- Do not change multiple config fields before the first measurement.

Common baseline commands:

```bash
npx rstest run path/to/test-file.test.ts
npx rstest --reporter=verbose path/to/test-file.test.ts
pnpm rstest path/to/test-file.test.ts
```

If the problem is reported as “there is a long pause before tests even start”, treat that as a build or startup hypothesis until measurements prove otherwise.

## 2. Classify the slowdown before optimizing

Split the investigation into one of these buckets:

- **Build or startup slow**: there is a long delay before test cases begin, or small reruns still spend most time preparing the graph.
- **Execution slow**: tests start quickly, but one or more files or cases take a long time to finish.
- **Unclear**: a single `Duration` value is not enough to decide.

Use these tools in order:

### Use `--trace` when the time distribution is unclear

```bash
npx rstest run --trace
```

`--trace` produces a Perfetto-compatible trace with per-phase, per-suite, and per-case slices. Use it to answer: is the time concentrated in prepare or build phases, or inside test execution?

### Use `DEBUG=rstest` for build-stage clues

```bash
DEBUG=rstest npx rstest run
```

Focus on:

- Long build-related log phases
- Large temporary outputs under `dist/.rstest-temp`
- Whether a heavy dependency chain or entry causes most of the startup cost

### Use the verbose reporter for execution-stage clues

```bash
npx rstest --reporter=verbose
```

Use this to find the slow file, suite, or case before reaching for a profiler.

## 3. If build or startup is slow

For `jsdom` and `happy-dom`, Rstest bundles third-party dependencies by default. That often explains reports like “Rstest is slow before tests even start”.

Check these first:

- Whether a test entry pulls in a large UI, editor, charting, or data-processing package
- Whether style imports or asset imports are causing extra graph traversal
- Whether the test only needs a tiny API surface while bundling a much larger dependency tree

Run one experiment at a time, and rerun the exact same baseline command after each change.

### Experiment A: externalize bundled dependencies

For non-browser mode, try:

```ts
import { defineConfig } from '@rstest/core';

export default defineConfig({
  testEnvironment: 'jsdom',
  output: {
    bundleDependencies: false,
  },
});
```

Compare:

- Build or startup duration
- `dist/.rstest-temp` size
- Whether the test still behaves correctly

### Experiment B: externalize only the heavy packages

If only a few dependencies dominate the graph, prefer a smaller change:

```ts
import { defineConfig } from '@rstest/core';

export default defineConfig({
  output: {
    externals: ['react', 'lodash'],
  },
});
```

### Experiment C: restore explicit style stubs when the test does not need real style processing

If a previous Jest setup used `moduleNameMapper` to stub CSS or SCSS with `identity-obj-proxy`, compare that behavior explicitly instead of assuming the native Rstest path is equivalent:

```ts
import { defineConfig } from '@rstest/core';

export default defineConfig({
  tools: {
    rspack: (config, { rspack }) => {
      config.plugins ??= [];
      config.plugins.push(
        new rspack.NormalModuleReplacementPlugin(
          /\.(css|less|scss)$/,
          'identity-obj-proxy',
        ),
      );
    },
  },
});
```

Only keep this if the tests do not depend on real style behavior and the timing improvement is measurable.

### Experiment D: inspect build-time distribution with Rsdoctor

If startup is still slow and the expensive part is unclear, use Rsdoctor to see whether time is dominated by entries, loaders, plugins, or dependency chains.

## 4. If test execution is slow

Once startup is acceptable and execution remains slow, stop tuning bundling first. Focus on the runtime path.

Investigate in this order:

1. Use the verbose reporter to identify the slow file and slow case.
2. Use `--trace` to see whether time is spent in setup hooks, the test body, retries, or teardown.
3. If runtime cost is still unclear, use a profiler:
   - `samply` for CPU time distribution
   - `--heap-prof` for memory allocation
   - `--inspect` for step-through debugging

Common runtime fixes to test one by one:

- Move expensive repeated setup out of `beforeEach` when it can be shared safely.
- Reduce oversized fixtures or test data created per case.
- Replace real network, filesystem, or timer work with mocks where the integration is not under test.
- Split one huge slow test file into smaller files only if the measured bottleneck is file-local setup or teardown.
- Compare `pool.maxWorkers` settings if worker oversubscription or contention is suspected.

## 5. Compare changes with a single-variable experiment loop

Every optimization attempt must follow this loop:

1. Keep the command fixed.
2. Change exactly one config field or one code path.
3. Rerun the same command.
4. Compare cold and warm timings against the baseline.
5. Keep the change only if the improvement is real and behavior is unchanged.

Report the result in a compact table when possible:

| Change                                       | Cold run | Warm run | Outcome |
| -------------------------------------------- | -------- | -------- | ------- |
| Baseline                                     |          |          |         |
| `output.bundleDependencies: false`           |          |          |         |
| CSS stub via `NormalModuleReplacementPlugin` |          |          |         |

Do not stack multiple “maybe faster” changes before measuring. That destroys the ability to attribute the result.

## 6. Validate the optimization before keeping it

- Rerun the same representative command after each change.
- Confirm behavior is unchanged, not just faster.
- Prefer the smallest config or code change that produces a measurable win.
- If the improvement only appears on warm runs but cold runs are still unacceptable, keep investigating the startup path.
- If the improvement only appears after broad config changes, revert and retest in smaller steps until the actual winning variable is identified.

## References

- https://rstest.rs/guide/advanced/profiling
- https://rstest.rs/guide/basic/reporters#verbose-reporter
- https://rstest.rs/config/build/output
