---
name: rstack-repo-maintain
description: 'Audit and modernize RstackJS/Rspack ecosystem repositories against current infrastructure baselines. Choose between the Rsbuild-style Rstack CLI monorepo lane and the standalone Rslib/Rslint/Rstest package lane; maintain package.json metadata, exports, dependency placement and version freshness; align ESM or dual output, Node/pnpm/TypeScript versions, formatter, CI action pins, release validation, docs, dependencies, and infra PR conventions. Use when updating rstackjs repositories, refreshing infrastructure or package manifest baselines, copying patterns from Rsbuild or maintained exemplars, or reviewing package and tooling consistency.'
metadata:
  internal: true
---

<!-- cspell:words oxfmt -->

# Rstack Repo Maintain

## Overview

Modernize RstackJS repositories without blindly copying config. Use the target's compatibility surface plus current exemplar repositories to make small, verifiable infrastructure upgrades.

## Baseline Evidence

Read `references/repo-baselines.md` when choosing a template repo, explaining where the baseline came from, or deciding between pure ESM and dual output, standalone tools and Rstack CLI, runtime floors, TypeScript majors, formatters, package validation, or CI patterns.

Read `references/package-json-baseline.md` when auditing or changing `package.json`, checking whether dependencies are current, choosing an `@rsbuild/core` peer range, or validating published package contents.

Default starting points:

- Large monorepo and integrated-tooling baseline: `web-infra-dev/rsbuild`. Use its Rstack CLI, pnpm catalog, supply-chain, `oxfmt`, and CI patterns selectively; do not treat it as a drop-in small-package template.
- Primary standalone small-package baseline: `rstackjs/rslog`.
- Pure ESM and Node 20 plugin package baseline: `rstackjs/rsbuild-plugin-publint`.
- Concise AGENTS.md and publint reference: `rstackjs/rslog`, after checking that its prose still matches its configs.
- Additional package validation reference: `rstackjs/rsbuild-plugin-arethetypeswrong`.
- Generated-artifact CLI reference: `rstackjs/prebundle`.
- Dual-package compatibility reference: `rstackjs/rsbuild-plugin-virtual-module`.

Always re-check the target repo and exemplar repo before editing. The reference file is a dated snapshot, not a permanent source of truth.

## Workflow

1. **Inventory the target repo**
   - Read `package.json`, lockfile, `pnpm-workspace.yaml`, `.node-version`, `.rstack/**`, `rstack.config.*`, `rslib.config.*`, `rslint.config.*`, `rstest.config.*`, `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `tsconfig*.json`, `.github/workflows/*`, `README.md`, `AGENTS.md`, release config, and source entry points.
   - Identify package kind: library, Rsbuild/Rspack plugin, CLI, app template, test fixture, or docs package.
   - List current build, lint, typecheck, test, release, and package manager commands before changing them.
   - For published packages, map `files`, `bin`, `types`, and every `exports` target to the source or generated artifact that provides it.

2. **Choose the migration target**
   - Use the standalone lane for focused packages that are already clear with direct Rslib, Rslint, and Rstest configs.
   - Consider the Rstack CLI lane for multi-package repositories that benefit from shared build/test config, unified type-aware linting, staged-file handling, and hook setup. Require each migrated command to have an equivalent Rstack CLI path; do not add the CLI merely to match Rsbuild.
   - Prefer pure ESM for modern libraries and plugins when consumers can support it.
   - Use dual package output only as a deliberate transition when existing CommonJS consumers or public exports require it.
   - Treat runtime support, package exports, CLI bins, side effects, and documented deep imports as compatibility constraints.

3. **Update the infrastructure in small layers**
   - **Package manifest**: follow `references/package-json-baseline.md`. Select the matching core/CLI, plugin, or library profile; check metadata and published entry points; separate npm release freshness from compatibility ranges; and update the manifest and lockfile together. Use `@rsbuild/core` as live evidence, not as a field-for-field template for every package.
   - **Build tooling**: in the standalone lane, use Rslib, keep config minimal, set appropriate `lib.syntax`, emit declarations, and align `package.json#exports` with real output. In the integrated lane, use `rstack.config.ts`, `define.lib`, and shared `rstack/lib` config only when that reduces duplicated configuration. Add `rsbuild-plugin-publint` when the package should validate publish metadata during build.
   - **Linting**: in the standalone lane, use `@rslint/core` and `ts.configs.recommended`; add `js.configs.recommended` only when JavaScript source or config files are intentionally linted. In the integrated lane, use the repository's supported `rs lint` command and preserve type-check coverage.
   - **Formatting**: preserve the repository's formatter unless the migration explicitly includes formatter replacement. Current Rsbuild uses `oxfmt`, while maintained standalone packages may use Prettier or dprint. Keep generated artifacts and lock files ignored where appropriate.
   - **Test tooling**: prefer Rstest for JavaScript/TypeScript unit tests in Rstack repositories. When a repo still uses Vitest or Jest, use the `migrate-to-rstest` skill, map scripts and configs to `@rstest/core`, keep Playwright or other browser E2E tooling separate, and remove legacy runner deps/configs only after the migrated scope is green.
   - **Runtime and package manager**: verify Node support from code, dependencies, package `engines`, `.node-version`, CI, and release workflows. Update `packageManager`, pnpm engine constraints, lockfile, and CI together. Do not copy Rsbuild's Node 22 minimum into a Node 20-compatible package without a concrete runtime reason.
   - **pnpm policy**: for monorepos, consider catalogs, `catalogMode`, unused-catalog cleanup, peer-install policy, build-script allowlists, `minimumReleaseAge`, and strict dependency-build settings. Adopt each option only after checking install behavior, native dependencies, trusted release exceptions, and the repository's pnpm version.
   - **GitHub Actions**: keep `.github/workflows/*` aligned with the chosen baseline repo. Pin third-party actions to commit hashes, not floating tags, and update action pins by copying or refreshing the baseline pattern instead of inventing new pins.
   - **TypeScript**: choose the major supported by the target toolchain instead of applying one global version. Remove stale compiler options, prefer `target: "ES2023"` for compatible Node packages, and keep module resolution consistent with runtime output. For TypeScript 7 packages, remove the old direct `@typescript/native-preview` dependency and explicit Rslib `dts: { tsgo: true }`; keep declaration generation enabled and validate emitted declarations. Do not introduce native-preview or tsgo as a new default.
   - **Docs**: keep `README.md` focused on purpose, install, usage, options, supported runtimes, release/license links. Add a concise `AGENTS.md` in the rsbuild-style shape: Stack, Commands, Project structure, and Code style.
   - **Dependency cleanup**: run a repo-appropriate unused dependency check such as Knip when feasible, then remove only dependencies proven unused or misplaced. Do not add Knip as a dependency unless the repo starts using it in scripts; treat `pnpm stage` and intentional legacy tsgo tool dependencies as known false positives when applicable.

4. **Preserve behavior while modernizing**
   - Do not touch business logic unless the infra change requires it.
   - Keep compatibility breaks explicit in commit/PR notes: ESM-only output, removed exports, changed CLI behavior, or dependency placement changes.
   - If a repo needs multiple risky changes, split them into reviewable PR-sized batches.

5. **Prepare the infra PR**
   - Create the infrastructure update branch from the latest `origin/main` unless the user asks for a different base.
   - Use a specific PR title starting with `chore(infra):`, for example `chore(infra): adopt Rstack CLI and package validation` or `chore(infra): align build and lint tooling`.
   - Keep each tool update or tool configuration as its own commit unit. Use commit titles such as `chore(deps): update rslint`, `chore(infra/build): align declaration output`, or `chore(infra/ci): pin workflow actions`.
   - Do not mix unrelated tool changes, generated lockfile updates, and source fixes in a single commit unless the tool update requires them to stay atomic.

6. **Validate before cleanup**
   - Run install with the repo package manager.
   - Run lint, format check, typecheck if present, build, and tests.
   - For packages, run `npm pack --dry-run` or the repository's publish dry-run path unless an enforcing `pluginPublint` is enabled in `rslib.config.ts` and has completed in a successful non-watch build. In that case, treat the build-time publint result as the default package validation and skip the separate pack command. Do not take this shortcut when the plugin is disabled, conditional activation was not satisfied, `throwOn: 'never'` is set, only a watch build ran, or the task explicitly requires tarball inspection. Never run plain `pnpm pack` in the target working tree because it writes a `.tgz`; use a temporary destination with cleanup when explicit tarball inspection is required.
   - Smoke test import/CLI paths that changed.
   - When migrating to Rstack CLI, compare generated package artifacts and test discovery with the pre-migration commands.
   - Remove obsolete configs and dependencies only after the new path is green.

## Output

When reporting back, include:

- Target baseline and why it was chosen.
- Files changed, grouped by build/lint/TypeScript/CI/docs/dependencies.
- Breaking changes or compatibility risks.
- Commands run and their result.
- Any deliberate deviations from the Rstack baseline.
