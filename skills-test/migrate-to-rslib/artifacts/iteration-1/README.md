# migrate-to-rslib iteration 1 audit bundle

This directory preserves the lightweight evidence needed to audit the committed report.

- `benchmark.json` and `benchmark.md` contain the aggregate.
- Valid runs preserve `grading.json`, `timing.json`, extracted `turn.completed` usage, the executor's final message, and the source diff without lockfile churn.
- The invalid first tsc pair preserves its exclusion record, timing, final message, extracted usage, and failed command evidence. The replacement pair is `run-2`.
- Full event streams, dependency trees, build output, and the generated HTML viewer are intentionally omitted.

The evaluated skill snapshot is commit `c426a8b3d2e9c12303490754faa2fcd2f6cacace`.
