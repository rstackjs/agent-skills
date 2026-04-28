# Rsdoctor Skill Command Map

Stable CLI entry:

- `npx @rsdoctor/agent-cli@latest <group> <subcommand> [options]` (recommended)
- `rsdoctor-agent <group> <subcommand> [options]` (if binary is available in PATH)

Top-level command mode:

- `list`
- `query <tool-name> --data-file <path> [--input <json>]`

`query` catalog (current):

- `chunks_list`
- `packages_direct_dependencies`
- `packages_duplicates`
- `packages_similar`
- `build_summary`
- `bundle_optimize`
- `errors_list`
- `tree_shaking_summary`

Option scopes:

- `--data-file <path>`:
  - required for `query`, direct `<group> <subcommand>`, and `ai <group> <subcommand>`
  - not required for `list`, `ai --describe`, `ai --schema`
- `--input <json>`: optional for `query`
- `--filter <...>`: supported by every data-fetch function; use it to return only required fields selected from `@rsdoctor/types` / [rsdoctor-data-types.md](rsdoctor-data-types.md)
- `--compact`: optional for direct `<group> <subcommand>` and `ai <group> <subcommand>`

## Chunks

- `chunks list` -> List all chunks. Pagination: `--page-number`, `--page-size`
- `chunks by-id --id <n>` -> Get chunk detail by numeric id
- `chunks large` -> Find oversized chunks

## Modules

- `modules by-id --id <id>` -> Module detail by id
- `modules by-path --path "<path>"` -> Module lookup by path
- `modules issuer --id <id>` -> Issuer/import chain (recommended as second-pass, after user confirms chain tracing)
- `modules exports` -> Module exports info
- `modules side-effects` -> Non-tree-shakeable modules. Pagination: `--page-number`, `--page-size` (recommend `--page-size 10`)

## Packages

- `packages list` -> Package list with size/duplication info
- `packages by-name --name <pkg>` -> Package lookup by name
- `packages dependencies` -> Dependency graph. Pagination: `--page-number`, `--page-size`
- `packages direct-dependencies` -> Direct third-party package dependencies imported by project/local packages. Tool name: `packages_direct_dependencies`
- `packages duplicates` -> Duplicate package detection (first-pass summary before optional chain tracing)
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
- `build optimize` -> Bundle optimization inputs. Options: `--step`, `--side-effects-page-number`, `--side-effects-page-size` (recommend `--side-effects-page-size 10`)

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

- `tree-shaking summary` -> Overall tree-shaking health summary (can be very large; filter with fields from `rsdoctor-data-types`, compact where useful, and use aggregated results)
- `tree-shaking retained-modules` -> Retained emitted modules by category for tree-shaking diagnosis. Useful options: `--emitted-only`, `--category cjs,barrel,side-effects`, `--sort gzipSize`, `--limit <n>`, and `--filter id,path,packageName,version,category,size,chunks,bailoutReason,recommendation`.
- `tree-shaking bailout-reasons --modules <module-list>` -> Non-tree-shakeable modules by bailout reason for the provided modules. High-volume; only run when explicitly requested, always pass `--modules`, and include at most 100 modules per command.
- `tree-shaking exports-analysis` -> Export-level tree-shaking opportunities

`tree-shaking retained-modules` returns retained module rows with:

| Field                     | Meaning                                       |
| ------------------------- | --------------------------------------------- |
| `id`                      | Module id                                     |
| `path`                    | Module path                                   |
| `packageName` / `version` | Owning package                                |
| `category`                | `cjs`, `barrel`, `side-effects`, or `unknown` |
| `size`                    | Source, parsed, and gzip sizes when available |
| `chunks`                  | Chunk id/name/assets                          |
| `bailoutReason`           | Original bailout/retention reason             |
| `recommendation`          | Optional short recommendation                 |
