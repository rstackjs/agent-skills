---
name: rsdoctor-analysis
description: Use when analyzing Rspack/Webpack bundles from local `rsdoctor-data.json` and producing evidence-based optimization recommendations.
---

# Rsdoctor Analysis Assistant Skill

Use the globally installed `rsdoctor-agent` CLI from `@rsdoctor/agent-cli` to read `rsdoctor-data.json` and provide evidence-based optimization recommendations.

**Use the latest version of `@rsdoctor/agent-cli`. For `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin` >= 1.5.11, generate JSON with `RSDOCTOR_OUTPUT='json'`; for older versions, configure the plugin output manually.**

Response order (required): High-Priority Issues -> Proposed Solutions -> Optional Reference-Chain Follow-up Choices -> Next Deep-Dive Issue Categories (Not commands).

## Guardrails

- Default behavior is read-only analysis.
- Use the `rsdoctor-agent` command for bundle data access; prefer background execution when possible, then collect and summarize outputs.
- Before the first analysis command, ensure `@rsdoctor/agent-cli` is installed globally and current:
  - Check the latest version with `npm view @rsdoctor/agent-cli version`.
  - Check the installed CLI version with `rsdoctor-agent --version`.
  - If `rsdoctor-agent` is missing or not the latest version, install the latest global CLI with `npm install -g @rsdoctor/agent-cli@latest`, then run commands with `rsdoctor-agent`.
- Run CLI version checks at most once per session unless the CLI is missing, a command fails with a version-related error, or the user explicitly asks to refresh.
- Reuse already returned results from current context whenever possible. Do not re-run the same subcommand unless required fields are missing or the user asks for a refresh.
- Every `rsdoctor-agent` data-fetch command supports `--filter`; use it by default with fields from [references/rsdoctor-data-types.md](references/rsdoctor-data-types.md).
- Add `--compact` to `rsdoctor-agent` commands whenever possible. If a command does not support `--compact`, keep output small with `--filter`, pagination, and `--limit`.
- Default bundle analysis must build a compact summary first and produce the report from that summary, not from broad raw CLI output.
- Default bundle analysis must execute independent data-fetch commands in parallel when the runtime supports parallel tool calls.
- Do not leave the default evidence set unless required fields are missing, the user asks for a specific deep dive, or the compact summary shows a finding that needs one narrow supporting query.
- For tree-shaking side-effects investigations, prefer `tree-shaking retained-modules --emitted-only --category side-effects --limit 10` with a narrow `--filter`. If falling back to `tree-shaking summary` or `modules side-effects`, use small pagination (`--page-size 10` / `--side-effects-page-size 10`) and stop as soon as one command exceeds `5k` tokens or `500 KB` raw output.
- For retained emitted module analysis, prefer `tree-shaking retained-modules` with `--emitted-only`, bounded `--category`, `--sort gzipSize`, `--limit`, and a narrow `--filter`. Do not pass `--compact` to `tree-shaking retained-modules`.
- For broader tree-shaking issues, use `tree-shaking summary` only as a fallback when retained-module output lacks required fields or aggregate context is required; keep output compact.
- Treat `tree-shaking bailout-reasons` as high-volume by default. Do not run it unless the user explicitly asks for bailout reason analysis, and always pass the target module list with `--modules` (maximum 100 modules).
- Use a per-step token budget gate: if one command exceeds `5k` tokens (o200k_base), `500 KB` raw output, or a few hundred transcript lines, stop adding broad-scope commands and switch to compact, filtered, paginated, or targeted queries.
- For duplicate packages and tree-shaking issues, do first-pass issue identification by default. Do not immediately trace reference/import chains.
- At the end of analysis, provide next-step choices and let the user decide whether to continue with reference-chain tracing.
- Do not modify user code/config except these explicit cases:
  - `install`: install `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin`, and update `package.json`.
  - `config`: add Rsdoctor plugin config to supported config files.
- Optional verification workflow (only with user confirmation):
  - If the goal is to validate optimization impact, you may adjust `splitChunks` and re-run build to compare results.
  - Ask for user confirmation before modifying `splitChunks` and before re-running build.
- For all analysis commands, provide recommendations only. Do not auto-apply optimization edits.

## Default Evidence Set

For default bundle analysis, populate only this compact summary shape: `assetsTop`, `packagesTop`, `duplicatePackages`, `crossChunkPackages`, `retainedModulesTop`, and `buildCost`.

| Summary key          | Evidence source                            | Bounds                                              |
| -------------------- | ------------------------------------------ | --------------------------------------------------- |
| `buildCost`          | `build summary`                            | filtered fields only                                |
| `assetsTop`          | top assets by raw/gzip size                | fixed Top-N                                         |
| `packagesTop`        | top packages by gzip size                  | fixed Top-N; do not read full `packages list` pages |
| `duplicatePackages`  | E1001 duplicate package summary            | first-pass issue summary only                       |
| `crossChunkPackages` | E1002 cross-chunk duplication summary      | first-pass issue summary only                       |
| `retainedModulesTop` | `tree-shaking retained-modules --limit 10` | filtered fields only; no `--compact`                |

## Workflow

1. Locate or verify `rsdoctor-data.json`. If it is missing or plugin setup is needed, use the install references below.
2. Run CLI version checks only if they have not already been completed in the current session, unless the CLI is missing, a command fails with a version-related error, or the user asks to refresh.
3. For default bundle analysis, run the fixed evidence set above with fixed `--filter` fields and fixed Top-N limits. Run independent data fetches in parallel when possible.
4. For non-default analysis, choose the minimal fields needed for the user's question, map them with [references/rsdoctor-data-types.md](references/rsdoctor-data-types.md), and keep command output compact.
5. For common cases such as similar packages, media assets, bundle optimization, duplicate packages, and tree-shaking questions, use [references/common-analysis-patterns.md](references/common-analysis-patterns.md).
6. Synthesize findings from the compact summary in the required response format. Ask before chain tracing, broader commands, or optimization verification.
7. Track wall-clock timing only when the user asks about performance, elapsed time, or efficiency. If timing is requested, use coarse `command`, `model_analysis`, and `output_generation` buckets without adding commands only to improve precision.

## Execution Environment

- In Codex, do not run `install`, `build`, global CLI installation, version checks, or `rsdoctor-agent...` inside sandbox. Run Rsdoctor CLI setup and data-fetch commands outside sandbox so they can access project files and dependencies normally.

## References

- Commands and options: [references/command-map.md](references/command-map.md)
- Install, config, data location, and troubleshooting: [references/install-rsdoctor.md](references/install-rsdoctor.md), [references/install-rsdoctor-rspack.md](references/install-rsdoctor-rspack.md), [references/install-rsdoctor-webpack.md](references/install-rsdoctor-webpack.md), [references/install-rsdoctor-common.md](references/install-rsdoctor-common.md)
- Raw data fields and `--filter` construction: [references/rsdoctor-data-types.md](references/rsdoctor-data-types.md)
- Similar packages, media assets, bundle optimize, and common question patterns: [references/common-analysis-patterns.md](references/common-analysis-patterns.md)

## Response Format

1. Issues found in the current build and recommended fixes:
   - Group each issue with its fix recommendation instead of splitting issues and solutions into separate sections.
   - Include concrete evidence for each issue (size/time/count/path/rule code).
   - Provide an actionable fix with priority (High/Med/Low) for each issue.
   - For duplicate packages and tree-shaking issues, include a short "continue tracing vs stop here" choice. Only trace chains after user confirmation.
2. Whether deeper analysis is still needed:
   - List remaining gaps by issue categories (for example: dependency duplication, chunking strategy, tree-shaking barriers, loader cost, asset volume).
   - Do not output suggested commands in this section; output category-level follow-up directions only.

Formatting:

- For Top-N insights, prefer a table: `Name | Volume/Time | Count | Recommendation`.
- For large output, use command-specific size controls such as `--filter`, pagination, and `--limit`. Do not use `--compact` with `tree-shaking retained-modules`.

## Troubleshooting

- `rsdoctor-data.json` missing:
  - If `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin` is >= 1.5.11, run the Rsdoctor-enabled build with `RSDOCTOR_OUTPUT='json'`. If the project gates plugin activation with `RSDOCTOR`, set that too.
  - If the plugin version is older than 1.5.11, configure plugin JSON output and run `RSDOCTOR=true npm run build`.
- Command not found:
  - Verify `rsdoctor-agent` exists in PATH.
  - Check `npm view @rsdoctor/agent-cli version` and `rsdoctor-agent --version`.
  - If missing or outdated, run `npm install -g @rsdoctor/agent-cli@latest`, then retry with `rsdoctor-agent`.
- `query` reports unknown tool:
  - Run `list` and use one of the catalog tool names, or switch to direct `<group> <subcommand>` mode.
- Build/install blocked in sandbox:
  - Re-run outside sandbox.
- `rsdoctor-agent...` blocked or incomplete in Codex sandbox:
  - Re-run outside sandbox.
- JSON read error:
  - Verify file path, JSON validity, and permissions.
