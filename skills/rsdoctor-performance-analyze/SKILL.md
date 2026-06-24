---
name: rsdoctor-performance-analyze
description: Diagnose Rspack, Rsbuild, Rslib, Rspress, Modern.js, or Webpack page runtime performance with evidence from chrome-devtools-mcp. Use for LCP, INP, CLS, network waterfalls, long tasks, hydration, and browser-observed performance. For build artifact analysis, build-time analysis, bundle, chunk, package duplication, asset weight, or tree-shaking analysis, use rsdoctor-analysis instead.
---

# Rsdoctor Performance Analyze

Use this skill to diagnose **page runtime performance**. It starts from browser-observed evidence, then optionally uses Rsdoctor build data to explain which emitted assets, chunks, packages, or modules contributed to the measured page symptom.

- **Chrome lane**: runtime page performance from `chrome-devtools-mcp`.
- **Rsdoctor context**: optional artifact context from `rsdoctor-data.json` only after Chrome evidence shows emitted assets, chunks, packages, or modules are part of the bottleneck.

Do not claim Rsdoctor provides browser runtime metrics. Use Rsdoctor for what the bundler knows, and Chrome DevTools MCP for what the page actually does in a browser.

For build artifact analysis or build-time analysis, install and use `rsdoctor-analysis` with `npx skills add rstackjs/agent-skills --skill rsdoctor-analysis`. For bundle-only questions such as chunk composition, duplicate packages, similar packages, asset weight, or tree-shaking, stop and use `rsdoctor-analysis`. This skill may use those Rsdoctor signals only when they explain a measured browser-runtime symptom.

This first version intentionally does **not** implement advanced bundle-size experiments. Treat chunk-group reachability, retained-unused disposition, export-usage roots, sideEffects experiments, and splitChunks experiments as future `rsdoctor-analysis` follow-ups, not work for this skill.

## Evidence Router

Choose the lane from the user's question:

| User intent                                                                   | Primary lane        | Add Rsdoctor context when...                            |
| ----------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------- |
| LCP, INP, CLS, TBT, long tasks, hydration, network                            | Chrome DevTools MCP | Bundle structure may explain the runtime bottleneck     |
| "Page performance is bad" without details                                     | Chrome DevTools MCP | Emitted assets or chunks appear in the browser evidence |
| Before/after runtime optimization validation                                  | Chrome DevTools MCP | The optimization changed emitted assets or chunking     |
| "This route loads too much JS and feels slow"                                 | Chrome DevTools MCP | Trace or waterfall confirms JS is on the critical path  |
| Build time, build artifact, bundle, chunk, dependency, asset, or tree-shaking | `rsdoctor-analysis` | Return here only if there is a browser-runtime symptom  |

When both lanes are used, keep them distinct in notes and merge only in the final diagnosis.

Routing examples:

- "Analyze LCP on this page" -> Chrome lane first.
- "Why is my bundle large?" -> `rsdoctor-analysis`, not this skill.
- "This route loads too much JS and feels slow" -> Chrome lane first; add Rsdoctor context only if browser evidence shows JS download, parse, evaluation, or hydration is relevant.

## Guardrails

- Runtime performance evidence must come from `chrome-devtools-mcp`, not Rsdoctor.
- Rsdoctor analysis should use `@rsdoctor/agent-cli@latest` against `rsdoctor-data.json`.
- Keep the default workflow read-only. Recommend edits; only modify code/config after the user asks.
- Prefer small, targeted data pulls. Use `--filter`, `--compact`, `--page-size`, and bounded `--limit`.
- A recommendation needs a measured symptom and a plausible cause. Avoid generic advice.
- If a Chrome trace and Rsdoctor data disagree, say so and explain the gap instead of forcing one story.
- If `rsdoctor-data.json` is missing, continue the runtime diagnosis with Chrome evidence and list Rsdoctor attribution as a gap.
- If Chrome DevTools MCP is unavailable, stop before diagnosing runtime performance and give the setup instructions below.

## Configure Chrome DevTools MCP

Before using this skill, make sure the MCP client has Chrome DevTools MCP installed and enabled.

Recommended Codex CLI setup:

```bash
codex mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

Equivalent MCP server config:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

Equivalent Codex config shape:

```toml
[mcp_servers.chrome-devtools]
command = "npx"
args = ["-y", "chrome-devtools-mcp@latest"]
```

Notes:

- Requires Chrome stable or newer, npm, and a current maintained Node.js version supported by `chrome-devtools-mcp`.
- The MCP server starts Chrome automatically when a browser tool is first used.
- To connect to an already running Chrome instance, pass `--browser-url=http://127.0.0.1:9222` in `args` and start Chrome with `--remote-debugging-port=9222` using a non-default user data directory.
- Remote debugging exposes browser contents to MCP clients. Do not browse sensitive sites in that debugging session.

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

Use this only for targeted artifact context after Chrome DevTools MCP identifies a runtime symptom.

Look for:

- Route-critical chunks or assets only when Chrome evidence shows they affect loading, scripting, or rendering.
- Package, chunking, or tree-shaking signals only as supporting evidence for a measured performance issue.

Rsdoctor recommendations should name the exact artifact: loader, directory, module path, chunk, asset, package name/version, rule code, or config option.

Do not block runtime diagnosis on Rsdoctor data. If the page symptom is visible in Chrome but no `rsdoctor-data.json` is available, report browser findings and mark artifact attribution as unavailable.

## Chrome Lane

Use `chrome-devtools-mcp` for browser-observed performance. The exact MCP tool names may vary by environment; use the available Chrome DevTools MCP actions for navigation, tracing, performance metrics, network inspection, console inspection, screenshots, and DOM/script attribution.

Before measuring:

- Confirm the URL, route, auth state, viewport, device mode, and throttling assumptions when they materially affect results.
- Prefer production build or production-like preview for page performance. Dev servers can add noise.
- Run the same route more than once when making a strong claim.
- Keep cache state explicit: cold load, warm load, or both.

Collect evidence for:

- Core Web Vitals: LCP, INP or interaction latency, CLS.
- Main-thread pressure: long tasks, expensive script evaluation, hydration, layout, style recalculation, rendering.
- Network waterfall: render-blocking requests, late critical requests, oversized JS/CSS/media/fonts, cache headers.
- Runtime errors and console warnings that affect loading or hydration.
- Element attribution: LCP element, shifting elements, expensive interaction target, delayed request initiators.

Chrome findings should name the observed page symptom first, then connect it to possible causes.

## Runtime Measurement Passes

Use these passes when the user asks for a runtime performance diagnosis.

### Phase 1: Page Load Verification

Navigate to the target URL and verify the page is in the expected route, auth state, viewport, and data state. Check console errors, failed requests, blank screens, redirect loops, and obvious wrong-environment signals before recording performance.

If the page cannot be loaded correctly, report that as the primary blocker and do not invent performance findings from a broken page.

### Phase 2: Trace And Metrics Capture

Navigate to the target URL, then record a reload trace with Chrome DevTools MCP. If the trace is empty, first verify the page loaded correctly and that the requested route/auth state is active.

When validating an optimization, capture before and after using the same measurement contract: same route, viewport, cache mode, throttling, auth/data state, and build type.

### Phase 3: Vitals And Main-Thread Classification

Use Chrome DevTools MCP performance insights and trace data to classify browser-observed metrics. Treat these thresholds as rating bands, not as a substitute for root-cause analysis:

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

Use Chrome DevTools MCP network tools such as `list_network_requests` and `get_network_request` to inspect page requests after the trace. Focus on requests that block rendering, delay LCP, or keep the main thread busy.

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

- Large initial JS in Chrome waterfall + large initial chunks in Rsdoctor -> investigate code splitting, duplicate dependencies, retained modules, and route imports.
- Long script evaluation or hydration + Rsdoctor large framework/app chunks -> inspect route-level imports and heavy dependencies.
- Slow CSS or layout work + large CSS/font assets -> inspect CSS extraction, font loading, and critical style delivery.
- LCP blocked by image/font/network -> use Chrome as source of truth; use Rsdoctor only to identify emitted asset size and origin.
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
- Do not output command recipes in the final follow-up section; describe the next evidence category instead.

## Common Mistakes To Avoid

- Saying "Rsdoctor shows LCP/INP/CLS." It does not; use Chrome DevTools MCP.
- Treating Lighthouse-style scores as the whole diagnosis. Prefer concrete traces, waterfall, and attribution.
- Recommending `splitChunks` changes before checking whether runtime actually loads too much JS.
- Handling bundle-only analysis here instead of `rsdoctor-analysis`.
- Recommending dependency replacement from indirect package evidence alone.
- Running broad tree-shaking bailout scans without a bounded module set.
- Mixing dev-server measurements with production-build conclusions without calling out the difference.

## Attribution

This skill references ideas from Warp's [`web-performance-audit`](https://github.com/warpdotdev/oz-skills/blob/main/.agents/skills/web-performance-audit/SKILL.md), which is published under the [MIT License](https://github.com/warpdotdev/oz-skills/blob/main/LICENSE).
