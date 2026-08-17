---
name: review-context-change
description: Use when comparing two compatible Rstack lint or test snapshots, including freshness, diagnostics, test outcomes, and stored lint fix previews.
---

# Review a context change

1. Call `project_status`, match the package by `context.packageRoot`, and use `snapshot_list` with that `contextId`.
2. Select two completed snapshots for the same producer, context, package root, config, and capture selection. The list is newest-first; pass the older ID as `leftSnapshotId`.
3. If a pair is missing, explain which consent-gated `lint_snapshot` or `test_snapshot` supplies it, including `packageRoot` and nonstandard `configPath`.
4. Call `snapshot_diff` with `diagnostics` for Rslint or `tests` for Rstest. Stop on incompatibility and report every reason.
5. Report both freshness values before the delta. Lead with new failures, then resolved items, then lower-severity or timing changes.
6. Call `code_evidence` for one changed file when exact-path diagnostics, statically related tests, or aggregate execution evidence helps. Keep every axis separate from the snapshot delta.
7. Use `lint_fix_preview` only as review material and never apply it.

Do not run a capture without approval. Recommend an explicit `rs lint`, `rs test`, or `rs test list --related` verification command.

The MCP is intentionally limited to the checkout containing the Codex project/session root and has no workspace argument. For an external checkout, ask the user to start a new Codex session rooted at that checkout.
