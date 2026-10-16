---
name: rsdoctor-analysis
description: Use when analyzing Rspack/Webpack bundles from local `rsdoctor-data.json` and producing evidence-based optimization recommendations.
---

# Rsdoctor analysis assistant skill

Use the globally installed `rsdoctor-agent` CLI from `@rsdoctor/agent-cli` only after a real `rsdoctor-data.json` path exists. Keep analysis read-only unless the user explicitly asks for install/config setup.

Response order (required): High-Priority Issues -> Proposed Solutions -> Optional Reference-Chain Follow-up Choices -> Next Deep-Dive Issue Categories (Not commands).

## Core workflow

1. Reuse current-session results and valid `.rsdoctor-analysis-cache.json` entries before doing new work.
2. Locate `rsdoctor-data.json` fast: user-provided path, then `dist/rsdoctor-data.json`, `output/rsdoctor-data.json`, `static/rsdoctor-data.json`, `.rsdoctor/rsdoctor-data.json`, then one bounded `rg --files` search excluding `node_modules` and `.git`. Treat `manifest.json` only as an index.
3. If data exists, skip all plugin version/config/build generation logic. Update cache when useful.
4. If data is missing, stop analysis: do not run `rsdoctor-agent` analysis commands, do not run the Analysis Gate, and either ask for the data path or run the Generation Gate below only when setup/generation is required.
5. After a real data file exists, run Analysis Gate at most once before the first `rsdoctor-agent` data-fetch command: verify global `@rsdoctor/agent-cli` with `npm view @rsdoctor/agent-cli version` and `rsdoctor-agent --version`; install latest only if missing/outdated, a version-related error occurs, or the user asks to refresh.
6. Discover compilers before analysis with `rsdoctor-agent compilers list --data-file <path>`, then follow the Compiler selection rules below.
7. For each selected compiler, fetch only the Default Evidence Set first; run independent fetches in parallel when possible. Pass that compiler's `--compiler <name>` to every data-fetch command in its evidence pass.
8. Run the ROI Triage Gate below before selecting deep-dive commands or recommendations. Use it to rank issue categories by measured impact, then synthesize findings in the required response order.

Performance rules: parallelize independent checks, cache only derived facts (`dataFile`, `dataFileMtime`, `pluginName`, `pluginVersion`, dependency/config/plugin modification times), and invalidate cache when paths disappear, modification times change, the user asks to refresh, or cached values fail. Speculative plugin checks must not trigger generation; use them only after confirming the data file is missing.

## Compiler selection

Treat compiler discovery as the first data query, not part of the parallel evidence fetch:

- If the report has one named compiler, use its exact `name` for the entire analysis.
- If the report has multiple compilers, resolve each target named by the user to an exact compiler name. When the request identifies a target such as client, server, or worker but does not match an exact name, map it only when the discovery result makes the match unambiguous; if no target is given or a match is ambiguous, ask the user to choose from the returned names.
- If a legacy report returns one compiler with `name: null`, omit `--compiler`.
- For a single-compiler analysis, keep the same selected compiler across the Default Evidence Set and all follow-up queries. If the user explicitly requests cross-compiler analysis, select each requested compiler using the rules above (or all returned compilers when the user requests all), run a separate evidence pass with its own `--compiler <name>`, then compare clearly labeled results. Never mix results from different compilers within a pass.
- Before fetching evidence, verify that every selected compiler's `available` field is `true`. If any is false, ask the user to restore or regenerate that compiler data file.

## ROI triage gate

Before recommending fixes, classify the current build into broad cost buckets and choose the highest-ROI lever from evidence, not intuition. This gate is generic for Rspack/Webpack projects; do not use framework-specific runtime layers unless the user's project exposes them in the data.

| Cost bucket                | Evidence source                                                   | First lever                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Assets/media               | `assetsTop`, `assets media`, `chunkGraph.assets`                  | Compress, convert, deduplicate, subset, or lazy-load large assets                                                                |
| Large packages/modules     | `packagesTop`, module/package size fields                         | Replace heavy packages, use deep imports, split non-critical code, or review direct dependency choices                           |
| Duplicate/cross-chunk cost | E1001/E1002, `packages duplicates`, cross-chunk package summaries | Deduplicate versions, tune package resolution, or adjust `splitChunks`/cache groups                                              |
| Tree-shaking waste         | `retainedModulesTop`, retained CJS/barrel/side-effects modules    | Fix CJS/barrel imports, sideEffects declarations, or package entrypoints                                                         |
| Build-time cost            | `buildCost`, loaders/plugins/directories cost data                | Optimize loaders/plugins, cache, watcher, or source-map/dev settings; prioritize only when the user asks about build performance |

Decision rules:

- Report the measured breakdown first when it changes recommendation priority.
- Start with the largest bucket that maps to a practical fix; a smaller issue should not outrank a larger one unless the larger one is expected or intentionally unavoidable.
- Treat issuer/reference-chain tracing as second-pass work. Run it only when a high-impact candidate needs ownership evidence, or when the user asks "why" / "who imported this".
- Do not present aggregate rule output as sufficient evidence for a fix that requires a concrete file, package, chunk, size, or dependency path.
- If the largest bucket is structural or intentionally required, say that it is a wall and name the external change that would be needed instead of inventing low-impact source edits.

## Generation gate

Identify the project's bundler first. For webpack, follow the separate [webpack 1.x generation guide](references/install-rsdoctor-webpack.md); do not apply the Rspack 2.x gate below. For Rspack, check `@rsdoctor/core` and `@rsdoctor/rspack-plugin` in `package.json`, the lockfile, then installed package metadata. Use `pnpm why` / `npm ls` only as fallback. Resolve actual versions rather than inferring the major version from a dependency range, and stop if the selected plugin's peer dependency excludes the installed bundler. Check direct dependencies and active plugin registration separately from framework-owned transitive packages. `@rsdoctor/core` 1.x may be present for custom rules without providing the build plugin.

For Rspack, use this exact if/else decision tree; do not merge branches:

```text
if Rspack actively registers both @rsdoctor/core 2.x and @rsdoctor/rspack-plugin 1.x:
  stop and report mixed plugins; do not install or build
else if Rspack has @rsdoctor/core 2.x:
  use or register the v2 plugin; configure output.mode='brief' and include 'json' in output.options.type; build with RSDOCTOR=true only
else if @rsdoctor/rspack-plugin is installed but its version is unknown:
  resolve its version first; if still unknown, configure output.mode='brief' and include 'json' in output.options.type; build with RSDOCTOR=true only
else if an installed @rsdoctor/rspack-plugin 1.x version is >= 1.5.11:
  do not edit plugin config just for JSON; build with RSDOCTOR_OUTPUT=json and RSDOCTOR=true if needed
else if an installed @rsdoctor/rspack-plugin 1.x version is older:
  configure output.mode='brief' and include 'json' in output.options.type; build with RSDOCTOR=true only
else: # no build plugin installed
  choose a compatible Rspack plugin, then configure brief JSON output and build with RSDOCTOR=true only
```

For an Rspack 2.x project without a plugin, install a compatible `@rsdoctor/core` 2.x version; do not install `@rsdoctor/rspack-plugin`. For Rspack 1.x, keep the compatible 1.x plugin. If installed versions or bundler compatibility cannot be determined, stop before installing. Check the plugin import path only when the package versions and active configuration appear inconsistent.

For Rspack builds, `RSDOCTOR_OUTPUT=json` is allowed only for a known 1.x plugin version `>= 1.5.11`. It is forbidden for 2.x, missing, unknown, or older plugin versions. When explicit JSON configuration is required, add `'json'` to an existing brief output type rather than removing HTML; if changing a normal report temporarily, restore its previous output settings after generating data:

```ts
output: {
  mode: 'brief',
  options: {
    type: ['json'],
  },
}
```

## Evidence and command bounds

Default Evidence Set:

| Summary key          | Evidence source                            | Bounds                                        |
| -------------------- | ------------------------------------------ | --------------------------------------------- |
| `buildCost`          | `build summary`                            | filtered fields only                          |
| `assetsTop`          | top assets by raw/gzip size                | fixed Top-N                                   |
| `packagesTop`        | top packages by gzip size                  | fixed Top-N; avoid full `packages list` pages |
| `duplicatePackages`  | E1001 duplicate package summary            | first-pass summary only                       |
| `crossChunkPackages` | E1002 cross-chunk duplication summary      | first-pass summary only                       |
| `retainedModulesTop` | `tree-shaking retained-modules --limit 10` | filtered fields only; no `--compact`          |

Scope rules:

- Use `rsdoctor-agent` for bundle data access only after `rsdoctor-data.json` exists; prefer parallel independent fetches; bound output with `--filter`, pagination, and `--limit`. After discovery, pass the compiler selected for that evidence pass as `--compiler <name>` to every direct command and `query` call; omit it only for a legacy report whose discovered name is `null`.
- Default analysis stays within the Default Evidence Set. For non-default analysis, choose minimal fields from [references/rsdoctor-data-types.md](references/rsdoctor-data-types.md) and patterns from [references/common-analysis-patterns.md](references/common-analysis-patterns.md).
- Treat chain tracing, broad commands, optimization edits, splitChunks experiments, and build re-runs as opt-in follow-ups that require user confirmation.
- For duplicate packages and tree-shaking issues, identify issues first; trace reference/import chains only after user confirmation.
- Prefer `tree-shaking retained-modules --emitted-only --category side-effects --limit 10` with narrow `--filter` for side-effects investigations.
- For retained emitted modules, use `tree-shaking retained-modules` with `--emitted-only`, bounded `--category`, `--sort gzipSize`, `--limit`, and narrow `--filter`; do not pass `--compact`.
- Use `tree-shaking summary` only as fallback for missing fields or aggregate context. Treat `tree-shaking bailout-reasons` as high-volume; run it only when explicitly requested and pass target `--modules` (max 100).
- If any command exceeds `5k` tokens, `500 KB` raw output, or a few hundred transcript lines, stop broad fetching and switch to targeted compact queries.

## Output and recovery

Output format:

1. Issues found in the current build and recommended fixes:
   - Group each issue with its fix recommendation.
   - Include concrete evidence (size/time/count/path/rule code) and priority.
   - For duplicate packages and tree-shaking issues, include a short "continue tracing vs stop here" choice.
2. Whether deeper analysis is still needed:
   - List remaining issue categories only, not commands.

For Top-N insights, prefer a table: `Name | Volume/Time | Count | Recommendation`.

Recovery rules:

- `rsdoctor-data.json` missing: do not run `rsdoctor-agent`; ask for the data path or run Generation Gate, then use the matching install reference if setup is needed.
- Command not found: run Analysis Gate, then retry with `rsdoctor-agent`.
- `query` reports unknown tool: run `list` and use a catalog tool name, or switch to direct `<group> <subcommand>` mode.
- `COMPILER_REQUIRED`: run `compilers list`, select the requested compiler or compilers using the rules above, and retry each evidence pass consistently with its own `--compiler`.
- `COMPILER_NOT_FOUND`: refresh the compiler list and use an exact returned name; do not guess from `displayName`.
- `COMPILER_DATA_NOT_FOUND`: ask the user to restore or regenerate the selected compiler data file.
- JSON read error: verify file path, JSON validity, and permissions.
- Run installs, builds, version checks, and `rsdoctor-agent...` commands only in the host's authorized command environment when it has the required project, dependency, and network access. If the available environment lacks that access, stop and ask the user instead of attempting to bypass the sandbox or permission boundary. Clearly identify the missing permission or access; if an Rsdoctor dependency must be installed, tell the user which dependency is required and provide the appropriate package-manager command for them to run.

References: commands/options [references/command-map.md](references/command-map.md); install/config/data location [references/install-rsdoctor.md](references/install-rsdoctor.md), [references/install-rsdoctor-rspack.md](references/install-rsdoctor-rspack.md), [references/install-rsdoctor-webpack.md](references/install-rsdoctor-webpack.md), [references/install-rsdoctor-common.md](references/install-rsdoctor-common.md); raw data fields [references/rsdoctor-data-types.md](references/rsdoctor-data-types.md); common patterns [references/common-analysis-patterns.md](references/common-analysis-patterns.md).
