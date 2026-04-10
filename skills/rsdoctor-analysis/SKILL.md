---
name: rsdoctor-analysis
description: Use when analyzing Rspack/Webpack bundles from local `rsdoctor-data.json` and producing evidence-based optimization recommendations.
---

# Rsdoctor Analysis Assistant Skill

Use `@rsdoctor/agent-cli` to read `rsdoctor-data.json` and provide evidence-based optimization recommendations.

Response order (required): High-Priority Issues -> Reference Chain Traceability -> Proposed Solutions -> Next Deep-Dive Issue Categories (Not commands).

## Guardrails

- Default behavior is read-only analysis.
- Prefer running CLI commands in background mode when possible, and then collect/inspect results after execution.
- Do not modify user code/config except these explicit cases:
  - `install`: install `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin`, and update `package.json`.
  - `config`: add Rsdoctor plugin config to supported config files.
- Optional verification workflow (only with user confirmation):
  - If the goal is to validate optimization impact, you may adjust `splitChunks` and re-run build to compare results.
  - Ask for user confirmation before modifying `splitChunks` and before re-running build.
- In Codex, do not run `install` or `build` inside sandbox.
- For all analysis commands, provide recommendations only. Do not auto-apply optimization edits.

## Stable CLI Entry

- Package entry (recommended):
  - `npx @rsdoctor/agent-cli ...`
- Binary entry (if available in PATH):
  - `rsdoctor-agent ...`
- Top-level command formats:
  - `describe-tools`
  - `run-tool <tool-name> --data-file <path> [--input <json>]`
  - `analyze <query> --data-file <path> [--format json|text]`
  - `<group> <subcommand> --data-file <path> [--compact]`
- `ai` namespace command formats:
  - `ai --describe`
  - `ai --schema <group>.<subcommand>`
  - `ai <group> <subcommand> --data-file <path> [--compact]`
- `run-tool` catalog coverage (current):
  - `chunks_list`
  - `packages_duplicates`
  - `packages_similar`
  - `build_summary`
  - `bundle_optimize`
  - `errors_list`
  - `tree_shaking_summary`
- Option scopes:
  - `--data-file <path>`:
    - required for `run-tool`, `analyze`, direct `<group> <subcommand>`, and `ai <group> <subcommand>`
    - not required for `describe-tools`, `ai --describe`, `ai --schema`
  - `--input <json>`: optional for `run-tool`
  - `--format json|text`: optional for `analyze`
  - `--compact`: optional for direct `<group> <subcommand>` and `ai <group> <subcommand>`

## Workflow

1. Verify prerequisites:
   - Node.js 18+
   - `@rsdoctor/rspack-plugin >= 1.1.2` (Rspack ecosystem) or `@rsdoctor/webpack-plugin >= 1.1.2` (Webpack)
2. Locate `rsdoctor-data.json`:
   - Common paths: `dist/rsdoctor-data.json`, `output/rsdoctor-data.json`, `static/rsdoctor-data.json`, `.rsdoctor/rsdoctor-data.json`
3. If `rsdoctor-data.json` is missing:
   - Configure plugin first:
     - Rspack/Rsbuild/Rslib/Rspress/Modern.js: [reference/install-rsdoctor-rspack.md](reference/install-rsdoctor-rspack.md)
     - Webpack: [reference/install-rsdoctor-webpack.md](reference/install-rsdoctor-webpack.md)
   - Required plugin output:
     - `disableClientServer: true`
     - `output.mode: 'brief'`
     - `output.options.type: ['json']`
   - Auto-generate file by running:
     - `RSDOCTOR=true npm run build` (or pnpm/yarn equivalent)
     - In Codex, do not run this build in sandbox.
4. Choose command mode and run analysis:
   - If query can be covered by tool catalog commands, prefer `describe-tools` + `run-tool` (or `analyze` for one-shot natural language query).
   - If command is outside tool catalog coverage, run direct subcommand mode: `<group> <subcommand> --data-file <path>`.
   - If schema discovery is needed for direct mode, use `ai --describe` and `ai --schema <group>.<subcommand>`.
   - Path query pattern: run `modules by-path`, then `modules by-id` if multiple matches.
5. Synthesize and output in required response format.
6. Optional optimization verification (only if user confirms):
   - Update `splitChunks` according to agreed optimization plan.
   - Rebuild with `RSDOCTOR=true npm run build` (or pnpm/yarn equivalent) outside sandbox in Codex.
   - Re-run the same analysis commands and compare before/after results.

## Command Coverage

- Direct subcommand mode supports groups:
  - `chunks`, `modules`, `packages`, `assets`, `loaders`, `build`, `bundle`, `errors`, `rules`, `server`, `tree-shaking`
- `run-tool` only supports tool catalog coverage listed in "Stable CLI Entry".
- Full command map is in:
  - [reference/command-map.md](reference/command-map.md)

## Response Format

1. High-priority issues in current build data:
   - Include concrete evidence (size/time/count/path/rule code).
2. Whether reference chains can be traced:
   - For example, duplicate packages should include import/reference chain findings when available.
   - If not available, explicitly state what is missing.
3. Proposed solutions:
   - Provide actionable recommendations with priority (High/Med/Low).
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
  - Verify `npx @rsdoctor/agent-cli describe-tools` works in current shell.
  - If using binary mode, verify `rsdoctor-agent` exists in PATH.
- `run-tool` reports unknown tool:
  - Run `describe-tools` and use one of the catalog tool names, or switch to direct `<group> <subcommand>` mode.
- Build/install blocked in sandbox:
  - Re-run outside sandbox.
- JSON read error:
  - Verify file path, JSON validity, and permissions.
