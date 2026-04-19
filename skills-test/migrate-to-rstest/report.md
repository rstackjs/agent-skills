# migrate-to-rstest — evaluation report

## Setup

- **Model**: Sonnet 4.6 (both fixture generation and skill-guided migration)
- **Skill version**: `skills/migrate-to-rstest` at current HEAD
- **Docs**: official Rstest migration guides on `rstest.rs` (Jest / Vitest)
- **Fixtures** (5, under `/tmp/agent-skills-evals/migrate-to-rstest/fixtures`):
  - `jest-basic` — ts-jest + moduleNameMapper (identity-obj-proxy for CSS modules) + transformIgnorePatterns + `__mocks__/` manual mock + coverage thresholds
  - `vitest-basic` — Vitest globals mode, v8 coverage, setupFiles, clearMocks/mockReset, `@app` alias
  - `vitest-multiproject` — pnpm monorepo: root `vitest.workspace.ts`, packages/utils (node), packages/web (jsdom + React + MSW + jest-dom + snapshot), third workspace package `@fixture/shared`
  - `vitest-multiproject-partial` — same shape but migrate only `packages/web`; core/api/ui stay on Vitest
  - `jest-multiproject` — `projects: [...]` + root globalSetup/globalTeardown + per-project displayName + testEnvironmentOptions + setupFiles/setupFilesAfterEnv split
- **Grader**: 64 assertions total across the 5 fixtures — structural checks on configs, devDeps, scripts + post-migration `pnpm test` with coverage thresholds enforced
- **Design**: 10 parallel subagents per A/B pair (5 fixtures × `with_skill` / `without_skill`), 1 sample per cell

## Aggregate

| Config        | Pass  | Pct   | Tokens (mean)      | Time (s) |
| ------------- | ----- | ----- | ------------------ | -------- |
| with_skill    | 64/64 | 100%  | ~45,000            | ~318     |
| without_skill | 48/61 | 78.7% | 77,675             | 676      |

Skill lift: **+21.3 pts pass rate**. Skill also cuts mean token spend ~42% and mean wall time ~53% — the baseline burns extra budget discovering things the skill states up front (globals API mapping, two-phase lifecycle, adapter rewrite, coverage provider swap).

Note: `with_skill` and `without_skill` runs were graded against slightly different assertion sets (64 vs 61 — the grader was tightened between runs to catch ignore-directive injection and React-plugin swaps). The comparison remains directionally valid — every without_skill failure maps to a rule the skill explicitly pins down.

## Per-eval

| Eval                        | With Skill      | Without Skill   | With Skill Time | Without Skill Time |
| --------------------------- | --------------- | --------------- | --------------- | ------------------ |
| jest-basic                  | 11/11           | 9/9             | 283.9s          | 554.3s             |
| vitest-basic                | 12/12           | 8/11            | 175.7s          | 311.9s             |
| vitest-multiproject         | 16/16           | 14/17           | 238.2s          | 1016.9s            |
| vitest-multiproject-partial | 12/12           | 8/11            | 219.3s          | 588.6s             |
| jest-multiproject           | 13/13           | 9/13            | 552.4s          | 907.9s             |

`jest-basic` is the smallest fixture and the only cell where the baseline matches the skill on assertions — Sonnet derives everything from first principles without over-shooting.

## Failure clustering (without_skill)

The 13 `without_skill` failures distribute across four recurring classes, each targeting a behaviour the skill pins down explicitly:

| Failure class                                                 | Count |
| ------------------------------------------------------------- | ----- |
| Legacy config / devDep cleanup missed after green             | 4     |
| Runtime-framework dep swap incomplete                         | 3     |
| Adapter / shim pattern left as Vitest form                    | 3     |
| &nbsp;&nbsp;- jest-dom/vitest adapter not rewritten           |       |
| &nbsp;&nbsp;- describe/it name string mutated by bulk replace |       |
| &nbsp;&nbsp;- `@vitejs/plugin-react` retained under Rstest    |       |
| Coverage: threshold lowered 70 → 60                           | 1     |
| Namespace / type declaration left as `jest.*`                 | 1     |
| Post-migration `pnpm test` failure                            | 1     |

The threshold-lowering case (principle 9 in the skill) is the most consequential: without the skill, one baseline silently relaxed branch coverage from 70% to 60% to make a failing migration pass. This is the kind of regression a later reviewer almost never catches in a diff scan.

## Caveat regression checks (with_skill)

Two caveats called out in an earlier iteration's report were specifically inspected and are gone in this run:

1. **No `/* istanbul | c8 | v8 ignore */` directives in any `src/` file** across all 5 fixtures. The skill now pins down that such directives are off-limits (principle 3).
2. **No `@rsbuild/plugin-react` substitute** for `@vitejs/plugin-react`. `vitest-multiproject` correctly removed the React plugin entirely and configured SWC's automatic JSX runtime via `tools.swc.jsc.transform.react.runtime: 'automatic'` — no plugin needed.

## Notable agent choices (with_skill)

- **`jest-basic` manual-mock resolution**: Rstest resolves aliased manual mocks from `<root>/__mocks__/<alias>/` rather than `src/__mocks__/`. The agent created `__mocks__/@app/logger.ts` and left the original `src/__mocks__/logger.ts` in place (a source file, not a Jest config/setup file). Both pass.
- **`jest-multiproject` globalSetup wiring**: Rstest `globalSetup` is per-project in multi-project mode and does not inherit from root. The agent placed `globalSetup: ['./rstest.global-setup.ts']` under the consuming project. `process.env.__DB_SEED__` propagates to workers (Rstest snapshots `process.env` after globalSetup completes).
- **`vitest-multiproject` adapter rewrite**: `@testing-library/jest-dom/vitest` correctly replaced with `expect.extend(matchers)` from `@testing-library/jest-dom/matchers`. `afterEach(cleanup)` preserved.
- **`vitest-multiproject-partial` isolation**: web migrated standalone — `packages/web/rstest.config.ts` does not import from `vitest/config`, root `vitest.shared.ts` and root devDeps untouched, the remaining three packages still run on Vitest under the same `pnpm -r test`.

## Artifacts

- Raw run outputs: `/tmp/agent-skills-evals/migrate-to-rstest/runs/`
- Fixtures: `/tmp/agent-skills-evals/migrate-to-rstest/fixtures/`
- Grading script: `/tmp/agent-skills-evals/migrate-to-rstest/grade.sh` + `grading-results.txt`
