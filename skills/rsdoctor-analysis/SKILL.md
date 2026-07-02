---
name: rsdoctor-analysis
description: Use when analyzing Rspack/Webpack bundles from local `rsdoctor-data.json` and producing evidence-based optimization recommendations.
---

# Rsdoctor Analysis Assistant Skill

Use the globally installed `rsdoctor-agent` CLI from `@rsdoctor/agent-cli` only after a real `rsdoctor-data.json` path exists. Keep analysis read-only unless the user explicitly asks for install/config setup.

Response order (required): High-Priority Issues -> Proposed Solutions -> Optional Reference-Chain Follow-up Choices -> Next Deep-Dive Issue Categories (Not commands).

This skill may be called by `rsdoctor-performance-analyze` with a compact runtime handoff. In that mode, use the handoff only to prioritize bundle evidence around emitted assets/chunks that appeared in the browser trace. Do not reinterpret browser metrics here; return bundle evidence that the performance skill can merge back into the runtime diagnosis.

## Core Workflow

1. Reuse current-session results and valid `.rsdoctor-analysis-cache.json` entries before doing new work.
2. Locate `rsdoctor-data.json` fast: user-provided path, then `dist/rsdoctor-data.json`, `output/rsdoctor-data.json`, `static/rsdoctor-data.json`, `.rsdoctor/rsdoctor-data.json`, then one bounded `rg --files` search excluding `node_modules` and `.git`. Treat `manifest.json` only as an index.
3. If data exists, skip all plugin version/config/build generation logic. Update cache when useful.
4. If data is missing, stop analysis: do not run `rsdoctor-agent` analysis commands, do not run the Analysis Gate, and either ask for the data path or run the Generation Gate below only when setup/generation is required.
5. After a real data file exists, run Analysis Gate at most once before the first `rsdoctor-agent` data-fetch command: verify global `@rsdoctor/agent-cli` with `npm view @rsdoctor/agent-cli version` and `rsdoctor-agent --version`; install latest only if missing/outdated, a version-related error occurs, or the user asks to refresh.
6. If a `rsdoctor-performance-analyze` handoff exists, read its `candidateAssets`, `runtimeSymptoms`, and `requestedEvidence`, then prioritize matching asset basenames, hashes, chunks, packages, and retained modules before broad Top-N output.
7. Fetch only the Default Evidence Set first; run independent fetches in parallel when possible; synthesize findings in the required response order.

Performance rules: parallelize independent checks, cache only derived facts (`dataFile`, `dataFileMtime`, `pluginName`, `pluginVersion`, dependency/config/plugin modification times), and invalidate cache when paths disappear, modification times change, the user asks to refresh, or cached values fail. Speculative plugin checks must not trigger generation; use them only after confirming the data file is missing.

## Performance Handoff Input

When invoked from `rsdoctor-performance-analyze`, expect a small JSON-like context with this shape:

```json
{
  "source": "rsdoctor-performance-analyze",
  "traceSummary": ".rsdoctor-performance/<capture>/trace-summary.json",
  "runtimeSymptoms": [],
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

Handoff rules:

- Treat `candidateAssets` as filters and ranking hints. They are not proof that a module/package caused the runtime symptom.
- Match assets by exact basename first, then hash fragment, then public path/chunk naming convention. If matching is ambiguous, report all plausible matches with confidence.
- Keep the Default Evidence Set as a fallback, but lead with evidence for matching chunks/assets when available.
- Write a compact `bundle-summary.json` when an output path is provided. Include matched assets/chunks, top owning packages/modules, duplicate package findings, retained module findings, and unresolved matches.
- Write `correlation-report.json` only for bundle-side facts that can be connected to handoff candidates. Leave runtime interpretation and final prioritization to `rsdoctor-performance-analyze`.
- If `rsdoctor-data.json` is missing, follow the normal missing-data recovery rules. Do not run `rsdoctor-agent` commands against the trace file.

## Generation Gate

Identify `pluginName` (`@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin`) and determine `pluginVersion` from local files first: `package.json`, lockfile, then `node_modules/<plugin>/package.json`; use `pnpm why` / `npm ls` only as fallback.

Use this exact if/else decision tree; do not merge branches:

```text
if pluginName is missing:
  install/register the matching Rsdoctor plugin, then configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
else if pluginVersion is unknown:
  resolve pluginVersion first; if still unknown, configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
else if pluginVersion >= 1.5.11:
  do not edit plugin config just for JSON; build with RSDOCTOR_OUTPUT=json and RSDOCTOR=true if needed
else: # pluginVersion < 1.5.11
  MUST configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
```

Preflight every build command: `RSDOCTOR_OUTPUT=json` is allowed only in the `pluginVersion >= 1.5.11` branch. For missing, unknown, or `< 1.5.11`, it is forbidden. For `< 1.5.11`, generating `rsdoctor-data.json` requires the plugin config below:

```ts
output: {
  mode: 'brief',
  options: {
    type: ['json'],
  },
}
```

## Evidence and Command Bounds

Default Evidence Set:

| Summary key | Evidence source | Bounds |
| --- | --- | --- |
| `buildCost` | `build summary` | filtered fields only |
| `assetsTop` | top assets by raw/gzip size | fixed Top-N |
| `packagesTop` | top packages by gzip size | fixed Top-N; avoid full `packages list` pages |
| `duplicatePackages` | E1001 duplicate package summary | first-pass summary only |
| `crossChunkPackages` | E1002 cross-chunk duplication summary | first-pass summary only |
| `retainedModulesTop` | `tree-shaking retained-modules --limit 10` | filtered fields only; no `--compact` |

Scope rules:

- Use `rsdoctor-agent` for bundle data access only after `rsdoctor-data.json` exists; prefer parallel independent fetches; bound output with `--filter`, pagination, and `--limit`.
- Default analysis stays within the Default Evidence Set. For non-default analysis, choose minimal fields from [references/rsdoctor-data-types.md](references/rsdoctor-data-types.md) and patterns from [references/common-analysis-patterns.md](references/common-analysis-patterns.md).
- Treat chain tracing, broad commands, optimization edits, splitChunks experiments, and build re-runs as opt-in follow-ups that require user confirmation.
- For duplicate packages and tree-shaking issues, identify issues first; trace reference/import chains only after user confirmation.
- Prefer `tree-shaking retained-modules --emitted-only --category side-effects --limit 10` with narrow `--filter` for side-effects investigations.
- For retained emitted modules, use `tree-shaking retained-modules` with `--emitted-only`, bounded `--category`, `--sort gzipSize`, `--limit`, and narrow `--filter`; do not pass `--compact`.
- Use `tree-shaking summary` only as fallback for missing fields or aggregate context. Treat `tree-shaking bailout-reasons` as high-volume; run it only when explicitly requested and pass target `--modules` (max 100).
- If any command exceeds `5k` tokens, `500 KB` raw output, or a few hundred transcript lines, stop broad fetching and switch to targeted compact queries.

## Output and Recovery

Output format:

1. Issues found in the current build and recommended fixes:
   - Group each issue with its fix recommendation.
   - Include concrete evidence (size/time/count/path/rule code) and priority.
   - For duplicate packages and tree-shaking issues, include a short "continue tracing vs stop here" choice.
2. When a performance handoff supplied output paths:
   - Save `bundle-summary.json` with compact matched bundle facts.
   - Save `correlation-report.json` with matched candidate assets, confidence, and unresolved gaps.
   - Mention these artifact paths in the response, but do not turn them into runtime conclusions.
3. Whether deeper analysis is still needed:
   - List remaining issue categories only, not commands.

For Top-N insights, prefer a table: `Name | Volume/Time | Count | Recommendation`.

Recovery rules:

- `rsdoctor-data.json` missing: do not run `rsdoctor-agent`; ask for the data path or run Generation Gate, then use the matching install reference if setup is needed.
- Command not found: run Analysis Gate, then retry with `rsdoctor-agent`.
- `query` reports unknown tool: run `list` and use a catalog tool name, or switch to direct `<group> <subcommand>` mode.
- JSON read error: verify file path, JSON validity, and permissions.
- In Codex, do not run `install`, `build`, global CLI installation, version checks, or `rsdoctor-agent...` inside sandbox. Run Rsdoctor CLI setup and data-fetch commands outside sandbox so they can access project files and dependencies normally.

References: commands/options [references/command-map.md](references/command-map.md); install/config/data location [references/install-rsdoctor.md](references/install-rsdoctor.md), [references/install-rsdoctor-rspack.md](references/install-rsdoctor-rspack.md), [references/install-rsdoctor-webpack.md](references/install-rsdoctor-webpack.md), [references/install-rsdoctor-common.md](references/install-rsdoctor-common.md); raw data fields [references/rsdoctor-data-types.md](references/rsdoctor-data-types.md); common patterns [references/common-analysis-patterns.md](references/common-analysis-patterns.md).
