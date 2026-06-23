---
name: migrate-to-rstest
description: Migrate Jest or Vitest projects to Rstest. Use when asked to move from Jest/Vitest to Rstest, replace `jest`/`vi` APIs with `@rstest/core`, translate config into `rstest.config.ts`, update scripts/coverage/setup/mocks/snapshots/projects, or diagnose migration failures caused by Rstest's Rsbuild/Rspack execution model or version skew.
---

# Migrate to Rstest

## Goal

Migrate Jest- or Vitest-based tests and config to Rstest with minimal behavior changes. Treat the current Rstest migration docs as the source of truth; this skill adds guardrails for scope, cleanup, and common migration traps.

## Workflow

1. Detect the runner and smallest migration scope (`references/detect-test-framework.md`).
2. Run the dependency/install gate, including Rstest/Rsbuild/Rspack/plugin major compatibility (`references/dependency-install-gate.md`).
3. Read the framework-specific delta file, then consult the official/local Rstest guide for exact mappings:
   - Jest: `references/jest-migration-deltas.md`
   - Vitest: `references/vitest-migration-deltas.md`
   - Global API replacement: `references/global-api-migration.md`
4. Migrate scripts/config/setup before tests. Prefer adapters for existing Rsbuild/Rslib/Rspack projects.
5. Check types and test discovery (`rstest list --filesOnly` is useful before a full run).
6. Run Rstest and fix failures in this order: dependency/version skew, config/resolver, setup/env/coverage, mocks/timers/snapshots, test bodies last.
7. When the migrated scope is green, remove only its scope-local legacy runner files. Drop shared Jest/Vitest devDeps only when no scope still uses them.
8. Summarize files changed, legacy files kept/removed, unsupported fields, and remaining TODOs.

## Non-negotiable guardrails

- Prefer the smallest viable change and fix config/tooling before test logic.
- Do not modify production/business source behavior unless the user explicitly asks.
- Do not bulk-rewrite tests when a local config/setup/mock fix is plausible.
- Preserve assertions, scenario coverage, and coverage thresholds. Never lower thresholds to pass migration.
- No `jest`/`vi` shims or aliases. Rewrite call sites to Rstest APIs; see `references/global-api-migration.md`.
- Do not mutate test name strings while replacing APIs.
- Do not silently drop unknown config fields. Verify against docs or call them out as unsupported.
- Do not broaden a monorepo migration beyond the chosen package/suite/project.

## High-risk Rstest deltas

- Plain `rstest` / `rstest run` is single-run mode; watch mode is `rstest --watch` or `rstest watch`.
- Rstest `globals` defaults to `false`; if globals remain, set `globals: true` and add `@rstest/core/globals` types.
- For latest Rstest, use `defineInlineProject({ name, ... })` for object entries inside `projects`; for Rstest 0.8.x, use plain named objects because `defineInlineProject` is unavailable. Use `defineProject` for top-level project config files.
- Coverage providers require Rstest packages (`@rstest/coverage-istanbul` or `@rstest/coverage-v8`); `coverage.reporters` is plural.
- `detectAsyncLeaks` is only replacement-adjacent for leaked async resources, not a drop-in `detectOpenHandles` clone.
- Rstest runs on Rsbuild/Rspack. Prefer `output.bundleDependencies`, `output.externals`, aliases, adapters, or Rsbuild plugins before changing tests.
- Version compatibility matters: latest Rstest uses Rsbuild/Rspack 2.x; Rstest 0.8.x uses Rsbuild/Rspack 1.x. Choose adapters and Rsbuild plugins by peer dependency compatibility, not package-name major equality.

## Escalate before large edits

If the next fix requires many test edits or production source changes, stop and report: why smaller fixes failed, options, risks, and the recommended path.
