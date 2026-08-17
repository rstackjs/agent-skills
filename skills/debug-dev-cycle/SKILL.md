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
6. For a specific source file, inspect its imports and prefer a directly imported leaf source over a barrel or entry point that can cause a broad selection. When supported, run `rs test list --related <source> --files-only --json` to list statically related test files before asking for or calling a related `test_snapshot`. Report the selected test file count. If the selection is unexpectedly broad, warn about the broad selection and ask whether to run it or narrow the source; if listing is unsupported, say the preflight is unavailable. Use one source per approved capture so `code_evidence.testRelation` is attributable to that source.
7. Call `code_evidence` with the relevant test or lint snapshot ID. Pass `contextId` only when also joining an explicit Rsdoctor `dataFile`; omit both for test/lint-only evidence. Keep static test relation, exact-path test outcome, aggregate execution coverage, diagnostics, and build state independent.
8. If aggregate execution reports `provider-unavailable`, call it optional missing evidence—not zero execution or dead-code evidence. Only when the user wants coverage, offer to add `@rstest/coverage-istanbul` at the exact installed `@rstest/core` version and rerun; do not install it automatically.
9. Use `lint_fix_preview` only when already captured. Do not apply it.

If `rs test` reports that tests are not configured while a standalone `rstest.config.*` exists, explain that Rstack does not auto-adopt that file. Preserve it as the source of truth with a minimal bridge:

```ts
// rstack.config.ts
import { define } from 'rstack';
import rstestConfig from './rstest.config';

define.test(rstestConfig);
```

Use only producers configured for the selected package. If Rstest or Rslint is absent, report that axis as unavailable; do not install or configure it as part of diagnosis.

The MCP is intentionally limited to the checkout containing the Codex project/session root and has no workspace argument. For an external checkout, ask the user to start a new Codex session rooted at that checkout.
