---
name: migrate-to-rstest
description: Migrate Jest or Vitest projects to Rstest. Use when asked to move from Jest/Vitest to Rstest, replace `jest`/`vi` APIs with `@rstest/core`, translate config into `rstest.config.ts`, update scripts/coverage/setup/mocks/snapshots/projects, or diagnose config-loading warnings, migration failures, and memory/performance regressions caused by Rstest's Rsbuild/Rspack execution model, DOM dependency bundling, runtime-mocked module build graphs, or version skew.
---

<!-- cspell:words TYPELESS -->

# Migrate to Rstest

## Goal

Migrate Jest/Vitest tests and config to Rstest with minimal behavior changes. Use the current Rstest migration docs for exact mappings; this skill adds scope, dependency, and cleanup guardrails.

## Workflow

1. Detect runner and scope (`references/detect-test-framework.md`).
2. Run dependency/version gates (`references/dependency-install-gate.md`).
3. Read only the needed deltas: Jest, Vitest, and/or global API replacement.
4. Migrate scripts/config/setup before tests; prefer adapters or Rsbuild/Rspack config fixes before editing test bodies.
5. If config loading emits `[MODULE_TYPELESS_PACKAGE_JSON]`, declare the config's module format with `references/config-module-type.md`; do not suppress the warning or change the whole package's module type without an audit.
6. Validate discovery/types/run, fixing failures in this order: dependency skew, config/resolver, setup/env/coverage, mocks/timers/snapshots, test bodies.
7. If a `jsdom`, `happy-dom`, or other browser-like environment has much higher peak RSS or build cost than Jest/Vitest, compare equivalent runs and tune dependency bundling with `references/dom-dependency-bundling.md` before changing worker counts or test code.
8. If a test fully mocks a heavy module but Rspack still compiles that module's source graph, run the narrow `output.externals` experiment in `references/mocked-module-build-graph.md`.
9. After the scope is green, remove only legacy files owned by that scope. Remove a devDep only after verifying that no other package or repository scope uses it.
10. Summarize changes, kept legacy files, unsupported fields, performance tradeoffs, and TODOs.

## Guardrails

- Keep the smallest viable scope; do not broaden a monorepo migration or bulk-rewrite tests when config/setup fixes are plausible.
- Do not change production behavior, assertions, test names, scenarios, or coverage thresholds to make migration pass.
- No `jest`/`vi` shims or aliases; rewrite call sites to Rstest APIs (`references/global-api-migration.md`).
- Do not silently drop unknown config fields; verify or report them as unsupported.

## High-risk Rstest deltas

- `rstest` / `rstest run` is single-run; watch mode is `rstest --watch` or `rstest watch`.
- `globals` defaults to `false`; if globals remain, set `globals: true` and add `@rstest/core/globals` types.
- An ESM-style `rstest.config.ts` in a package without an explicit module type can trigger Node's `[MODULE_TYPELESS_PACKAGE_JSON]` warning. Prefer `rstest.config.mts` for a CommonJS or mixed package; add `"type": "module"` only when the whole package is intentionally ESM-compatible.
- Rstest runs on Rsbuild/Rspack. Use `references/dependency-install-gate.md` for latest-only APIs, coverage providers, adapters, plugins, and toolchain-version fallbacks.
- Browser-like DOM environments bundle all third-party dependencies by default. Treat a peak-RSS regression as a possible build/bundling issue before assuming the migrated tests leak memory.
- `rs.mock()` replaces a module at runtime; it does not by itself prune that module from Rspack's build graph. A fully mocked renderer, editor, or UI module can still pull a large source tree into compilation.

## Escalate before large edits

If the next fix requires many test edits or production source changes, stop and report: why smaller fixes failed, options, risks, and the recommended path.
