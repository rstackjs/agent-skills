---
name: micro-optimization
description: Use when making automated micro-optimizations with Valgrind Callgrind or CodSpeed benchmark data. Guides agents to open a draft PR first, collect baseline Instruction Read (Ir) data, set an optimization goal, iterate on small safe changes, commit measurable progress, and keep the PR description updated with Ir deltas.
---

# Micro-Optimization

Use this skill when the user wants an agent to reduce CPU work in a benchmarked hot path, especially when Valgrind Callgrind data, CodSpeed benchmark data, or Instruction Read (`Ir`) counts are the source of truth.

## Required Workflow

1. Create a dedicated branch and draft PR before optimization edits.
   - If the current branch is a default branch, switch to a new branch such as `perf/micro-optimize-<target>`.
   - If a hosting provider requires a commit before a PR can exist, make the smallest acceptable starter commit or open the draft PR immediately after collecting baseline artifacts, before changing product code.
   - Mark the PR as draft and include the target benchmark, planned measurement command, and a placeholder results table.
2. Find the benchmark command.
   - Prefer the command named by the user.
   - Otherwise inspect package scripts, benchmark directories, `criterion`, `benches`, `benchmark`, `codspeed.yml`, `.github/workflows`, or language-specific benchmark config.
3. Collect a baseline with Valgrind Callgrind data before setting the optimization goal.
   - Save raw Callgrind outputs and summarized annotations under an ignored artifact directory such as `optimization-artifacts/callgrind/<timestamp>/`.
   - Record the exact command, commit SHA, OS, CPU architecture, compiler/runtime versions, Valgrind version, benchmark input, and relevant environment variables.
   - Use total `Ir` as the primary metric unless the user explicitly chooses another Callgrind event.
4. Set the agent goal.
   - Use the code agent's `/goal` or equivalent persistent goal feature after the baseline is known.
   - State a concrete target, for example: "Reduce Callgrind Ir for `<benchmark>` below `<baseline>` while preserving behavior and tests."
5. Iterate on one small optimization at a time.
   - Read `callgrind_annotate` output first; optimize functions with clear ownership and meaningful inclusive or self `Ir`.
   - Prefer simple changes that remove repeated work, allocations, conversions, hashing, parsing, cloning, dispatch, or avoidable traversal.
   - Preserve public behavior. Run the relevant tests before treating a result as progress.
6. Re-measure after each candidate change with the same benchmark command and Callgrind/CodSpeed mode.
   - Compare against the baseline and previous best using absolute `Ir`, delta `Ir`, and percentage change.
   - Treat noise, benchmark input drift, or changed measurement tooling as invalid until a new baseline is captured and explained.
7. Commit when there is small, verified progress.
   - Commit only after correctness checks pass and `Ir` improves for the target benchmark.
   - Keep commits scoped to one optimization idea so regressions can be reverted independently.
8. Update the draft PR description after every progress commit.
   - Include commit SHA, benchmark name, baseline `Ir`, new `Ir`, delta, percent change, checks run, and notes about any tradeoffs.
   - Keep raw Callgrind artifacts local unless the repository explicitly wants profiling artifacts committed.

## Collecting Callgrind Data

Use stable, reproducible commands. A typical command shape is:

```bash
valgrind --tool=callgrind \
  --callgrind-out-file=optimization-artifacts/callgrind/<run>/callgrind.out.%p \
  <benchmark-command>
```

Summarize the output with:

```bash
callgrind_annotate --show=Ir --sort=Ir --threshold=90 <callgrind-output>
```

For benchmark harnesses that run many cases, narrow to the case being optimized. If setup code dominates the profile, prefer existing harness support for measuring one case or use Callgrind collection controls only when the project already has a reliable pattern for them.

## CodSpeed Projects

Detect CodSpeed by looking for `codspeed.yml`, `.codspeed.yml`, CodSpeed GitHub Actions, or dependencies such as `pytest-codspeed`, `@codspeed/*`, `codspeed-criterion-compat`, or `codspeed`.

When CodSpeed is present:

- Prefer CodSpeed's CPU simulation instrument for consistency with CodSpeed CI.
- Use existing CodSpeed benchmark definitions when possible: `codspeed run -m simulation`.
- For a single ad hoc command, use `codspeed exec -m simulation -- <benchmark-command>`.
- Verify that the `valgrind` on `PATH` is CodSpeed's Valgrind fork when local simulation requires it.
- Do not mix regular Callgrind results and CodSpeed simulation results in the same delta table unless the PR clearly labels them as separate measurement modes.

If CodSpeed cannot run locally, collect regular Callgrind data as a fallback and state that CI CodSpeed data remains the final consistency check.

## PR Description Template

Use a compact table and update it after every progress commit:

```markdown
## Micro-Optimization Progress

Target benchmark: `<benchmark>`
Measurement mode: `<callgrind | codspeed simulation>`
Baseline command: `<command>`

| Commit  | Benchmark | Ir Before   | Ir After  | Delta             | Checks    | Notes      |
| ------- | --------- | ----------- | --------- | ----------------- | --------- | ---------- |
| `<sha>` | `<name>`  | `1,000,000` | `950,000` | `-50,000 (-5.0%)` | `<tests>` | `<reason>` |
```

## Stop Conditions

Stop and report when:

- Further improvements require semantic risk, broad rewrites, or benchmark changes.
- The best candidate improves one benchmark but regresses another important benchmark.
- Callgrind/CodSpeed cannot produce comparable data.
- The remaining hot path is outside the project, generated code, or a dependency that should be optimized separately.
