---
name: rsdoctor-analysis
description: Use when analyzing Rspack/Webpack bundles from local `rsdoctor-data.json` and producing evidence-based optimization recommendations.
---

# Rsdoctor Analysis Assistant Skill

Use the local Rsdoctor analysis CLI script (`scripts/rsdoctor.js`) to read `rsdoctor-data.json` and provide evidence-based optimization recommendations.

Response order (required): High-Priority Issues -> Reference Chain Traceability -> Proposed Solutions -> Next Deep-Dive Analysis.

## Guardrails

- Default behavior is read-only analysis.
- Do not modify user code/config except these explicit cases:
  - `install`: install `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin`, and update `package.json`.
  - `config`: add Rsdoctor plugin config to supported config files.
- Optional verification workflow (only with user confirmation):
  - If the goal is to validate optimization impact, you may adjust `splitChunks` and re-run build to compare results.
  - Ask for user confirmation before modifying `splitChunks` and before re-running build.
- In Codex, do not run `install` or `build` inside sandbox.
- For all analysis commands, provide recommendations only. Do not auto-apply optimization edits.

## Stable CLI Entry

- Repository-root entry:
  - `node skills/rsdoctor-analysis/scripts/rsdoctor.js <group> <subcommand> [options]`
- Skill-directory entry:
  - `node scripts/rsdoctor.js <group> <subcommand> [options]`
- Command format:
  - `<group> <subcommand> [--option value] --data-file <path> [--compact]`
- Global options:
  - `--data-file <path>` (required)
  - `--compact` (optional)

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
4. Run analysis commands:
   - Path query: run `modules by-path`, then `modules by-id` if multiple matches.
   - Other queries: run target command directly.
5. Synthesize and output in required response format.
6. Optional optimization verification (only if user confirms):
   - Update `splitChunks` according to agreed optimization plan.
   - Rebuild with `RSDOCTOR=true npm run build` (or pnpm/yarn equivalent) outside sandbox in Codex.
   - Re-run the same analysis commands and compare before/after results.

## Command Coverage

- Covered groups:
  - `chunks`, `modules`, `packages`, `assets`, `loaders`, `build`, `bundle`, `errors`, `rules`, `server`, `tree-shaking`
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
   - List remaining gaps and the next command/step to close each gap.

Formatting:

- For Top-N insights, prefer a table: `Name | Volume/Time | Count | Recommendation`.
- For large output, use `--compact`.

## Troubleshooting

- `rsdoctor-data.json` missing:
  - Configure plugin and run `RSDOCTOR=true npm run build`.
- Command not found:
  - Verify CLI entry path and current working directory.
- Build/install blocked in sandbox:
  - Re-run outside sandbox.
- JSON read error:
  - Verify file path, JSON validity, and permissions.
