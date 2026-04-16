# Rsdoctor Skill Command Map

Stable CLI entry:

- `npx @rsdoctor/agent-cli <group> <subcommand> [options]` (recommended)
- `rsdoctor-agent <group> <subcommand> [options]` (if binary is available in PATH)

Top-level command mode:

- `describe-tools`
- `run-tool <tool-name> --data-file <path> [--input <json>]`
- `analyze <query> --data-file <path> [--format json|text]`


`run-tool` catalog (current):

- `chunks_list`
- `packages_duplicates`
- `packages_similar`
- `build_summary`
- `bundle_optimize`
- `errors_list`
- `tree_shaking_summary`

Option scopes:

- `--data-file <path>`:
  - required for `run-tool`, `analyze`, direct `<group> <subcommand>`, and `ai <group> <subcommand>`
  - not required for `describe-tools`, `ai --describe`, `ai --schema`
- `--input <json>`: optional for `run-tool`
- `--format json|text`: optional for `analyze`
- `--compact`: optional for direct `<group> <subcommand>` and `ai <group> <subcommand>`

## Chunks

- `chunks list` -> List all chunks. Pagination: `--page-number`, `--page-size`
- `chunks by-id --id <n>` -> Get chunk detail by numeric id
- `chunks large` -> Find oversized chunks

## Modules

- `modules by-id --id <id>` -> Module detail by id
- `modules by-path --path "<path>"` -> Module lookup by path
- `modules issuer --id <id>` -> Issuer/import chain
- `modules exports` -> Module exports info
- `modules side-effects` -> Non-tree-shakeable modules. Pagination: `--page-number`, `--page-size`

## Packages

- `packages list` -> Package list with size/duplication info
- `packages by-name --name <pkg>` -> Package lookup by name
- `packages dependencies` -> Dependency graph. Pagination: `--page-number`, `--page-size`
- `packages duplicates` -> Duplicate package detection
- `packages similar` -> Similar package detection

## Assets

- `assets list` -> Asset list with size info
- `assets diff --baseline <path> --current <path>` -> Compare two builds
- `assets media` -> Media optimization guidance

## Loaders

- `loaders hot-files` -> Slowest loader/file pairs. Options: `--page-number`, `--page-size`, `--min-costs`
- `loaders directories` -> Loader times by directory. Options: `--page-number`, `--page-size`, `--min-total-costs`

## Build

- `build summary` -> Build summary and costs
- `build entrypoints` -> Entrypoints
- `build config` -> Build config snapshot
- `build optimize` -> Bundle optimization inputs. Options: `--step`, `--side-effects-page-number`, `--side-effects-page-size`

## Bundle

- `bundle optimize` -> Alias of `build optimize`

## Errors

- `errors list` -> All errors and warnings
- `errors by-code --code <code>` -> Filter by code
- `errors by-level --level <level>` -> Filter by level

## Rules

- `rules list` -> Rule scan results

## Server

- `server port` -> Current JSON data file path

## Tree-Shaking

- `tree-shaking summary` -> Overall tree-shaking health summary
- `tree-shaking side-effects-only` -> E1007 side-effects-only imports
- `tree-shaking cjs-require` -> E1008 bare require usage
- `tree-shaking esm-to-cjs` -> E1009 ESM resolved to CJS
- `tree-shaking bailout-reasons` -> Non-tree-shakeable modules by bailout reason. Pagination: `--page-number`, `--page-size`
- `tree-shaking exports-analysis` -> Export-level tree-shaking opportunities
