---
name: rsdoctor-performance-analyze
description: Diagnose Rspack, Rsbuild, Rslib, Rspress, Modern.js, or Webpack page runtime performance from user-authenticated reload-generated Performance Insights or rsdoctor-trace Chrome-extension data saved locally. Use for LCP, INP, CLS, network waterfalls, long tasks, hydration, browser-observed performance, local trace JSON auto-analysis, and runtime-to-bundle correlation. For build artifact analysis, build-time analysis, bundle, chunk, package duplication, asset weight, or tree-shaking analysis, use rsdoctor-analysis instead.
---

# Rsdoctor Performance Analyze

This skill starts from user-authenticated browser runtime evidence:

- **Performance Insights lane**: runtime page performance from a reload trace on the selected authenticated page, with DevTools/Lighthouse Performance Insights automatically calculated and persisted to local artifacts.
- **Chrome extension/local trace lane**: raw Chrome trace JSON captured by the `rsdoctor-trace` extension and saved by a local receiver, with the latest capture discovered from a manifest instead of manual file names.
- **Rsdoctor context**: optional artifact context from `rsdoctor-data.json` only after Performance Insights/trace evidence shows the page is affected by emitted assets or chunks.

Do not claim Rsdoctor provides browser runtime metrics. Use Rsdoctor for what the bundler knows, and Performance Insights traces for what the page actually does in a browser.

The preferred auth model is: the user opens the target app in their own browser session, completes login and any required MFA manually, navigates to the page or flow under test, then asks the agent to trigger a reload Performance Insights capture against that already-authenticated page. Do not ask the user for credentials, cookies, tokens, or one-time codes.

For build artifact analysis or build-time analysis, install and use `rsdoctor-analysis` with `npx skills add rstackjs/agent-skills --skill rsdoctor-analysis`. For bundle-only questions such as chunk composition, duplicate packages, similar packages, asset weight, or tree-shaking, stop and use `rsdoctor-analysis`. This skill may use those Rsdoctor signals only when they explain a measured browser-runtime symptom.

This first version intentionally does **not** implement advanced bundle-size experiments. Treat chunk-group reachability, retained-unused disposition, export-usage roots, sideEffects experiments, and splitChunks experiments as future `rsdoctor-analysis` follow-ups, not work for this skill.

## Evidence Router

Choose the lane from the user's question:

| User intent                                                                   | Primary lane                     | Add Rsdoctor context when...                            |
| ----------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| Authenticated page LCP, INP, CLS, TBT, long tasks, hydration, network          | Reload Performance Insights      | Bundle structure may explain the runtime bottleneck     |
| "Page performance is bad" without details                                     | Reload Performance Insights      | Emitted assets or chunks appear in the browser evidence |
| Before/after runtime optimization validation                                  | Reload Performance Insights      | The optimization changed emitted assets or chunking     |
| "This route loads too much JS and feels slow"                                 | Reload Performance Insights      | Trace or waterfall confirms JS is on the critical path  |
| Accessibility, SEO, best practices, agentic browsing                          | Lighthouse audit                 | Only if emitted assets explain a measured runtime issue |
| Build time, build artifact, bundle, chunk, dependency, asset, or tree-shaking | `rsdoctor-analysis`              | Return here only if there is a browser-runtime symptom  |

When both lanes are used, keep them distinct in notes and merge only in the final diagnosis.

Routing examples:

- "Analyze LCP on this page" -> Performance Insights lane first.
- "Why is my bundle large?" -> `rsdoctor-analysis`, not this skill.
- "This route loads too much JS and feels slow" -> Performance Insights lane first; add Rsdoctor context only if browser evidence shows JS download, parse, evaluation, or hydration is relevant.

If the user mentions `rsdoctor-trace`, a Chrome plugin, local trace JSON, `latest.json`, or automatic trace analysis, read and follow [references/automation-contract.md](references/automation-contract.md) before collecting or interpreting data.

## Guardrails

- Runtime performance evidence must come from reload-generated Performance Insights trace data, not Rsdoctor.
- Chrome-extension traces are acceptable only when they are raw DevTools/Chrome trace events captured from the user's authenticated tab and saved locally by the `rsdoctor-trace` workflow. Treat them as runtime evidence, not bundle evidence.
- Treat `lighthouse_audit` as non-performance audit evidence. It covers accessibility, SEO, best practices, and agentic browsing; for performance, use `performance_start_trace`, `performance_stop_trace`, and `performance_analyze_insight`.
- Default to a reload trace with `reload: true`, `autoStop: true`, and a local `filePath`. This mirrors the DevTools Performance panel reload button and lets the tool calculate Performance Insights.
- Always preserve a local raw trace and a compact local summary when the filesystem is available. The final answer must name these artifact paths.
- Prefer `.rsdoctor-performance/latest.json` over asking the user to retype a trace filename. If the manifest is present and fresh enough for the request, use it as the entrypoint.
- Rsdoctor analysis should use `@rsdoctor/agent-cli@latest` against `rsdoctor-data.json`.
- Keep the default workflow read-only. Recommend edits; only modify code/config after the user asks.
- Prefer small, targeted data pulls. Use `--filter`, `--compact`, `--page-size`, and bounded `--limit`.
- A recommendation needs a measured symptom and a plausible cause. Avoid generic advice.
- If Performance Insights/trace data and Rsdoctor data disagree, say so and explain the gap instead of forcing one story.
- If `rsdoctor-data.json` is missing, continue the runtime diagnosis with Chrome evidence and list Rsdoctor attribution as a gap.
- If Chrome DevTools MCP is unavailable, stop before diagnosing runtime performance and give the setup instructions below.
- Do not paste cookies, auth headers, bearer tokens, local storage values, request bodies, or private response payloads into the final report. Summarize sensitive requests by origin, type, size, timing, and status only.

## Automated Local Trace Workflow

Use this workflow when a trace already exists locally, when the user uses the `rsdoctor-trace` Chrome extension, or when the user wants the skill to collect and analyze trace JSON with minimal manual intervention.

1. Discover the capture:
   - Prefer a user-provided trace path.
   - Otherwise read `.rsdoctor-performance/latest.json`.
   - If no manifest exists, search only bounded local locations such as `.rsdoctor-performance/**/trace.json`, `.rsdoctor-performance/**/trace.json.gz`, and `rsdoctor-trace-*.json`, excluding `node_modules` and `.git`.
2. Normalize the trace:
   - Parse raw Chrome trace events, gzipped trace files, or DevTools trace JSON envelopes.
   - Write a compact `trace-summary.json` with navigation timing, vitals when derivable, long tasks, script evaluation/compile cost, render/layout/style cost, screenshots availability, and top network resources.
   - Write separate bounded files for `network-summary.json`, `script-cost-summary.json`, and `long-task-context.json` when the data exists.
3. Diagnose runtime symptoms first:
   - Identify LCP/FCP/TTFB/CLS/INP/TBT when present.
   - Identify long tasks and blocking scripts by URL, frame, task duration, and event category.
   - Identify render-blocking or late-discovered requests by URL, type, size, timing, initiator, and cache state.
4. Decide whether bundle handoff is needed:
   - Invoke `rsdoctor-analysis` only when the runtime evidence names emitted JS/CSS assets, oversized chunks, duplicated route-critical code, high script evaluation/compile cost, or tree-shaking-like retained code.
   - Do not invoke `rsdoctor-analysis` for server latency, third-party-only delays, image delivery, font loading, layout shifts without emitted asset suspects, or missing browser metrics.
5. Persist a diagnosis:
   - Write `diagnosis.md` with browser symptoms, bundle correlations, confidence, and next evidence categories.
   - Update `.rsdoctor-performance/latest.json` only when this workflow produced a newer local analysis artifact set.
   - Final answers must name the trace, summary, correlation, and diagnosis paths that were actually produced or consumed.

## Runtime-To-Bundle Handoff

When runtime evidence points at emitted assets or chunks, build a small handoff object for `rsdoctor-analysis` instead of asking the user to restate context:

```json
{
  "source": "rsdoctor-performance-analyze",
  "traceSummary": ".rsdoctor-performance/<capture>/trace-summary.json",
  "runtimeSymptoms": [
    {
      "type": "long-script-task",
      "priority": "High",
      "evidence": "script evaluation blocked the main thread for <durationMs>ms",
      "timeRangeMs": [0, 0]
    }
  ],
  "candidateAssets": [
    {
      "url": "https://example.com/static/js/vendor.abc123.js",
      "basename": "vendor.abc123.js",
      "hash": "abc123",
      "resourceType": "script",
      "encodedKB": 0,
      "scriptCostMs": 0,
      "reason": "large initial script with high evaluation cost"
    }
  ],
  "rsdoctorDataCandidates": [
    "dist/rsdoctor-data.json",
    "output/rsdoctor-data.json",
    ".rsdoctor/rsdoctor-data.json"
  ],
  "requestedEvidence": [
    "assetsTop",
    "packagesTop",
    "duplicatePackages",
    "crossChunkPackages",
    "retainedModulesTop"
  ]
}
```

The handoff must stay compact: include top suspects, not the full trace. `rsdoctor-analysis` remains responsible for locating or generating `rsdoctor-data.json`, running bounded bundle evidence commands, and returning a bundle-only explanation. This skill remains responsible for merging that output back into runtime diagnosis.

## User-Authenticated Capture

Prefer this workflow when login, SSO, MFA, VPN, internal auth, tenant selection, or role-based routing matters:

1. Ask the user to open the target URL in their normal browser context, log in manually, and navigate to the exact page or flow state to measure.
2. Use the Lighthouse/plugin page tools to `list_pages`, select the matching tab, and verify the route with a snapshot, title, URL, or visible app text.
3. Do not navigate away from the page before capture unless the user explicitly wants a reload measurement. Login-sensitive apps often lose state when an automated browser starts a fresh profile.
4. Use an authenticated reload recording by default. Use current-state interaction recording only when the user explicitly asks to diagnose an interaction that cannot be reproduced by reload.
5. If the user flow itself is sensitive, ask the user to perform the interaction during recording; otherwise the agent may perform non-sensitive clicks/typing after the user confirms the page state.

## Reload Insights Capture

This is the default collection protocol for this skill.

1. Select the authenticated page:
   - Use `list_pages`, then `select_page` for the tab the user already logged into.
   - Verify page identity with URL, title, visible app text, or a lightweight snapshot. Do not read cookies, local storage, auth headers, or private payloads.
2. Prepare a local artifact directory:
   - If the user gives an output directory, use it.
   - Otherwise use `.rsdoctor-performance/<YYYYMMDD-HHMMSS>-<host-or-route-slug>/` under the current workspace.
   - Use stable filenames: `trace.json.gz` or `trace.json`, `insights-summary.json`, `trace-summary.json`, `diagnosis.md`, and optional `network-summary.json`, `script-cost-summary.json`, `long-task-context.json`, `network-requests.json`, or `console.json`.
   - When the capture comes from the `rsdoctor-trace` Chrome extension, keep the receiver's raw trace filename and add normalized summaries beside it instead of rewriting the raw trace.
3. Start a reload trace:
   - Call `performance_start_trace` with `reload: true`, `autoStop: true`, and `filePath` set to the local `trace.json.gz`.
   - This should reload the selected authenticated page, stop automatically, calculate metrics and Performance Insights, and save the raw trace locally.
   - If the tool starts but does not auto-stop, call `performance_stop_trace` with the same `filePath`.
4. Persist the returned data locally:
   - Save the trace tool response, selected insight set id, metrics, insight names, savings estimates, and artifact metadata to `insights-summary.json`.
   - If multiple insight sets are returned, choose the set for the current authenticated reload navigation. Record the skipped set ids in `insights-summary.json` instead of mixing them.
   - Save only compact request metadata: URL origin/path, resource type, status, transfer size, timing, initiator, and cache information. Do not save request or response bodies unless the file is a public static asset and directly relevant.
   - Redact query tokens, authorization-like headers, cookies, and user identifiers from any saved summary.
5. Expand actionable insights:
   - Use only the insight names and insight set ids returned by the trace tool. Do not invent insight names.
   - Call `performance_analyze_insight` for non-passing or high-savings insights such as document latency, LCP breakdown, render-blocking requests, layout shifts, network dependency tree, image delivery, font display, third-party impact, cache lifetime, or legacy JavaScript when those names are available.
   - Save each expanded result under `insight-details/<insight-name>.json` when it adds evidence not already in the summary.
6. Return the local artifact paths in the final report.

### Local Data Contract

The local `insights-summary.json` should be compact and stable enough for follow-up tooling:

```json
{
  "source": "devtools-performance-insights",
  "capture": {
    "mode": "authenticated-reload",
    "url": "<redacted-url>",
    "startedAt": "<iso-time>",
    "traceFile": "<local-path>",
    "viewport": "<known-or-unknown>",
    "cacheState": "<cold|warm|unknown>",
    "authState": "user-authenticated"
  },
  "metrics": {
    "lcpMs": null,
    "inpMs": null,
    "cls": null,
    "fcpMs": null,
    "ttfbMs": null,
    "tbtMs": null,
    "speedIndexMs": null
  },
  "insights": [
    {
      "name": "<tool-insight-name>",
      "status": "<pass|warning|fail|unknown>",
      "estimatedSavings": "<tool-value-or-null>",
      "summary": "<short-evidence>",
      "detailsFile": "<local-path-or-null>"
    }
  ],
  "artifacts": {
    "trace": "<local-path>",
    "traceSummary": "<local-path-or-null>",
    "network": "<local-path-or-null>",
    "console": "<local-path-or-null>",
    "bundleSummary": "<local-path-or-null>",
    "correlation": "<local-path-or-null>",
    "diagnosis": "<local-path-or-null>",
    "latestManifest": ".rsdoctor-performance/latest.json"
  }
}
```

If a metric or insight is unavailable, keep the field with `null` and explain the gap in `diagnosis.md`. Do not silently omit missing metrics.

## Lighthouse Plugin Lane

Use the available Lighthouse/plugin tools for browser-observed performance. Tool names may vary by environment, but prefer these capabilities when present:

- `list_pages` and `select_page` to attach to the user's already-authenticated tab.
- `take_snapshot`, `take_screenshot`, `list_console_messages`, and `evaluate_script` to verify page state and collect lightweight context.
- `performance_start_trace` to start the default reload Performance Insights capture. Use `reload: true`, `autoStop: true`, and `filePath` for load measurements after the user is logged in and the route is ready.
- `performance_stop_trace` to stop the active recording and save a raw trace when useful.
- `performance_analyze_insight` to inspect trace insights such as LCP breakdown, document latency, render-blocking requests, layout shifts, third-party impact, or main-thread work.
- `list_network_requests` and `get_network_request` for bounded waterfall inspection. Avoid dumping response bodies unless they are static public assets and directly relevant.
- `lighthouse_audit` for accessibility, SEO, best practices, and agentic browsing. Do not use it as the performance source of truth.

Setup notes:

- Requires Chrome stable or newer, npm, and a current maintained Node.js version supported by `chrome-devtools-mcp`.
- The MCP server starts Chrome automatically when a browser tool is first used.
- To connect to an already running Chrome instance, pass `--browser-url=http://127.0.0.1:9222` in `args` and start Chrome with `--remote-debugging-port=9222` using a non-default user data directory.
- Remote debugging exposes browser contents to MCP clients. Do not browse sensitive sites in that debugging session.

Before measuring:

- Confirm the URL, route, auth state, viewport, device mode, cache state, and whether the user wants load or interaction measurement.
- Prefer production build or production-like preview for page performance. Dev servers can add noise.
- Run the same route more than once when making a strong claim.
- Keep cache state explicit: cold load, warm load, authenticated reload, or current-state interaction.

Collect evidence for:

- Core Web Vitals: LCP, INP or interaction latency, CLS.
- Main-thread pressure: long tasks, expensive script evaluation, hydration, layout, style recalculation, rendering.
- Network waterfall: render-blocking requests, late critical requests, oversized JS/CSS/media/fonts, cache headers.
- Runtime errors and console warnings that affect loading or hydration.
- Element attribution: LCP element, shifting elements, expensive interaction target, delayed request initiators.

Performance Insights findings should name the observed page symptom first, then connect it to possible causes.

## Measurement Contract

Before making a runtime-performance claim, capture or state these assumptions:

- **URL and route**: the exact page URL, route, query string, and relevant route state.
- **Auth and data state**: whether login, feature flags, seeded data, or user-specific state is required.
- **Environment**: prefer a production build or production-like preview. If using a dev server, clearly label the result as noisy and avoid production conclusions.
- **Viewport and device**: desktop/mobile viewport, device emulation, DPR, and any CPU throttling.
- **Network and cache**: cold cache, warm cache, throttling profile, and whether service workers are active.
- **Repeatability**: run the same route more than once before making a strong before/after or regression claim; report if only one pass was possible.

If the user did not provide a URL or route and it cannot be discovered from the repo, ask for it before measuring.

## Rsdoctor Context

Use this only for targeted artifact context after Performance Insights/trace evidence identifies a runtime symptom.

Look for:

- Route-critical chunks or assets only when Performance Insights/trace evidence shows they affect loading, scripting, or rendering.
- Package, chunking, or tree-shaking signals only as supporting evidence for a measured performance issue.

Rsdoctor recommendations should name the exact artifact: loader, directory, module path, chunk, asset, package name/version, rule code, or config option.

Do not block runtime diagnosis on Rsdoctor data. If the page symptom is visible in Chrome but no `rsdoctor-data.json` is available, report browser findings and mark artifact attribution as unavailable.

## Runtime Measurement Passes

Use these passes when the user asks for a runtime performance diagnosis.

### Phase 1: Attach And Verify

Attach to the authenticated page selected by the user. Verify the exact route/auth state before recording. Check console errors, failed requests, blank screens, redirect loops, and obvious wrong-environment signals before recording performance.

If the page cannot be loaded correctly, report that as the primary blocker and do not invent performance findings from a broken page.

If the expected page is not open, ask the user to open it and log in; do not try to solve auth by collecting credentials or launching a fresh unauthenticated browser.

### Phase 2: Trace Capture

Default to authenticated reload: start a trace with `reload: true`, `autoStop: true`, and local `filePath` after the user is already logged in. Use this for LCP, FCP, TTFB, render-blocking resources, page-load CLS, network dependency insights, and most screenshot-like DevTools Performance Insights.

Use current-state interaction recording only when the user explicitly asks for INP or a post-load interaction that reload cannot exercise. For that mode, start a trace without reload, trigger or ask the user to trigger the target interaction, then stop the trace and persist the same local artifact shape.

If the trace is empty, first verify the page loaded correctly and that the requested route/auth state is active.

When validating an optimization, capture before and after using the same measurement contract: same route, viewport, cache mode, throttling, auth/data state, and build type.

### Phase 3: Vitals And Main-Thread Classification

Use Performance Insights trace data to classify browser-observed metrics. Treat these thresholds as rating bands, not as a substitute for root-cause analysis:

| Metric             | Good      | Needs improvement | Poor      |
| ------------------ | --------- | ----------------- | --------- |
| Time to First Byte | `< 800ms` | `800ms-1.8s`      | `> 1.8s`  |
| FCP                | `< 1.8s`  | `1.8s-3s`         | `> 3s`    |
| LCP                | `< 2.5s`  | `2.5s-4s`         | `> 4s`    |
| INP                | `< 200ms` | `200ms-500ms`     | `> 500ms` |
| TBT                | `< 200ms` | `200ms-600ms`     | `> 600ms` |
| CLS                | `< 0.1`   | `0.1-0.25`        | `> 0.25`  |
| Speed Index        | `< 3.4s`  | `3.4s-5.8s`       | `> 5.8s`  |

For each non-good metric, capture the attribution: LCP element and delay breakdown, INP interaction target, long-task scripts, shifting elements, render-blocking resources, or slow document latency. Do not recommend bundle or code changes until the trace identifies what delayed the page.

### Phase 4: Network Waterfall

Use Lighthouse/plugin network tools such as `list_network_requests` and `get_network_request` to inspect page requests after the trace. Focus on requests that block rendering, delay LCP, or keep the main thread busy.

Check for:

- Render-blocking document, stylesheet, font, or script requests.
- Critical resources discovered late through CSS imports, script injection, or chained requests.
- Missing or misplaced preload/preconnect hints for LCP images, fonts, or essential origins.
- Weak caching headers on stable assets.
- Oversized JS, CSS, media, font, or JSON responses that appear on the critical path.
- Third-party scripts with high transfer size, blocking behavior, or long script evaluation.
- Unused preconnect hints: only recommend removal after confirming no requests use that origin in the measured page load.

When a network finding points to an emitted asset or chunk, use Rsdoctor context only to identify the asset source, owning chunk, package, or route import boundary.

### Phase 5: Optional Rsdoctor Attribution

Use `rsdoctor-analysis` patterns or `rsdoctor-agent` only for artifacts already implicated by Chrome evidence. Keep this focused:

- For large JS requests or script evaluation, identify owning chunks, top packages, retained modules, or route import boundaries.
- For CSS, image, media, or font bottlenecks, identify emitted asset size and source when available.
- For duplicate dependencies or tree-shaking hints, use them as supporting context, not as proof of a runtime problem.
- If Rsdoctor data is unavailable, leave this as a gap instead of blocking the browser diagnosis.

### Phase 6: Diagnosis Report

Produce the report in the required format below. Lead with browser symptoms, then add Rsdoctor attribution only where it explains the symptom.

## Correlation Rules

Use correlation only when both sides support it:

- Large initial JS in Lighthouse/plugin waterfall + large initial chunks in Rsdoctor -> investigate code splitting, duplicate dependencies, retained modules, and route imports.
- Long script evaluation or hydration + Rsdoctor large framework/app chunks -> inspect route-level imports and heavy dependencies.
- Slow CSS or layout work + large CSS/font assets -> inspect CSS extraction, font loading, and critical style delivery.
- LCP blocked by image/font/network -> use the trace as source of truth; use Rsdoctor only to identify emitted asset size and origin.
- Build slow or build artifact only -> hand off to `rsdoctor-analysis`.
- Runtime slow but Rsdoctor bundle looks healthy -> look at server latency, third-party scripts, hydration work, runtime algorithms, or browser rendering.
- Standalone bundle composition issue -> hand off to `rsdoctor-analysis`.

Do not infer user-perceived runtime performance from gzip size alone.

## Codebase Inspection

Inspect repo files only after evidence points to a likely cause. Prefer `rg` for discovery.

Common targets:

- Bundler config: `rspack.config.*`, `rsbuild.config.*`, `rslib.config.*`, `rspress.config.*`, `modern.config.*`, `webpack.config.*`
- Package metadata: `package.json`, lock files, `browserslist`, `sideEffects`
- Loader rules: Babel/SWC, Sass/Less/PostCSS, SVG, image, TypeScript, minifier
- Optimization: `splitChunks`, source maps, CSS extraction, compression, asset modules
- Route/import code: dynamic imports, barrel imports, route-level dependency boundaries, client hydration entrypoints

When recommending code changes, include the smallest safe edit and note tradeoffs.

## Diagnosis Format

Use this output shape:

```markdown
## Diagnosis

| Browser Symptom | Rsdoctor Context | Recommendation | Priority |
| --------------- | ---------------- | -------------- | -------- |

## What This Means

Short explanation that separates browser symptoms from build/bundle causes. If only Chrome evidence was available, say so.

## Risk And Tradeoffs

| Action | Expected Impact | Risk/Tradeoff |
| ------ | --------------- | ------------- |

## Artifacts

- Trace: `<local trace path>`
- Runtime summary: `<local insights-summary.json or trace-summary.json path>`
- Network/script/long-task summaries: `<local summary paths or unavailable>`
- Bundle summary: `<local bundle-summary.json path or unavailable>`
- Correlation report: `<local correlation-report.json path or unavailable>`
- Diagnosis: `<local diagnosis.md path>`
- Latest manifest: `<.rsdoctor-performance/latest.json path or unavailable>`
- Details: `<local details directory or unavailable>`

## Gaps

What was not measured, unavailable, or still needs confirmation.
```

Rules:

- Put browser symptoms and Rsdoctor causes in separate evidence cells.
- If only one lane was used, say that clearly.
- Use `High`, `Medium`, or `Low` priority.
- Include the measurement contract in prose or table form when it materially affects the conclusion.
- For before/after validation, state whether the comparison used matching route, viewport, cache, throttling, auth/data state, and build type.
- Do not paste raw traces or huge CLI output.
- Always include local artifact paths when capture succeeded.
- Do not output command recipes in the final follow-up section; describe the next evidence category instead.

## Common Mistakes To Avoid

- Saying "Rsdoctor shows LCP/INP/CLS." It does not; use Performance Insights trace evidence.
- Launching a fresh automated browser for login-gated apps when the user can log in first and hand off an authenticated tab.
- Taking only a screenshot of the Performance panel instead of saving the reload trace and structured insights locally.
- Asking the user to paste a trace path when `.rsdoctor-performance/latest.json` already points to the latest capture.
- Manually comparing raw trace JSON instead of normalizing both traces into compact summaries first.
- Running `performance_start_trace` without `reload: true`, `autoStop: true`, or `filePath` for default load analysis.
- Treating Lighthouse-style scores as the whole diagnosis. Prefer concrete traces, waterfall, and attribution.
- Using `lighthouse_audit` as a performance audit when the tool explicitly excludes performance.
- Recommending `splitChunks` changes before checking whether runtime actually loads too much JS.
- Claiming a bundle optimization is validated without checking that the measured route loaded the changed emitted asset or hash.
- Handling bundle-only analysis here instead of `rsdoctor-analysis`.
- Recommending dependency replacement from indirect package evidence alone.
- Running broad tree-shaking bailout scans without a bounded module set.
- Mixing dev-server measurements with production-build conclusions without calling out the difference.

## Maintenance Evals

When this skill or its `rsdoctor-analysis` integration changes, run through [evals/automation-handoff-cases.md](evals/automation-handoff-cases.md) as a lightweight regression checklist.

## Attribution

This skill references ideas from Warp's [`web-performance-audit`](https://github.com/warpdotdev/oz-skills/blob/main/.agents/skills/web-performance-audit/SKILL.md), which is published under the [MIT License](https://github.com/warpdotdev/oz-skills/blob/main/LICENSE).
