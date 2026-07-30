# migrate-to-rslib iteration 1 audit bundle

This directory preserves the lightweight evidence needed to audit the committed report.

- `benchmark.json` and `benchmark.md` contain the aggregate.
- Valid runs preserve schema-valid `grading.json`, sidecar run metadata and validation evidence, timing, extracted `turn.completed` usage with source hashes, the executor's final message, and a complete workspace patch including lockfile changes and newly created files.
- The invalid first tsc pair preserves its exclusion record, timing, final message, extracted usage, and failed command evidence. The replacement pair is `run-2`.
- Full event streams, dependency trees, generated build output, and the HTML viewer are intentionally omitted. Their retained hashes and structured evidence keep the lightweight bundle auditable without making generated scratch trees trackable.

The evaluated skill snapshot is commit `c426a8b3d2e9c12303490754faa2fcd2f6cacace`.
