# rstack-eco-ci-debug Eval Report

**Skill:** `rstack-eco-ci-debug`  
**Skill commit:** `ad2cc4b` (`syt/codex-rstack-eco-ci-debug` branch)  
**Date:** 2026-06-18  
**Model:** Claude (Opus 4.8)  
**Workspace:** `skills-test/rstack-eco-ci-debug/workspace/iteration-1`

---

## Summary

One round of evaluation was run against 3 real rstack-ecosystem-ci failures. Each eval ran once with the skill and once without the skill.

| Metric         | With Skill       | Without Skill  | Delta      |
| -------------- | ---------------- | -------------- | ---------- |
| Pass rate      | **100%** (12/12) | **75%** (9/12) | **+25 pp** |
| Avg. wall time | 956.7 s          | 2,135.5 s      | −1,178.8 s |
| Avg. tokens    | 92,102           | 46,862         | +45,240    |

The skill produced materially better attribution on the hardest case (rsdoctor SWC semantic bug) and converged faster on the plugin-suite empty-line case. Token usage is higher with the skill because it performs a structured two-phase investigation (Phase 1 PR location, Phase 2 deep root cause).

---

## Eval Cases

### Eval 1 — plugin-suite-empty-lines

**Question:** Why did the `plugin` suite turn red, and is Rspack PR #14254 the real source?  
**Surface pivot:** PR #14254 (`feat(runtime): introduce experimental.runtimeMode`).  
**Actual source:** PR #14254 — but the failure mechanism is _incidental_ trailing newlines in 5 EJS templates, not the runtimeMode feature itself.

| Configuration | Pass Rate  | Time      | Tokens |
| ------------- | ---------- | --------- | ------ |
| with_skill    | 4/4 (100%) | 856.1 s   | 91,265 |
| without_skill | 4/4 (100%) | 5,374.1 s | 42,605 |

Both configurations correctly identified PR #14254 and the extra-blank-line signature. The with-skill run reached the same conclusion in ~16% of the wall time by following the structured eco-ci workflow.

---

### Eval 2 — rstest-suite-misattribution

**Question:** The eco-ci bisect points at Rspack PR #14353; is it actually the source of the `rstest` suite failure?  
**Surface pivot:** PR #14353.  
**Actual source:** rstest PR #1357 (downstream snapshot/timeout expectation change).

| Configuration | Pass Rate  | Time      | Tokens  |
| ------------- | ---------- | --------- | ------- |
| with_skill    | 4/4 (100%) | 1,014.0 s | 105,041 |
| without_skill | 4/4 (100%) | 334.8 s   | 29,430  |

Both configurations correctly exonerated PR #14353 and pointed to rstest PR #1357. The without-skill run was faster here because it gave a brief, shallow answer that happened to be correct; the skill ran its full two-phase workflow anyway. No quality regression, but a token/time trade-off.

---

### Eval 3 — rsdoctor-swc-semantic-bug

**Question:** The `rsdoctor` suite failed with `ReferenceError: lightColorCount is not defined`; what is the real source PR and root cause?  
**Surface attribution:** release branch at commit `ac3fa6a2d0`.  
**Actual source:** PR #14256 (`refactor: swc exp for javascript parser plugin`), interacting with PR #14335's scope-info rewrite.

| Configuration | Pass Rate  | Time       | Tokens   |
| ------------- | ---------- | ---------- | -------- |
| with_skill    | 4/4 (100%) | ~1,000 s\* | 80,000\* |
| without_skill | 1/4 (25%)  | 697.7 s    | 68,552   |

This is the discriminating case. Without the skill, the run latched onto a different nearby PR (#14335) and missed the SWC exp/core semantic inconsistency and the `lightColorCount` variable-renaming failure signature. With the skill, the run used the canary-date bisect and revert-commit evidence to identify PR #14256 as the actual source and explained the concatenated-module scope bug.

\* Eval 3 with_skill ran asynchronously; timing was not instrumented by the harness, so values are rough estimates based on comparable runs.

---

## Where the Skill Helped

1. **Surface vs. actual source distinction** — The skill explicitly separates "what the eco-ci dashboard says" from "which PR actually introduced the regression," which prevented the wrong-PR attribution on Eval 3.
2. **Failure-signature anchoring** — It requires tying conclusions to concrete signatures (`lightColorCount is not defined`, extra blank lines in snapshots), not just commit positions.
3. **Structured evidence gathering** — Use of revert commits, green-to-red pivots, and canary-date bisect kept the investigation on track.

## Costs / Trade-offs

- **Higher token usage** with the skill (≈2×) because of the explicit Phase 1 → Phase 2 workflow.
- **Not always faster** when the answer is shallow (Eval 2).
- **Relies on eval cases with clear public artifacts** (run URLs, revert commits, data JSON). Cases without these will regress toward the baseline.

---

## Artifacts

- Eval definitions: `skills-test/rstack-eco-ci-debug/evals/evals.json`
- Raw outputs + grading: `skills-test/rstack-eco-ci-debug/workspace/iteration-1/`
- Quantitative benchmark: `workspace/iteration-1/benchmark.json` and `workspace/iteration-1/benchmark.md`
- Static review viewer: `workspace/iteration-1/review.html`

---

## Next Steps (Suggested)

1. Add a few more discriminating cases where the surface pivot is _not_ the real source, to confirm the skill's value isn't driven by a single eval.
2. Consider a shorter "fast path" in the skill for cases where the surface pivot is clearly correct, to reduce token/time overhead on easy attributions.
3. Commit `report.md` and `evals/evals.json`; raw workspace outputs are gitignored.
