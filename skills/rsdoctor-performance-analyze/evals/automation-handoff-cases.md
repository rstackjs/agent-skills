# Automation Handoff Eval Cases

Use these cases when changing `rsdoctor-performance-analyze` or its integration with `rsdoctor-analysis`.

## Case 1: Latest Manifest Discovery

Prompt:

```text
Use the latest rsdoctor-trace capture to analyze page performance.
```

Expected behavior:

- Reads `references/automation-contract.md`.
- Looks for `.rsdoctor-performance/latest.json` before asking for a trace path.
- Consumes the trace and existing summaries when present.
- Produces or references `trace-summary.json`, `network-summary.json`, `script-cost-summary.json`, `long-task-context.json`, and `diagnosis.md`.
- Does not ask the user to paste the trace filename when the manifest is present.

## Case 2: Chrome Extension Capture

Prompt:

```text
Use the rsdoctor-trace Chrome plugin to capture this logged-in page and analyze it.
```

Expected behavior:

- Treats the user's current authenticated tab as the source of truth.
- Uses the extension/local receiver contract rather than requesting credentials, cookies, or headers.
- Preserves the raw trace and writes normalized summaries next to it.
- Updates `.rsdoctor-performance/latest.json` only after a successful local artifact write.

## Case 3: Runtime-Only Finding

Prompt:

```text
Analyze the latest trace. The page is slow because the document request is delayed.
```

Expected behavior:

- Keeps the diagnosis in the runtime lane.
- Does not call `rsdoctor-analysis` when the issue is server latency, auth redirect, API latency, image delivery, or another non-bundle symptom.
- Reports bundle analysis as unnecessary or unavailable for the current evidence.

## Case 4: Bundle Handoff Trigger

Prompt:

```text
Analyze the latest trace and combine it with rsdoctor-data.json if the route is blocked by JS.
```

Expected behavior:

- Builds a compact handoff with `runtimeSymptoms`, `candidateAssets`, `requestedEvidence`, and output artifact paths.
- Calls `rsdoctor-analysis` only after runtime evidence identifies emitted JS/CSS candidates.
- Separates browser symptoms from bundle facts in the final diagnosis.
- Writes or references `bundle-summary.json` and `correlation-report.json`.

## Case 5: Missing Rsdoctor Data

Prompt:

```text
The latest trace points at a large app chunk, but no rsdoctor-data.json exists.
```

Expected behavior:

- Does not run `rsdoctor-agent` against the trace JSON.
- Hands off to `rsdoctor-analysis` missing-data recovery rules.
- Explains whether Generation Gate setup/build is needed before bundle attribution.
- Keeps the runtime diagnosis useful even without bundle attribution.

## Case 6: Before/After Trace Comparison

Prompt:

```text
Compare the old and new rsdoctor-trace JSON files and tell me whether the optimization worked.
```

Expected behavior:

- Normalizes both traces before comparing.
- Compares same route/mode/cache/auth assumptions and calls out mismatches.
- Reports deltas for vitals, total long-task time, top script cost, request count, transfer size, and candidate assets.
- Does not claim a bundle optimization is validated unless the measured route loaded the changed emitted asset or hash.
