---
name: rstack-repo-maintain
description: 'Audit and modernize RstackJS/Rspack ecosystem repositories to the current shared infrastructure baseline: Rslib ESM or dual builds, Rslint recommended rules, Node 20+ support and CI, TypeScript 6 and tsgo where appropriate, concise README/AGENTS docs, release workflow cleanup, unused dependency removal, and infra PR commit conventions. Use when updating rstackjs repositories, copying infra patterns from maintained exemplars, or reviewing package/tooling consistency.'
---

<!-- cspell:words chenjiahan -->

# Rstack Repo Maintain

## Overview

Modernize RstackJS repositories without blindly copying config. Use current repository state and recently maintained exemplar repos to make small, verifiable infrastructure upgrades.

## Baseline Evidence

Read `references/repo-baselines.md` when choosing a template repo, explaining where the baseline came from, or deciding whether a migration should be pure ESM, dual package, Node 20+, TypeScript 6, Rslint, or tsgo.

Default starting points:

- Primary chenjiahan-maintained package baseline: `rstackjs/rslog`.
- Pure ESM and Node 20 plugin package baseline: `rstackjs/rsbuild-plugin-publint`.
- AGENTS.md plus artifact validation reference: `rstackjs/rsbuild-plugin-arethetypeswrong`.
- Rslib `dts.tsgo` reference only: `rstackjs/rsbuild-plugin-virtual-module`.

Always re-check the target repo and exemplar repo before editing. The reference file is a dated snapshot, not a permanent source of truth.

## Workflow

1. **Inventory the target repo**
   - Read `package.json`, lockfile, `rslib.config.*`, `rslint.config.*`, `tsconfig*.json`, `.github/workflows/*`, `README.md`, `AGENTS.md`, release config, and source entry points.
   - Identify package kind: library, Rsbuild/Rspack plugin, CLI, app template, test fixture, or docs package.
   - List current build, lint, typecheck, test, release, and package manager commands before changing them.

2. **Choose the migration target**
   - Prefer pure ESM for modern libraries and plugins when consumers can support it.
   - Use dual package output only as a deliberate transition when existing CommonJS consumers or public exports require it.
   - Treat runtime support, package exports, CLI bins, side effects, and documented deep imports as compatibility constraints.

3. **Update the infrastructure in small layers**
   - **Rslib**: use `rslib` for builds, keep config minimal, set appropriate `lib.syntax`, emit declarations, and align `package.json#exports` with real output.
   - **Rslint**: use `@rslint/core`; enable `js.configs.recommended` when JavaScript files are linted and `ts.configs.recommended` for TypeScript. Keep rule disables scoped and justified.
   - **Node/CI**: set Node support to 20+ when the package can support it; run CI on Node 20 plus 24, or document why a narrower/latest-only matrix is acceptable.
   - **GitHub Actions**: keep `.github/workflows/*` aligned with the chosen baseline repo. Pin third-party actions to commit hashes, not floating tags, and update action pins by copying or refreshing the baseline pattern.
   - **TypeScript**: upgrade to TypeScript 6, remove stale/deprecated compiler options, prefer `target: "ES2023"` for Node 20+ packages, and keep module resolution consistent with runtime output.
   - **tsgo**: enable Rslib declaration `dts: { tsgo: true }` only after checking compatibility with declaration bundling, package shape, and installed `@typescript/native-preview`.
   - **Docs**: keep `README.md` focused on purpose, install, usage, options, supported runtimes, release/license links. Add a concise `AGENTS.md` with repo layout, commands, package contract, and validation expectations.
   - **Dependency cleanup**: run a repo-appropriate unused dependency check such as Knip when feasible, then remove only dependencies proven unused or misplaced.

4. **Preserve behavior while modernizing**
   - Do not touch business logic unless the infra change requires it.
   - Keep compatibility breaks explicit in commit/PR notes: Node floor, ESM-only output, removed exports, changed CLI behavior, or dependency placement changes.
   - If a repo needs multiple risky changes, split them into reviewable PR-sized batches.

5. **Prepare the infra PR**
   - Create the infrastructure update branch from the latest `origin/main` unless the user asks for a different base.
   - Use a PR title starting with `chore(infra):`, for example `chore(infra): update repository baseline`.
   - Keep each tool update or tool configuration as its own commit unit. Use commit titles such as `chore(deps): update rslint to 0.6.1`, `chore(infra/tsgo): enable tsgo declaration build`, or `chore(infra/ci): pin workflow actions`.
   - Do not mix unrelated tool changes, generated lockfile updates, and source fixes in a single commit unless the tool update requires them to stay atomic.

6. **Validate before cleanup**
   - Run install with the repo package manager.
   - Run lint, typecheck if present, build, and tests.
   - Run `npm pack --dry-run` or the repo's publish dry-run path for packages.
   - Smoke test import/CLI paths that changed.
   - Remove obsolete configs and dependencies only after the new path is green.

## Output

When reporting back, include:

- Target baseline and why it was chosen.
- Files changed, grouped by build/lint/TypeScript/CI/docs/dependencies.
- Breaking changes or compatibility risks.
- Commands run and their result.
- Any deliberate deviations from the Rstack baseline.
