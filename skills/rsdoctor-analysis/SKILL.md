---
name: rsdoctor-analysis
description: Use when analyzing Rspack/Webpack bundles from local `rsdoctor-data.json` and producing evidence-based optimization recommendations.
---

# Rsdoctor Analysis Assistant Skill

Use `@rsdoctor/agent-cli` to read `rsdoctor-data.json` and provide evidence-based optimization recommendations.

Response order (required): High-Priority Issues -> Proposed Solutions -> Optional Reference-Chain Follow-up Choices -> Next Deep-Dive Issue Categories (Not commands).

## Guardrails

- Default behavior is read-only analysis.
- Use `@rsdoctor/agent-cli` for bundle data access; prefer background execution when possible, then collect and summarize outputs.
- Reuse already returned results from current context whenever possible. Do not re-run the same subcommand unless required fields are missing or the user asks for a refresh.
- Every `@rsdoctor/agent-cli` data-fetch command supports `--filter`; use it by default to keep only fields required for the current question.
- Build `--filter` field selections from [reference/rsdoctor-data-types.md](reference/rsdoctor-data-types.md) so field names match `@rsdoctor/types` instead of guessing from raw output.
- For side-effects investigations, use small pagination (`--page-size 10` / `--side-effects-page-size 10`). Do not use oversized page sizes.
- For retained emitted module analysis, prefer `tree-shaking retained-modules` with `--emitted-only`, bounded `--category`, `--sort gzipSize`, `--limit`, and a narrow `--filter`.
- For broader tree-shaking issues, use `tree-shaking summary` directly and control output with `--filter` plus `--compact` where useful.
- Treat `tree-shaking bailout-reasons` as high-volume by default. Do not run it unless the user explicitly asks for bailout reason analysis, and always pass the target module list with `--modules` (maximum 100 modules).
- Use a per-step token budget gate: if one command exceeds `20k` tokens (o200k_base) or raw output exceeds `2 MB`, stop adding broad-scope commands and switch to filtered or targeted queries.
- For duplicate packages and tree-shaking issues, do first-pass issue identification by default. Do not immediately trace reference/import chains.
- At the end of analysis, provide next-step choices and let the user decide whether to continue with reference-chain tracing.
- Do not modify user code/config except these explicit cases:
  - `install`: install `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin`, and update `package.json`.
  - `config`: add Rsdoctor plugin config to supported config files.
- Optional verification workflow (only with user confirmation):
  - If the goal is to validate optimization impact, you may adjust `splitChunks` and re-run build to compare results.
  - Ask for user confirmation before modifying `splitChunks` and before re-running build.
- In Codex, do not run `install` or `build` inside sandbox.
- For all analysis commands, provide recommendations only. Do not auto-apply optimization edits.

## Workflow

1. Locate or verify `rsdoctor-data.json`. If it is missing or plugin setup is needed, use the install references below.
2. Choose the command from [reference/command-map.md](reference/command-map.md). Start with `list` + `query` when possible; fall back to direct `<group> <subcommand>` when needed.
3. Before each data fetch, choose the minimal fields needed for the current question, map them with [reference/rsdoctor-data-types.md](reference/rsdoctor-data-types.md), and pass `--filter`.
4. For common cases such as similar packages, media assets, bundle optimization, duplicate packages, and tree-shaking questions, use [reference/common-analysis-patterns.md](reference/common-analysis-patterns.md).
5. Synthesize findings in the required response format. Ask before chain tracing or optimization verification.

## References

- Commands and options: [reference/command-map.md](reference/command-map.md)
- Install, config, data location, and troubleshooting: [reference/install-rsdoctor.md](reference/install-rsdoctor.md), [reference/install-rsdoctor-rspack.md](reference/install-rsdoctor-rspack.md), [reference/install-rsdoctor-webpack.md](reference/install-rsdoctor-webpack.md), [reference/install-rsdoctor-common.md](reference/install-rsdoctor-common.md)
- Raw data fields and `--filter` construction: [reference/rsdoctor-data-types.md](reference/rsdoctor-data-types.md)
- Similar packages, media assets, bundle optimize, and common question patterns: [reference/common-analysis-patterns.md](reference/common-analysis-patterns.md)

## Response Format

1. High-priority issues in current build data:
   - Include concrete evidence (size/time/count/path/rule code).
2. Proposed solutions:
   - Provide actionable recommendations with priority (High/Med/Low).
3. Optional reference-chain follow-up choices:
   - For duplicate packages and tree-shaking issues, provide a short "continue tracing vs stop here" choice.
   - Only trace chains after user confirmation.
4. Whether deeper analysis is still needed:
   - List remaining gaps by issue categories (for example: dependency duplication, chunking strategy, tree-shaking barriers, loader cost, asset volume).
   - Do not output suggested commands in this section; output category-level follow-up directions only.

Formatting:

- For Top-N insights, prefer a table: `Name | Volume/Time | Count | Recommendation`.
- For large output, use `--compact`.

## Troubleshooting

- `rsdoctor-data.json` missing:
  - Configure plugin and run `RSDOCTOR=true npm run build`.
- Command not found:
  - Verify `npx @rsdoctor/agent-cli list` works in current shell.
  - If using binary mode, verify `rsdoctor-agent` exists in PATH.
- `query` reports unknown tool:
  - Run `list` and use one of the catalog tool names, or switch to direct `<group> <subcommand>` mode.
- Build/install blocked in sandbox:
  - Re-run outside sandbox.
- JSON read error:
  - Verify file path, JSON validity, and permissions.
