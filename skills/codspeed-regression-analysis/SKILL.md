---
name: codspeed-regression-analysis
description: Use when analyzing CodSpeed performance regressions from GitHub Actions artifacts, Callgrind outputs, or CodSpeed check results. Helps compare a PR against a valid baseline, extract accesses and estimated_cycles, separate instruction-cache vs data-cache regressions, identify whether a slowdown comes from changed business logic or binary/data-layout side effects, and produce an evidence-based root-cause report.
---

# CodSpeed Regression Analysis

Prefer direct artifact evidence over intuition. Keep the analysis read-only unless the user explicitly asks for code changes.

## Core Workflow

1. Identify the exact comparison target.
   - Prefer the PR head run and its true baseline run from the same branch ancestry.
   - Verify the merge base before treating a `main` run as comparable.
   - Reject comparisons across different benchmark definitions, different targets, or different CodSpeed modes unless the report clearly labels them as non-comparable.
2. Verify measurement parity before interpreting deltas.
   - Confirm benchmark list and ordering from `runner.log`.
   - Confirm `codspeed` version, `cargo-codspeed` version, target triple, simulation mode, and important env vars such as `RAYON_NUM_THREADS`.
   - Treat missing parity as a blocker, not a footnote.
3. Download and inspect the raw profiling artifact.
   - Prefer the uploaded `codspeed-valgrind-tmp-*` artifact from the benchmark run.
   - Read `MANIFEST.txt`, `runner.log`, and the large merged Callgrind file referenced by the measured benchmark process.
   - Ignore tiny helper-process outputs except when they explain setup overhead or tool noise.
4. Extract per-benchmark totals before looking at individual functions.
   - Parse each `part:` block and its `desc: Trigger:` label from the merged Callgrind file.
   - Use the `totals:` line for each measured benchmark as the source of truth.
   - Compute `accesses` and `estimated_cycles` from the formulas in [references/codspeed-metrics.md](references/codspeed-metrics.md).
5. Classify the regression shape.
   - If most benchmarks move together in the same direction, suspect environment drift, benchmark definition drift, or a broad runtime/toolchain effect.
   - If only a few benchmarks move, focus on those specific stages or cases.
   - If `estimated_cycles` rises much more than `accesses`, inspect cache-miss growth before assuming algorithmic work increased.
6. Separate instruction-cache and data-cache effects.
   - Break L1 growth into `I1mr`, `D1mr`, and `D1mw`.
   - If `I1mr` dominates, suspect binary layout or instruction-path expansion before blaming data-structure growth.
   - If `D1mr`/`D1mw` dominate, inspect structure sizes, allocation patterns, hash-table churn, traversal order, and data locality.
   - Use the heuristics in [references/codspeed-metrics.md](references/codspeed-metrics.md) instead of hand-waving about “cache regressions”.
7. Compare hotspots only after totals establish the shape.
   - Run `callgrind_annotate` on the extracted benchmark part, sorted by the event that actually regressed.
   - For instruction-cache regressions, sort or inspect `I1mr` first.
   - For data-cache regressions, inspect `D1mr`, `D1mw`, and `DLmr` first.
   - Prefer functions that account for a meaningful share of the changed event, not just the largest absolute hotspot.
8. Distinguish direct execution from indirect side effects.
   - Search the extracted profile for the files and symbols changed by the PR.
   - If the new code is not on the hot path but old hotspots worsen, explain why this can still happen:
     binary layout changes, codegen differences, metadata size growth, changed inlining, or changed allocation/layout of shared structures.
   - Do not claim “the changed code is responsible” without either hot-path execution evidence or a coherent indirect mechanism.
9. Check for shared-structure expansion.
   - If the PR adds fields to widely carried structs or cached metadata, quantify the layout change directly.
   - Report the measured size delta when it is relevant to `D1` growth.
   - Treat shared-structure growth as secondary evidence for data-cache regressions, not instruction-cache regressions.
10. Produce a root-cause report in this order.

- State whether the comparison is valid.
- State whether the regression is broad or localized.
- List the largest affected benchmarks with before/after values and percentages.
- Explain whether the main driver is accesses, I1 misses, D1 misses, or LL misses.
- Identify the most likely root cause and clearly mark it as direct or indirect.
- List excluded explanations such as baseline mismatch, benchmark mismatch, or tool mismatch.

## Reporting Rules

- Quote exact run IDs, artifact names, SHAs, and benchmark names when available.
- Prefer percentages and absolute counts together.
- When a result is only a likely explanation, say so explicitly.
- When a benchmark does not execute the changed code directly, say that explicitly instead of implying causal certainty.
- Avoid calling a small and noisy change a “regression” if the total movement is near zero and the evidence is weak.

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
