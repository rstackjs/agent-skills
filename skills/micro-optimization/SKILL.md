---
name: micro-optimization
description: Use when making automated micro-optimizations with Valgrind or CodSpeed benchmark data. Guides agents to open a draft PR first, choose the right Valgrind tool and metric for the scenario, collect baseline data, set an optimization goal, iterate on small verified changes, commit measurable progress, and keep the PR description updated with metric deltas.
---

# Micro-Optimization

Use this skill when the user wants an agent to reduce low-level cost in a benchmarked hot path, especially when Valgrind or CodSpeed benchmark data is the source of truth.

## Required Workflow

1. Create a dedicated branch and draft PR before optimization edits.
   - If the current branch is a default branch, switch to a new branch such as `perf/micro-optimize-<target>`.
   - If a hosting provider requires a commit before a PR can exist, make the smallest acceptable starter commit or open the draft PR immediately after collecting baseline artifacts, before changing product code.
   - Mark the PR as draft and include the target benchmark, planned measurement command, and a placeholder results table.
2. Find the benchmark command.
   - Prefer the command named by the user.
   - Otherwise inspect package scripts, benchmark directories, `criterion`, `benches`, `benchmark`, `codspeed.yml`, `.github/workflows`, or language-specific benchmark config.
3. Choose the measurement mode before collecting data.
   - Let the optimization scenario decide the Valgrind tool and metric; do not force Callgrind when another tool better matches the suspected bottleneck.
   - For CPU instruction count and call-graph hot paths, use Callgrind and compare `Ir` or another explicitly chosen event.
   - For cache locality, branch prediction, and memory access behavior, use Cachegrind and compare the relevant cache, branch, or instruction events.
   - For heap growth, allocation churn, and peak memory, use Massif or DHAT and compare peak bytes, allocation counts, or retained bytes.
   - For suspected invalid memory access, leaks, or undefined behavior affecting performance, use Memcheck first as a correctness gate, then switch to a performance metric after the issue is fixed.
   - When CodSpeed is present, prefer CodSpeed's local simulation mode for benchmarks that CodSpeed CI will judge.
4. Collect a baseline with the selected Valgrind or CodSpeed mode before setting the optimization goal.
   - Save raw profiler outputs and summarized annotations under an ignored artifact directory such as `optimization-artifacts/valgrind/<tool>/<timestamp>/`.
   - Record the exact command, selected tool, selected metric, commit SHA, OS, CPU architecture, compiler/runtime versions, Valgrind or CodSpeed version, benchmark input, and relevant environment variables.
   - Use one primary metric for the optimization goal, and track secondary metrics only when they explain tradeoffs.
5. Set the agent goal.
   - Use the code agent's `/goal` or equivalent persistent goal feature after the baseline is known.
   - State a concrete target, for example: "Reduce `<metric>` for `<benchmark>` below `<baseline>` with `<tool>` while preserving behavior and tests."
6. Iterate on one small optimization at a time.
   - Read the profiler summary first; optimize functions or code paths with clear ownership and meaningful inclusive, self, allocation, cache, or memory cost.
   - Prefer simple changes that remove repeated work, allocations, conversions, hashing, parsing, cloning, dispatch, or avoidable traversal.
   - Avoid `unsafe` by default. Consider it only when profiling shows a substantial improvement that cannot be reached with safe code, the invariant is small enough to audit, and tests or assertions cover the boundary.
   - Preserve public behavior. Run the relevant tests before treating a result as progress.
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

Use stable, reproducible commands. A typical command shape is:

```bash
valgrind --tool=<tool> \
  --<tool>-out-file=optimization-artifacts/valgrind/<tool>/<run>/<tool>.out.%p \
  <benchmark-command>
```

Use the matching summarizer for the selected tool, for example:

```bash
callgrind_annotate --show=Ir --sort=Ir --threshold=90 <callgrind-output>
cg_annotate --show=D1mr,DLmr,Bcm --sort=D1mr <cachegrind-output>
ms_print <massif-output>
```

For benchmark harnesses that run many cases, narrow to the case being optimized. If setup code dominates the profile, prefer existing harness support for measuring one case or use collection controls only when the project already has a reliable pattern for them.

## CodSpeed Projects

Detect CodSpeed by looking for `codspeed.yml`, `.codspeed.yml`, CodSpeed GitHub Actions, or dependencies such as `pytest-codspeed`, `@codspeed/*`, `codspeed-criterion-compat`, or `codspeed`.

When CodSpeed is present:

- Prefer CodSpeed's CPU simulation instrument for consistency with CodSpeed CI.
- Use existing CodSpeed benchmark definitions when possible: `codspeed run -m simulation`.
- For a single ad hoc command, use `codspeed exec -m simulation -- <benchmark-command>`.
- Verify that the `valgrind` on `PATH` is CodSpeed's Valgrind fork when local simulation requires it.
- Do not mix regular Valgrind results and CodSpeed simulation results in the same delta table unless the PR clearly labels them as separate measurement modes.

If CodSpeed cannot run locally, collect regular Valgrind data as a fallback and state that CI CodSpeed data remains the final consistency check.

## PR Description Template

Use a compact table and update it after every progress commit:

```markdown
## Micro-Optimization Progress

Target benchmark: `<benchmark>`
Measurement mode: `<valgrind tool | codspeed simulation>`
Primary metric: `<metric>`
Baseline command: `<command>`

| Commit  | Benchmark | Tool          | Metric | Before      | After     | Delta           | Checks    | Notes      |
| ------- | --------- | ------------- | ------ | ----------- | --------- | --------------- | --------- | ---------- |
| `<sha>` | `<name>`  | `<callgrind>` | `<Ir>` | `1,000,000` | `950,000` | `-50,000 (-5%)` | `<tests>` | `<reason>` |
```

## Stop Conditions

Stop and report when:

- Further improvements require semantic risk, broad rewrites, or benchmark changes.
- The best candidate improves one benchmark but regresses another important benchmark.
- Valgrind/CodSpeed cannot produce comparable data.
- The remaining hot path is outside the project, generated code, or a dependency that should be optimized separately.
