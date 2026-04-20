# rstest-best-practices — eval report (iteration 1)

## Setup

- **Skill under test**: `skills/rstest-best-practices/SKILL.md` (34 rules across 5 chapters: assertion, isolation, mock boundary, async/timer, Rstest-specific)
- **Baseline**: snapshot of the previous checklist-style `SKILL.md` (131 lines) kept at `skill-snapshot/rstest-best-practices/SKILL.md` (gitignored)
- **Model**: `sonnet` for both task subagents and graders
- **Eval count**: 10 scenarios × 2 variants (`with_skill` vs `old_skill`) = 20 runs
- **Scenario sourcing**: 6 independent subagents sampled testing scenarios **without** seeing the skill, then clustered by frequency — 8/10 scenarios were unanimous (6/6), 2 were near-unanimous (5/6 or 4/6). This avoids reverse-engineering scenarios from the rule list.
- **Fixture root**: `/tmp/agent-skills-evals/rstest-best-practices/fixtures/` (10 fixtures, pre-installed `node_modules` including Playwright chromium)
- **Grading**: one grader subagent per eval; rubric items from `evals/evals.json` scored `pass | partial | fail | na`. Partial = 0.5.

## Benchmark

```plaintext
+-------------------------------+-------------+-----------+--------+
|  Eval                         |  with_skill |  old_skill|  delta |
+-------------------------------+-------------+-----------+--------+
|  pure-util-edge-cases         |  9/9        |  9/9      |   0    |
|  fetch-with-retry             |  6/7        |  4.5/7    | +1.5   |
|  debounce-fake-timers         |  7/7        |  6.5/7    | +0.5   |
|  react-form-jsdom             |  7/7        |  6/7      | +1.0   |
|  react-dropdown-browser-mode  |  8/8        |  7.5/8    | +0.5   |
|  esm-partial-mock-router      |  7/7        |  6/7      | +1.0   |
|  cjs-mock-memfs               |  6/6        |  6/6      |   0    |
|  snapshot-dynamic-fields      |  7/7        |  7/7      |   0    |
|  coverage-thresholds-glob     |  9/9        |  9/9      |   0    |
|  monorepo-projects-multi-env  |  8/8        |  8/8      |   0    |
+-------------------------------+-------------+-----------+--------+
|  TOTAL                        |  74/75      |  69.5/75  | +4.5   |
|  pass-rate                    |  98.7%      |  92.7%    | +6.0pp |
+-------------------------------+-------------+-----------+--------+
```

Raw grading JSONs (one per eval, assertion-level verdicts + notes) lived under `/tmp/agent-skills-evals/.../runs/iteration-1/grading/` — ephemeral and not committed. The per-eval totals above are derived from those files.

## Where the new skill moved the needle

All 4.5-pt delta came from **mock-API-heavy scenarios**:

- **fetch-with-retry (+1.5)** — old_skill agent did `globalThis.fetch = …` direct assignment (no restoration, no spy), and mixed `.rejects.toThrow` with an extra try/catch block. New skill pushed agent to `rs.spyOn(globalThis, 'fetch')` + `mockRestore` in `afterEach`.
- **react-form-jsdom (+1.0)** — old_skill agent hand-rolled a counter-based spy (`callCount++`, `capturedCredentials = …`) instead of `rs.fn().mockResolvedValue(...)`. New skill's mock-boundary chapter made the idiomatic choice obvious.
- **esm-partial-mock-router (+1.0)** — old_skill agent wrote `import { Product }` before the `rs.mock` call and used async `rs.importActual` inside a sync factory (which the agent's own comment flagged as risky). New skill's `rs.hoisted()` pattern + "sync factory uses `rs.requireActual`" rule resolved both.
- **debounce-fake-timers (+0.5)** / **react-dropdown-browser-mode (+0.5)** — partial-credit differences where old_skill's implementation was acceptable but less idiomatic.

Zero-delta evals (pure-util, cjs-memfs, snapshot, coverage, monorepo) are tasks where both skills converged on correct answers — either because the task is straightforward enough that general Rstest knowledge suffices, or because the old skill happened to cover it adequately.

## The single `with_skill` failure → fixed mid-loop

`fetch-with-retry` assertion #3 (“error path asserted via `.rejects`, not try/catch”) failed because the agent used try/catch to assert multiple properties on the rejected error — the skill didn’t document that the same rejected promise can be matched against multiple `.rejects` without re-invoking.

**Fix**: added “Async error assertions — use `.rejects`, never try/catch” to Chapter 1 (Assertion) with:

- BAD example showing the silent-pass hole (no `expect.assertions`, catch never runs if fn resolves)
- GOOD A: `.rejects.toMatchObject({...})` for shape assertion in one call
- GOOD B: capture `const p = fn()` then apply multiple `.rejects` matchers — promise memoizes the rejection

**Iteration-2 rerun** (just that one eval × with_skill): agent now scores **7/7**. The inline comment `// Use .rejects to avoid silent-pass hole from try/catch` in the generated test directly quotes the new rule — confirming the rule is machine-legible.

With this fix, hypothetical iteration-1 totals become **75/75 (100%) vs 69.5/75 (92.7%)** — +5.5pt / +7.3pp over baseline.

## Fixture bugs to fix in iteration-2

Subagents had to debug several `rstest.config.ts` issues that are unrelated to the skill — noise that should be removed before the next bench run:

1. **Vitest-style `test: {}` nesting** in these fixtures:
   - `react-form-jsdom` (testEnvironment + setupFiles nested)
   - `react-dropdown-browser-mode` (browser nested)
   - `esm-partial-mock-router` (testEnvironment nested)

   Rstest’s `RstestConfig` is flat — `testEnvironment`, `setupFiles`, `browser` are root-level fields. Agents all independently found and fixed this, but it wastes attention budget.

2. **`@rstest/coverage-istanbul` version `^0.9.0`** in `monorepo-projects-multi-env/package.json` — that version doesn’t exist. Real published version is `^0.3.x`. Both monorepo agents had to bump it to get `pnpm install` to resolve.

3. **`happy-dom@^15.0.0`** in the same fixture — doesn’t satisfy `@rstest/core@0.9.x` peer dependency, both agents bumped to `^20.x`.

Cleaning these three makes the next iteration cleaner signal-to-noise.

## Observations worth folding into the skill

Surfaced during subagent runs, not yet reflected in the skill:

1. **Rstest 0.9.8 async mock-factory bug** — `rs.mock(spec, async () => {...})` with `importOriginal` / `importActual` sets `module.exports = <Promise>` without awaiting, so named imports come back `undefined`. Workaround: synchronous factory + `rs.requireActual` (or `rs.importActual`'s sync call path). Multiple agents (eval 6 both variants, eval 8 with_skill) independently rediscovered this. Worth a rule in Chapter 3 (Mock boundary).

2. **Per-project coverage `include` with `packages/*/src/**` glob** fails silently in rstest 0.9.8 (wax glob engine). Omitting `include` and relying on the “only tested files” default works. Relevant for Chapter 5 monorepo guidance.

3. **`allowExternal: true`** needed for monorepo coverage when each package has its own root — without it rstest skips source files outside the current project root and coverage reports 0%. Not in current skill.

## Next iteration

Targets for iteration-2:

1. Fix the 3 fixture bugs above so the signal is about skill content, not config debugging.
2. Fold the 3 observations above into the skill (async factory, project-coverage glob, allowExternal).
3. Re-run all 10 evals × 2 variants to verify the benchmark stays ≥ 74/75 after the edits.
4. Consider adding 2-3 new evals probing areas the current skill touches but the bench doesn’t exercise (e.g. `onTestFinished` under concurrent, `resetModules` not unmocking, poll vs waitFor).
