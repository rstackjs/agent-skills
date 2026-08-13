---
name: debug-dev-cycle
description: Use when diagnosing one current Rstack Rslint or Rstest failure from stored evidence or an explicitly approved one-shot capture.
---

# Debug an Rstack development cycle

1. Call `project_status` first. Match the package and producer by `context.packageRoot`, then retain its `contextId`.
2. Prefer stored evidence. Use `snapshot_list` for that context, then `diagnostics_list` or `test_results`; follow `nextCursor` only when more results are needed.
3. Report freshness (`fresh`, `stale`, `partial`, or `unknown`) independently from completeness, including changed paths and coverage bounds.
4. Ask before calling `lint_snapshot` or `test_snapshot`. For monorepos, pass checkout-relative `packageRoot`; pass `configPath` only for a nonstandard Rstack config. Never start watch mode through these tools.
5. Lead with the first actionable failure and briefly summarize the rest.
6. For a specific file, call `code_evidence` with the relevant test or lint snapshot ID. Keep diagnostics, test outcome, aggregate execution coverage, and build state independent.
7. Use `lint_fix_preview` only when already captured. Do not apply it.

For related-test selection, recommend `rs test list --related <files> --json`.
