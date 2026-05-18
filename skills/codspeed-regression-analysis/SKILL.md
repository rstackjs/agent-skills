---
name: codspeed-regression-analysis
description: Use when analyzing CodSpeed performance regressions from GitHub Actions artifacts, Callgrind outputs, or CodSpeed check results. Helps compare a PR against a valid baseline, extract accesses and estimated_cycles, separate instruction-cache vs data-cache regressions, identify whether a slowdown comes from changed business logic or binary/data-layout side effects, and produce an evidence-based root-cause report.
---

# CodSpeed Regression Analysis

Prefer direct artifact evidence over intuition. Keep the analysis read-only unless the user explicitly asks for code changes.

## Core Workflow

1. Pick a valid baseline.
   - Prefer the PR head run and its true merge-base baseline.
   - Verify merge base, benchmark target, CodSpeed mode, and benchmark list before comparing numbers.
   - Stop and mark the comparison invalid if parity is missing.
2. Read the raw artifact, not only the GitHub check summary.
   - Prefer `codspeed-valgrind-tmp-*`.
   - Inspect `MANIFEST.txt`, `runner.log`, and the merged Callgrind output for the measured benchmark process.
3. Extract per-benchmark totals first.
   - Parse each `part:` and `desc: Trigger:` block.
   - Use `totals:` as the source of truth.
   - Compute `accesses` and `estimated_cycles` with [references/codspeed-metrics.md](references/codspeed-metrics.md).
4. Classify the shape before chasing hotspots.
   - Broad movement across many benchmarks suggests environment, benchmark, or toolchain drift.
   - A few moved benchmarks suggest a localized regression.
   - If cycles rise much more than accesses, inspect cache misses before assuming more work was done.
5. Split cache effects before assigning blame.
   - Break L1 growth into `I1mr`, `D1mr`, and `D1mw`.
   - `I1mr`-heavy regressions usually point to binary layout, code-size, or instruction-path changes.
   - `D1`-heavy regressions usually point to structure growth, allocation churn, or locality loss.
6. Inspect hotspots only for the regressed event.
   - Use `callgrind_annotate` on the extracted benchmark part.
   - Sort by `I1mr` for instruction-cache regressions and by `D1mr`/`D1mw` for data-cache regressions.
   - Prefer functions that explain a meaningful share of the changed event.
7. Distinguish direct and indirect regressions.
   - Search the extracted profile for changed files and symbols.
   - If the new code is not on the hot path but old hotspots worsen, explain the indirect mechanism instead of implying direct causality.
   - If the PR grew a widely carried struct or metadata object, quantify the size delta and use it only as evidence for data-cache regressions.
8. Report in this order.
   - Whether the comparison is valid
   - Whether the movement is broad or localized
   - The most affected benchmarks with before/after values
   - The main driver: accesses, `I1mr`, `D1mr`/`D1mw`, or LL misses
   - The most likely root cause, labeled direct or indirect
   - Excluded explanations such as baseline mismatch or benchmark mismatch

## Reporting Rules

- Quote exact run IDs, artifact names, SHAs, and benchmark names when available.
- Prefer percentages and absolute counts together.
- Mark inferences as inferences.
- If the benchmark does not execute the changed code directly, say so explicitly.
- Do not call tiny, noisy movement a real regression without stronger evidence.

## Useful Commands

Use these as patterns, not hard requirements:

```bash
gh run list --repo <owner/repo> --branch <branch> --workflow CI --limit 10
gh api repos/<owner>/<repo>/actions/runs/<run-id>/artifacts
gh run download <run-id> --repo <owner>/<repo> -n <artifact-name> -D /tmp/<dir>
grep -n '^part:\|^desc: Trigger:\|^totals:' <callgrind.out>
callgrind_annotate --show=Ir,Dr,Dw,I1mr,D1mr,D1mw,ILmr,DLmr,DLmw --sort=I1mr,D1mr,D1mw <part.out>
```

For metric interpretation, miss decomposition, and common false-positive patterns, read [references/codspeed-metrics.md](references/codspeed-metrics.md).
