# rspress-generate-docs - evaluation report

**Date:** 2026-06-15
**Model:** Not recorded in the raw run artifacts; timing artifacts only captured tokens and duration.
**Skill version:** `skills/rspress-generate-docs/SKILL.md` at `feat/rspress-generate-docs-eval` HEAD (`4efd2b6`)
**Iteration:** `skills/rspress-generate-docs-workspace/iteration-1`

## Setup

- **Eval definitions:** `skills-test/rspress-generate-docs/evals/evals.json`
- **Fixtures:** `skills/rspress-generate-docs-workspace/fixtures`
- **Run shape:** 3 evals, one `with_skill` run and one `without_skill` baseline per eval.
- **Grader:** assertion-based post-hoc checks in each run directory's `grading.json`.
- **Aggregate artifacts:** `skills/rspress-generate-docs-workspace/iteration-1/benchmark.json` and `benchmark.md`.

## Aggregate Results

| Config        | Assertion pass rate | Mean per-eval pass rate | Mean tokens | Mean time |
| ------------- | ------------------: | ----------------------: | ----------: | --------: |
| with_skill    |      12/12 (100.0%) |                  100.0% |       27.2k |    192.2s |
| without_skill |       11/12 (91.7%) |                   93.3% |       25.2k |    589.1s |

The skill improved assertion pass rate by 8.3 percentage points on this run and cut mean wall time by 396.8s. It used about 2.0k more tokens on average.

## Per-Eval Breakdown

| Eval                 | Config        | Passed | Total | Rate | Tokens |    Time |
| -------------------- | ------------- | -----: | ----: | ---: | -----: | ------: |
| create-new-docs      | with_skill    |      5 |     5 | 100% |  24.2k |  172.9s |
| create-new-docs      | without_skill |      4 |     5 |  80% |  29.0k | 1338.4s |
| maintain-docs-for-pr | with_skill    |      4 |     4 | 100% |  36.8k |  244.0s |
| maintain-docs-for-pr | without_skill |      4 |     4 | 100% |  29.5k |  325.1s |
| migrate-rspress-v1   | with_skill    |      3 |     3 | 100% |  20.6k |  159.8s |
| migrate-rspress-v1   | without_skill |      3 |     3 | 100% |  16.9k |  103.7s |

## Findings

- **create-new-docs:** The skill-guided run passed all checks. The baseline produced working docs but used `rspress@^1.0.0`, so it failed the Rspress v2 dependency assertion. This is the only failed assertion in the benchmark.
- **maintain-docs-for-pr:** Both runs passed. The eval confirms the task is achievable without the skill, so future iterations may need stricter assertions around matching existing Rspress conventions if this case should differentiate skill value.
- **migrate-rspress-v1:** Both runs passed. The baseline was faster and used fewer tokens on this small fixture, but the skill-guided run also completed the v2 migration correctly.

## Raw Artifacts

- `skills/rspress-generate-docs-workspace/iteration-1/create-new-docs/with_skill`
- `skills/rspress-generate-docs-workspace/iteration-1/create-new-docs/without_skill`
- `skills/rspress-generate-docs-workspace/iteration-1/maintain-docs-for-pr/with_skill`
- `skills/rspress-generate-docs-workspace/iteration-1/maintain-docs-for-pr/without_skill`
- `skills/rspress-generate-docs-workspace/iteration-1/migrate-rspress-v1/with_skill`
- `skills/rspress-generate-docs-workspace/iteration-1/migrate-rspress-v1/without_skill`
