# Rsdoctor Trace Automation Contract

Use this reference when `rsdoctor-performance-analyze` is driven by a Chrome extension, a local trace receiver, an existing raw trace JSON file, or an automatic follow-up analyzer.

## Goals

- Let the agent discover the newest trace without asking the user to paste a filename.
- Keep raw browser trace evidence separate from compact summaries and bundle evidence.
- Let `rsdoctor-performance-analyze` call `rsdoctor-analysis` with a small, deterministic handoff when emitted assets explain runtime symptoms.
- Keep all artifacts local, redacted, and stable enough for before/after comparison.

## Artifact Layout

Store local runtime artifacts under the current workspace:

```text
.rsdoctor-performance/
  latest.json
  <YYYYMMDD-HHMMSS>-<host-or-route-slug>/
    manifest.json
    trace.json
    trace.json.gz
    trace-summary.json
    network-summary.json
    script-cost-summary.json
    long-task-context.json
    bundle-summary.json
    correlation-report.json
    diagnosis.md
```

`trace.json` and `trace.json.gz` are alternatives. Preserve the receiver's raw file exactly and write normalized summaries next to it.

## Latest Manifest

`.rsdoctor-performance/latest.json` is the default entrypoint for follow-up analysis:

```json
{
  "version": 1,
  "source": "rsdoctor-trace-extension",
  "captureId": "20260630-150209-business.oceanengine.com",
  "capturedAt": "2026-06-30T07:02:09.000Z",
  "url": "https://example.com/path",
  "host": "example.com",
  "authState": "user-authenticated",
  "cacheState": "unknown",
  "trace": ".rsdoctor-performance/<capture>/trace.json",
  "traceSummary": ".rsdoctor-performance/<capture>/trace-summary.json",
  "networkSummary": ".rsdoctor-performance/<capture>/network-summary.json",
  "scriptCostSummary": ".rsdoctor-performance/<capture>/script-cost-summary.json",
  "longTaskContext": ".rsdoctor-performance/<capture>/long-task-context.json",
  "bundleSummary": ".rsdoctor-performance/<capture>/bundle-summary.json",
  "correlationReport": ".rsdoctor-performance/<capture>/correlation-report.json",
  "diagnosis": ".rsdoctor-performance/<capture>/diagnosis.md"
}
```

If any artifact is missing, keep the field and set it to `null` in generated summaries. Do not silently drop fields because downstream analysis depends on stable keys.

## Chrome Extension And Receiver

The `rsdoctor-trace` Chrome extension should collect from the currently selected authenticated tab. It can use Chrome DevTools Protocol through `chrome.debugger`:

1. Attach to the active tab.
2. Start tracing with browser/devtools timeline, loading, network, v8, blink, screenshot, and disabled-by-default devtools timeline categories when available.
3. Trigger reload only when the user requests a reload capture.
4. Stop tracing and stream trace chunks.
5. Send trace chunks plus metadata to a local receiver on loopback.

The receiver writes files; the extension should not assume it can write arbitrary local paths directly.

Recommended receiver request:

```json
{
  "version": 1,
  "source": "rsdoctor-trace-extension",
  "url": "https://example.com/path",
  "title": "Page title",
  "capturedAt": "2026-06-30T07:02:09.000Z",
  "cacheState": "unknown",
  "mode": "authenticated-reload",
  "traceEvents": []
}
```

The receiver response should include the capture directory, manifest path, and latest manifest path:

```json
{
  "ok": true,
  "captureId": "20260630-150209-business.oceanengine.com",
  "captureDir": ".rsdoctor-performance/20260630-150209-business.oceanengine.com",
  "trace": ".rsdoctor-performance/20260630-150209-business.oceanengine.com/trace.json",
  "manifest": ".rsdoctor-performance/20260630-150209-business.oceanengine.com/manifest.json",
  "latestManifest": ".rsdoctor-performance/latest.json"
}
```

Do not include cookies, headers, local storage, request bodies, response bodies, or user identifiers in extension metadata.

## Offline Trace Summary

`trace-summary.json` should be compact and deterministic:

```json
{
  "source": "chrome-trace",
  "trace": ".rsdoctor-performance/<capture>/trace.json",
  "url": "https://example.com/path",
  "capturedAt": "2026-06-30T07:02:09.000Z",
  "navigation": {
    "startTimeMs": 0,
    "domContentLoadedMs": null,
    "loadEventMs": null,
    "firstPaintMs": null,
    "firstContentfulPaintMs": null,
    "largestContentfulPaintMs": null
  },
  "mainThread": {
    "totalLongTaskMs": 0,
    "topLongTasks": [],
    "scriptEvaluateMs": 0,
    "scriptCompileMs": 0,
    "styleLayoutPaintMs": 0
  },
  "network": {
    "requestCount": 0,
    "encodedKB": 0,
    "topResources": []
  },
  "candidateAssets": [],
  "gaps": []
}
```

Populate `gaps` when a metric is unavailable because the trace lacks the required event family.

## Runtime-To-Bundle Correlation Gate

Run `rsdoctor-analysis` only when at least one condition is true:

- Initial or route-critical script asset is large, for example `encodedKB > 500`.
- A script URL has high browser cost, for example `scriptCostMs > 100`.
- Long-task total is high, for example `totalLongTaskMs > 600`, and the top task is attributed to an emitted script.
- The trace names emitted JS/CSS assets that match common bundle URL patterns, hashed filenames, route chunks, vendor chunks, or configured public paths.
- The user explicitly asks to combine runtime trace and bundle analysis.

Skip bundle correlation when the symptom is only server latency, third-party-only execution, image delivery, font loading, auth redirects, API latency, or missing trace instrumentation.

## Handoff To Rsdoctor Analysis

Write a small handoff file when correlation is needed:

```json
{
  "source": "rsdoctor-performance-analyze",
  "traceSummary": ".rsdoctor-performance/<capture>/trace-summary.json",
  "candidateAssets": [],
  "runtimeSymptoms": [],
  "requestedEvidence": [
    "assetsTop",
    "packagesTop",
    "duplicatePackages",
    "crossChunkPackages",
    "retainedModulesTop"
  ],
  "output": {
    "bundleSummary": ".rsdoctor-performance/<capture>/bundle-summary.json",
    "correlationReport": ".rsdoctor-performance/<capture>/correlation-report.json"
  }
}
```

`rsdoctor-analysis` should treat this as prioritization context, not as proof that a dependency caused a browser metric. The final diagnosis must still separate runtime evidence from bundle evidence.

## Before/After Comparison

When comparing two traces:

- Normalize both into `trace-summary.json` first.
- Compare same route, mode, viewport, cache state, and auth state when possible.
- Report deltas for LCP/FCP/load, total long-task time, top script cost, request count, transfer size, and candidate asset changes.
- If a code change was expected to alter bundles, compare the emitted asset basenames/hashes before claiming validation.
