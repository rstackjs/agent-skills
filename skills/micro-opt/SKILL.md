---
name: micro-opt
description: Use when making automated micro-optimizations with benchmark-driven CodSpeed or Valgrind data. If the project already has benchmarks, prefer CodSpeed-generated temporary Valgrind data first; otherwise fall back to direct Valgrind with explicit tool-specific parameters. Guides agents to open a draft PR first, choose the right profiler mode and metric, collect baseline data, set an optimization goal, iterate on small verified changes, commit measurable progress, and keep the PR description updated with metric deltas.
---

# Micro-Opt

Use this skill when the user wants an agent to reduce low-level cost in a benchmarked hot path, especially when benchmark-backed CodSpeed or Valgrind data is the source of truth.

## Required Workflow

1. Create a dedicated branch and draft PR before optimization edits.
   - If the current branch is a default branch, switch to a new branch such as `perf/micro-optimize-<target>`.
   - If a hosting provider requires a commit before a PR can exist, make the smallest acceptable starter commit or open the draft PR immediately after collecting baseline artifacts, before changing product code.
   - Mark the PR as draft and include the target benchmark, planned measurement command, and a placeholder results table.
2. Find the benchmark command.
   - Prefer the command named by the user.
   - Otherwise inspect package scripts, benchmark directories, `criterion`, `benches`, `benchmark`, `codspeed.yml`, `.github/workflows`, or language-specific benchmark config.
3. Choose the measurement mode before collecting data.
   - If the project already has a runnable benchmark for the target path, prefer CodSpeed-generated temporary Valgrind data first when the benchmark can run under CodSpeed or the repository already uses CodSpeed CI.
   - Use direct Valgrind only when there is no usable benchmark, CodSpeed cannot run for that benchmark locally or in CI, or the benchmarked flow needs a Valgrind tool that CodSpeed does not expose.
   - Let the optimization scenario decide the Valgrind tool and metric; do not force Callgrind when another tool better matches the suspected bottleneck.
   - For CPU instruction count and call-graph hot paths, use Callgrind and compare `Ir` or another explicitly chosen event.
   - For cache locality, branch prediction, and memory access behavior, use Cachegrind and compare the relevant cache, branch, or instruction events.
   - For heap growth, allocation churn, and peak memory, use Massif or DHAT and compare peak bytes, allocation counts, or retained bytes.
   - For suspected invalid memory access, leaks, or undefined behavior affecting performance, use Memcheck first as a correctness gate, then switch to a performance metric after the issue is fixed.
   - When CodSpeed CPU simulation is present, prefer it for benchmarks that CodSpeed CI will judge and track both accesses and estimated cycles as paired iteration metrics.
4. Collect a baseline with the selected Valgrind or CodSpeed mode before setting the optimization goal.
   - Save raw profiler outputs and summarized annotations under an ignored artifact directory such as `optimization-artifacts/valgrind/<tool>/<timestamp>/`.
   - Record the exact command, selected tool, selected metric, commit SHA, OS, CPU architecture, compiler/runtime versions, Valgrind or CodSpeed version, benchmark input, and relevant environment variables.
   - Use one primary metric for the optimization goal. For CodSpeed CPU simulation, use paired accesses and estimated cycles; for non-CodSpeed Valgrind runs, use the selected tool's most relevant event or metric.
   - Track secondary metrics only when they explain tradeoffs.
5. Set the agent goal.
   - Use the code agent's `/goal` or equivalent persistent goal feature after the baseline is known.
   - State a concrete target, for example: "Reduce `<metric>` for `<benchmark>` below `<baseline>` with `<tool>` while preserving behavior and tests."
6. Iterate on one small optimization at a time.
   - Read the profiler summary first; optimize functions or code paths with clear ownership and meaningful inclusive, self, allocation, cache, or memory cost.
   - Prefer simple changes that remove repeated work, allocations, conversions, hashing, parsing, cloning, dispatch, or avoidable traversal.
   - Avoid `unsafe` by default. Consider it only when profiling shows a substantial improvement that cannot be reached with safe code, the invariant is small enough to audit, and tests or assertions cover the boundary.
   - Preserve public behavior, test results, benchmark outputs, and observable side effects. A micro-optimization must not change correctness results to become faster.
   - If an optimization changes any test result, snapshot, fixture output, benchmark result payload, ordering contract, warning, error, or externally visible behavior, treat it as a correctness bug first and do not count the performance delta as progress until behavior is restored or the behavior change is explicitly requested.
   - Run the relevant tests before treating a result as progress.
7. Re-measure after each candidate change with the same benchmark command, tool, and metric.
   - Compare against the baseline and previous best using absolute metric value, delta, and percentage change.
   - Treat noise, benchmark input drift, or changed measurement tooling as invalid until a new baseline is captured and explained.
8. Commit when there is small, verified progress.
   - Commit only after correctness checks pass and the chosen primary metric improves for the target benchmark.
   - Keep commits scoped to one optimization idea so regressions can be reverted independently.
9. Update the draft PR description after every progress commit.
   - Include commit SHA, benchmark name, tool, metric, baseline value, new value, delta, percent change, checks run, and notes about any tradeoffs.
   - If the change uses `unsafe`, explicitly document why it is needed, the measured benefit, the safety invariant, and the tests or checks that protect it.
   - Keep raw profiler artifacts local unless the repository explicitly wants profiling artifacts committed.

## Collecting Valgrind Data

If the project has a benchmark, use the benchmark command as the profiling entrypoint and prefer CodSpeed's temporary Valgrind data over ad hoc direct Valgrind collection.

Use stable, reproducible commands. For direct Valgrind fallback, use one command shape aligned with CodSpeed's current `measure.rs` defaults:

```bash
valgrind --tool=<tool> \
  -q \
  --trace-children=yes \
  --fair-sched=yes \
  --cache-sim=yes \
  --I1=32768,8,64 \
  --D1=32768,8,64 \
  --LL=8388608,16,64 \
  --instr-atstart=no \
  --collect-systime=nsec \
  --read-inline-info=yes \
  --trace-children-skip='*esbuild' \
  --<tool>-out-file=optimization-artifacts/valgrind/<tool>/<run>/<tool>.out.%p \
  --log-file=optimization-artifacts/valgrind/<tool>/<run>/valgrind.log \
  <benchmark-command>
```

Keep `--fair-sched=yes` in the fallback command by default, because CodSpeed enables fair scheduling by default. Only remove it when the local CodSpeed executor is explicitly configured to disable fair scheduling. For Callgrind fallback, also use `--compress-strings=no`, `--combine-dumps=yes`, and `--dump-line=no`. Source: `src/executor/valgrind/measure.rs` in CodSpeed.

Use the matching summarizer for the selected tool, for example:

```bash
callgrind_annotate --show=Ir --sort=Ir --threshold=90 <callgrind-output>
cg_annotate --show=D1mr,DLmr,Bcm --sort=D1mr <cachegrind-output>
ms_print <massif-output>
```

For benchmark harnesses that run many cases, narrow to the case being optimized. If setup code dominates the profile, prefer existing harness support for measuring one case or use collection controls only when the project already has a reliable pattern for them.

## macOS With Docker

Use Docker on macOS when the chosen Valgrind tool is unavailable locally, the project is normally benchmarked on Linux, or CodSpeed simulation needs a Linux-like environment.

- Prefer the project's existing Dockerfile, devcontainer, or CI image so dependencies and system libraries match review and CI.
- Pin the Docker image and platform. On Apple Silicon, Docker defaults to `linux/arm64`; use `--platform linux/amd64` only when the target benchmark data is also amd64, and label the PR table with that platform.
- Do not compare metrics across macOS native runs, `linux/arm64`, and `linux/amd64`. If the platform changes, capture a new baseline.
- Write profiling output into the mounted repository artifact directory so it remains available after the container exits.
- Record Docker image, platform, `uname -m`, Valgrind or CodSpeed version, benchmark command, and dependency install command in the PR notes.

If the project already has a Docker image:

```bash
docker build --platform <linux/arm64|linux/amd64> -t micro-opt -f <Dockerfile> .
docker run --rm -it \
  --platform <linux/arm64|linux/amd64> \
  -v "$PWD:/work" \
  -w /work \
  micro-opt bash
```

For a temporary Linux profiling shell:

```bash
docker run --rm -it \
  --platform <linux/arm64|linux/amd64> \
  -v "$PWD:/work" \
  -w /work \
  ubuntu:24.04 bash
```

Inside the container, install only the dependencies needed for the benchmark and selected profiler:

```bash
apt-get update
apt-get install -y ca-certificates curl build-essential pkg-config valgrind
<install-project-dependencies>
valgrind --tool=<tool> \
  --<tool>-out-file=optimization-artifacts/valgrind/<tool>/<run>/<tool>.out.%p \
  <benchmark-command>
```

For CodSpeed projects, run the existing CodSpeed benchmark command inside the same container and follow the workflow in `CodSpeed Projects`.

## CodSpeed Projects

Detect CodSpeed by looking for `codspeed.yml`, `.codspeed.yml`, CodSpeed GitHub Actions, or dependencies such as `pytest-codspeed`, `@codspeed/*`, `codspeed-criterion-compat`, or `codspeed`.

When CodSpeed is present:

- If the project has a benchmark, prefer CodSpeed's CPU simulation instrument and its temporary Valgrind data for consistency with CodSpeed CI. For Rust `cargo-codspeed` projects, generate the temporary Valgrind data with:

  ```bash
  cargo codspeed build
  mkdir -p /tmp/codspeed-valgrind
  TMPDIR=/tmp/codspeed-valgrind codspeed run -m simulation -- cargo codspeed run -m simulation
  ```

  Then inspect `/tmp/codspeed-valgrind/profile.*.out` and use the largest `*.out` file as the benchmark's Callgrind file.
- Use accesses and estimated cycles together as the key performance metrics for iteration. Record both values when CodSpeed exposes them, with before, after, absolute delta, and percentage delta for each.
- CodSpeed estimates CPU simulation cost from Callgrind events with this formula:

  ```text
  accesses = Ir + Dr + Dw
  l1_misses = I1mr + D1mr + D1mw
  ll_misses = ILmr + DLmr + DLmw
  estimated_cycles = accesses + 5 * l1_misses + 100 * ll_misses
  estimated_seconds = estimated_cycles / 3_600_000_000
  ```

  This corresponds to CodSpeed's `timeDistribution` fields:

  ```text
  ir = accesses / 3_600_000_000
  l1m = 5 * l1_misses / 3_600_000_000
  llm = 100 * ll_misses / 3_600_000_000
  value = ir + l1m + llm
  ```

  If syscall time is explicitly included, add `sysTime / 1e9`; otherwise keep syscall time separate from the CPU simulation value.

- Use the CodSpeed profile or inspector breakdown to decide whether a hot path is instruction-bound, cache-bound, or memory-bound before choosing the next optimization.
- If a CodSpeed report exposes only one of accesses or estimated cycles, do not invent the missing value. Mark the missing field as `n/a`, include the available value, and note the report source.
- If a CodSpeed report exposes execution speed instead of raw counters, treat it as simulation-derived: higher speed is better, while lower accesses and estimated cycles are better. Keep PR tables explicit about which value is recorded.
- Use existing CodSpeed benchmark definitions when possible: `codspeed run -m simulation`.
- For a single ad hoc command, use `codspeed exec -m simulation -- <benchmark-command>`.
- Treat CodSpeed's temporary Valgrind or Callgrind artifacts as the first-choice profiling input for benchmarked paths; only drop to direct Valgrind when those artifacts are unavailable or insufficient for the chosen tool.
- Verify that the `valgrind` on `PATH` is CodSpeed's Valgrind fork when local simulation requires it.
- Do not mix regular Valgrind results and CodSpeed simulation results in the same delta table unless the PR clearly labels them as separate measurement modes.
- Reference: https://codspeed.io/docs/instruments/cpu#estimating-cycles

If CodSpeed cannot run locally, collect regular Valgrind data as a fallback and state that CI CodSpeed data remains the final consistency check.

## PR Description Template

Use a compact table and update it after every progress commit:

```markdown
## Micro-Optimization Progress

Target benchmark: `<benchmark>`
Measurement mode: `<valgrind tool | codspeed simulation>`
Primary metric: `<accesses + estimated cycles | selected Valgrind metric>`
Baseline command: `<command>`

| Commit  | Benchmark | Mode                    | Accesses Before | Accesses After | Accesses Delta | Estimated Cycles Before | Estimated Cycles After | Estimated Cycles Delta | Checks    | Notes      |
| ------- | --------- | ----------------------- | --------------- | -------------- | -------------- | ----------------------- | ---------------------- | ---------------------- | --------- | ---------- |
| `<sha>` | `<name>`  | `<codspeed simulation>` | `1,000,000`     | `950,000`      | `-5.0%`        | `1,120,000`             | `1,060,000`            | `-5.4%`                | `<tests>` | `<reason>` |
```

For non-CodSpeed Valgrind runs, replace the cycle columns with the selected tool metric before/after/delta, or add a separate table when mixing measurement modes.

## Stop Conditions

Stop and report when:

- Further improvements require semantic risk, broad rewrites, or benchmark changes.
- The best candidate improves one benchmark but regresses another important benchmark.
- Valgrind/CodSpeed cannot produce comparable data.
- The remaining hot path is outside the project, generated code, or a dependency that should be optimized separately.
