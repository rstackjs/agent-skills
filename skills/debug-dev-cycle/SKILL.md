---
name: debug-dev-cycle
description: Use when diagnosing one current Rstack Rslint or Rstest failure from stored evidence or an explicitly approved one-shot capture.
---

# Debug an Rstack development cycle

1. Call `project_status` first. Match the package and producer by `context.packageRoot`, then retain its `contextId`.
2. Prefer stored evidence. Use `snapshot_list` for that context, then `diagnostics_list` or `test_results`; follow `nextCursor` only when more results are needed.
3. Report freshness (`fresh`, `stale`, `partial`, or `unknown`) independently from completeness, including changed paths and coverage bounds.
4. Ask before calling `lint_snapshot` or `test_snapshot`. Always copy checkout-relative `context.packageRoot` from `project_status`; do not substitute the agent's current directory with `.` in a nested package. Pass `configPath` only for a nonstandard Rstack config. Never start watch mode through these tools.
5. When `test_snapshot` fails, inspect its `errors` first. A file- or run-scoped error can explain why `test_results` contains no cases. Lead with the first actionable failure and briefly summarize the rest.
6. For a specific source file, an approved `test_snapshot` with `related: [path]` asks Rstest to select and run only statically related tests. Use one source per capture so `code_evidence.testRelation` is attributable to that source.
7. Call `code_evidence` with the relevant test or lint snapshot ID. Keep static test relation, exact-path test outcome, aggregate execution coverage, diagnostics, and build state independent.
8. Use `lint_fix_preview` only when already captured. Do not apply it.

Use `rs test list --related <files> --json` when the user wants listing without an MCP capture or test execution.

Use only producers configured for the selected package. If Rstest or Rslint is absent, report that axis as unavailable; do not install or configure it as part of diagnosis.
