---
name: rstack-repo-maintain
description: 'Audit and modernize RstackJS/Rspack ecosystem repositories to the current shared infrastructure baseline: Rslib ESM or dual builds, Rslint recommended rules, Rstest test tooling, Node 20+ support where appropriate, TypeScript 6 and tsgo where compatible, concise README/AGENTS docs, release workflow cleanup, unused dependency removal, and infra PR commit conventions. Use when updating rstackjs repositories, copying infra patterns from maintained exemplars, or reviewing package/tooling consistency.'
---

# Rstack Repo Maintain

## Overview

Modernize RstackJS repositories without blindly copying config. Use current repository state and recently maintained exemplar repos to make small, verifiable infrastructure upgrades.

## Baseline Evidence

Read `references/repo-baselines.md` when choosing a template repo, explaining where the baseline came from, or deciding whether a migration should be pure ESM, dual package, Node 20+, TypeScript 6, Rslint, Rstest, or tsgo.

Default starting points:

- Primary small-package baseline: `rstackjs/rslog`.
- Pure ESM and Node 20 plugin package baseline: `rstackjs/rsbuild-plugin-publint`.
- Concise AGENTS.md and tsgo/publint reference: `rstackjs/rslog`.
- Additional package validation reference: `rstackjs/rsbuild-plugin-arethetypeswrong`.
- Additional Rslib `dts.tsgo` implementation reference: `rstackjs/rsbuild-plugin-virtual-module`.

Always re-check the target repo and exemplar repo before editing. The reference file is a dated snapshot, not a permanent source of truth.

## Workflow

1. **Inventory the target repo**
   - Read `package.json`, lockfile, `rslib.config.*`, `rslint.config.*`, `rstest.config.*`, `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `tsconfig*.json`, `.github/workflows/*`, `README.md`, `AGENTS.md`, release config, and source entry points.
   - Identify package kind: library, Rsbuild/Rspack plugin, CLI, app template, test fixture, or docs package.
   - List current build, lint, typecheck, test, release, and package manager commands before changing them.

2. **Choose the migration target**
   - Prefer pure ESM for modern libraries and plugins when consumers can support it.
   - Use dual package output only as a deliberate transition when existing CommonJS consumers or public exports require it.
   - Treat runtime support, package exports, CLI bins, side effects, and documented deep imports as compatibility constraints.

3. **Update the infrastructure in small layers**
   - **Rslib**: use `rslib` for builds, keep config minimal, set appropriate `lib.syntax`, emit declarations, and align `package.json#exports` with real output. Add `rsbuild-plugin-publint` when the package should validate publish metadata during build.
   - **Rslint**: use `@rslint/core`; use `ts.configs.recommended` for TypeScript packages. Add `js.configs.recommended` only when JavaScript source or config files are intentionally linted.
   - **Prettier**: if the repo already carries Prettier or should check formatting, wire it into lint scripts with the repo's established style (`prettier --check .` / `prettier --write .` or `-c` / `-w`) and keep generated artifacts ignored by `.prettierignore`.
   - **Test tooling**: prefer Rstest for JavaScript/TypeScript unit tests in Rstack repositories. When a repo still uses Vitest or Jest, use the `migrate-to-rstest` skill, map scripts and configs to `@rstest/core`, keep Playwright or other browser E2E tooling separate, and remove legacy runner deps/configs only after the migrated scope is green.
   - **Node/CI**: set Node support to 20+ when the package can support it, but do not copy an exact `engines.node` range unless the target repo should declare one. Do not blindly add a Node 20 matrix or an extra CI build step when the maintained baseline intentionally keeps CI latest-only for speed or already builds in release.
   - **GitHub Actions**: keep `.github/workflows/*` aligned with the chosen baseline repo. Pin third-party actions to commit hashes, not floating tags, and update action pins by copying or refreshing the baseline pattern instead of inventing new pins.
   - **TypeScript**: upgrade to TypeScript 6, remove stale/deprecated compiler options, prefer `target: "ES2023"` for Node 20+ packages, and keep module resolution consistent with runtime output.
   - **tsgo**: enable Rslib declaration `dts: { tsgo: true }` only after checking compatibility with declaration bundling, package shape, and installed `@typescript/native-preview`. Pin native-preview to an exact version and validate emitted declarations plus package contents.
   - **Docs**: keep `README.md` focused on purpose, install, usage, options, supported runtimes, release/license links. Add a concise `AGENTS.md` in the rsbuild-style shape: Stack, Commands, Project structure, and Code style.
   - **Dependency cleanup**: run a repo-appropriate unused dependency check such as Knip when feasible, then remove only dependencies proven unused or misplaced. Do not add Knip as a dependency unless the repo starts using it in scripts; treat `pnpm stage` and tsgo tool dependencies as known false positives when applicable.

4. **Preserve behavior while modernizing**
   - Do not touch business logic unless the infra change requires it.
   - Keep compatibility breaks explicit in commit/PR notes: Node floor, ESM-only output, removed exports, changed CLI behavior, or dependency placement changes.
   - If a repo needs multiple risky changes, split them into reviewable PR-sized batches.

5. **Prepare the infra PR**
   - Create the infrastructure update branch from the latest `origin/main` unless the user asks for a different base.
   - Use a specific PR title starting with `chore(infra):`, for example `chore(infra): enable tsgo and package validation` or `chore(infra): align build and lint tooling`.
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
