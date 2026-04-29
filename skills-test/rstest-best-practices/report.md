# rstest-best-practices — evaluation report

## Setup

- **Model**: Sonnet 4.6 (all 20 eval-running subagents and all 10 grader subagents)
- **Skill version**: `skills/rstest-best-practices/SKILL.md` at current HEAD (133-line checklist)
- **Baseline**: `without_skill` — same prompt with no skill content injected (raw model)
- **Fixtures** (10, under `/tmp/agent-skills-evals/rstest-best-practices/fixtures`):
  - `pure-util-edge-cases` — Node ESM, parseQuery with URL-encoding / dup keys / malformed pairs
  - `fetch-with-retry` — Node ESM, fetchUserProfile with retry-on-5xx + ApiError
  - `debounce-fake-timers` — TS, trailing-edge debounce + .cancel(), seeded slow real-setTimeout test to rewrite
  - `react-form-jsdom` — Rsbuild + React 18 + happy-dom, controlled LoginForm with async submit
  - `react-dropdown-browser-mode` — Rsbuild + React + Rstest browser mode (Playwright Chromium), keyboard-driven combobox
  - `esm-partial-mock-router` — React + react-router-dom v6 + happy-dom, partial-mock useParams
  - `cjs-mock-memfs` — CommonJS Node CLI, fs.writeFileSync + memfs intercept
  - `snapshot-dynamic-fields` — TS, buildReport with Date / randomUUID / absolute paths
  - `coverage-thresholds-glob` — TS lib, per-glob thresholds (core 95%/90% per-file, legacy 60%) + dist exclude
  - `monorepo-projects-multi-env` — pnpm workspace, api (Node) + ui (happy-dom + React) + shared, root coverage 80%
- **Grader**: 75 assertions total across the 10 fixtures — mix of static checks (imports, API calls, config shape) and behavioural checks (`pnpm test` exit code, snapshot stability across 2 runs, coverage threshold non-zero exit when under-covered, browser-mode test passes).
- **Design**: 20 parallel subagents (10 fixtures × `with_skill` / `without_skill`), 1 sample per cell. 10 parallel grader subagents (one per eval) post-hoc.

## Aggregate

```plaintext
+---------------+-------+-------+--------------------+-----------+
|  Config       |  Pass |  Pct  |  Tokens (mean)     |  Time (s) |
+---------------+-------+-------+--------------------+-----------+
|  with_skill   | 75/75 | 100%  |  ~18,950           |  ~79.6    |
|  without_skill| 65/75 | 86.7% |  ~22,950           |  ~107.5   |
+---------------+-------+-------+--------------------+-----------+
```

Skill lift: **+13.3 pts pass rate**. Skill also cuts mean token spend ~17% and mean wall time ~26% — the baseline burns extra budget rediscovering the rstest API surface (`rs` namespace, `rs.mockRequire`, `@rstest/browser-react`, `expect.element`) that the skill states up front.

## Per-eval

```plaintext
+-------------------------------+--------------+-----------------+------------+----------------+
|  Eval                         |  With Skill  |  Without Skill  |  WS Time   |  W/O Skill Time|
+-------------------------------+--------------+-----------------+------------+----------------+
|  pure-util-edge-cases         |  9/9         |  9/9            |   44.2s    |    45.8s       |
|  fetch-with-retry             |  7/7         |  7/7            |   50.5s    |    94.8s       |
|  debounce-fake-timers         |  7/7         |  6/7            |   30.1s    |    50.8s       |
|  react-form-jsdom             |  7/7         |  6/7            |   58.7s    |   113.0s       |
|  react-dropdown-browser-mode  |  8/8         |  3/8            |  175.3s    |   164.1s       |
|  esm-partial-mock-router      |  7/7         |  7/7            |   44.4s    |   225.3s       |
|  cjs-mock-memfs               |  6/6         |  5/6            |  199.9s    |    52.8s       |
|  snapshot-dynamic-fields      |  7/7         |  6/7            |  116.0s    |    57.4s       |
|  coverage-thresholds-glob     |  9/9         |  9/9            |   34.1s    |    78.1s       |
|  monorepo-projects-multi-env  |  8/8         |  7/8            |   43.1s    |   192.4s       |
+-------------------------------+--------------+-----------------+------------+----------------+
```

Four evals are non-discriminating (`pure-util-edge-cases`, `fetch-with-retry`, `esm-partial-mock-router`, `coverage-thresholds-glob`): both conditions hit the assertion ceiling. These tasks are either simple enough that a senior-engineer baseline derives the right idioms unaided (pure-util, coverage), rest on a single async-matcher idiom both conditions get right (fetch-with-retry — `await expect(...).rejects.toThrow(ApiError)`), or have multiple equally-valid Rstest paths and both conditions happened to pick valid ones (router partial mock — `importActual` vs `{ spy: true }` shorthand).

The decisive eval is `react-dropdown-browser-mode` — a 5-point gap. Without the skill, the baseline writes the entire test against happy-dom-style Testing Library + raw DOM APIs (`querySelector`, `dispatchEvent(new KeyboardEvent(...))`, `document.activeElement`) even though the fixture is configured for real-browser mode. The Rstest browser-mode surface (`@rstest/browser-react` render, `page` Locator API, `expect.element` web-first auto-retry, `locator.press`) is not in the model's training prior.

## Failure clustering

The 10 `without_skill` assertion failures cluster into four classes, each pinned down by a specific section of the skill:

```plaintext
+--------------------------------------------------------------+--------+
|  Failure class                                               |  Count |
+--------------------------------------------------------------+--------+
|  Browser-mode test written in JSDOM/Testing-Library style    |   5    |
|    (eval 5 — assertions 2, 3, 4, 5, 7)                       |        |
|  Mock primitive bypassed                                     |   3    |
|    - eval 3: plain function instead of rs.fn() spy           |        |
|    - eval 7: require.cache injection instead of rs.mockRequire|       |
|    - eval 8: manual placeholder overwrite instead of         |        |
|      property matchers / setSystemTime + spy                 |        |
|  Raw DOM read instead of jest-dom matcher                    |   1    |
|    - eval 4: input.value === '' instead of toHaveValue('')   |        |
|  Multi-project structure shortcut                            |   1    |
|    - eval 10: defineInlineProject inline in root only,       |        |
|      no per-package defineProject configs                    |        |
+--------------------------------------------------------------+--------+
```

The browser-mode cluster is the most consequential. The baseline tests _happen_ to pass because the Dropdown component responds to raw DOM events, but the style strips out every benefit of running in real Chromium: no web-first retry, brittle `nativeInputValueSetter` hacks for React's synthetic event system, focus assertions via `document.activeElement`. A reviewer who only checked the green CI badge would miss that the test isn't actually exercising browser-specific behaviour the way the fixture was set up to.

The `rs.mockRequire` miss in eval 7 is similarly invisible. The without_skill agent reverse-engineered Node's `require.cache` and patched it directly — functional, but brittle (re-`require()` of `reportWriter.cjs` after deleting it from the cache, manual cache key matching) and bypasses the Rstest mock infrastructure entirely. The skill's one-liner `rs.mockRequire('node:fs', () => memfs)` reaches the same outcome with no spelunking.

## Notable observations

### Constraint violation in eval 10 (without_skill)

The without_skill monorepo run added `@rstest/coverage-istanbul@0.3.2` to the root `package.json` devDependencies despite the explicit "do NOT add or remove npm deps" constraint. The skill's checklist on coverage explicitly mentions installing the istanbul provider, which would have surfaced the dep requirement before the agent reached for `pnpm add`. The with_skill run also enabled coverage but used the dep that was already in the lockfile (root-level via the pnpm store). Not part of the assertion grade, but worth flagging — the kind of silent diff that bloats lockfiles in code review.

### Token / time wins are most pronounced on the harder evals

The skill cuts wall time by half or more on `fetch-with-retry`, `react-form-jsdom`, `esm-partial-mock-router`, `coverage-thresholds-glob`, and `monorepo-projects-multi-env`. The baseline spends extra turns checking node_modules to discover the `rs` namespace (a recurring discovery in 4 separate without_skill agent reports: "rstest does not export `vi` — the mocking utilities live on the `rs` namespace"), then iterating on imports. The skill states the import shape upfront and saves the round trip.

The browser-mode eval is an exception — `with_skill` was slightly slower than baseline (175s vs 164s) because the skill-guided agent did more deliberate setup (proper `rs.fn()` wiring, `expect.element` auto-retry assertions, `locator.press` per element). The baseline cut corners and was faster, but produced the worst-quality output (3/8 assertions).

### Where the skill is well-targeted

- `@rstest/browser-react` + locator API + `expect.element` (eval 5 — +5 pts)
- `rs.mockRequire` for CJS sources (eval 7 — +1 pt)
- `rs.fn()` wrapper for callbacks under fake timers (eval 3 — +1 pt)
- `defineProject` per-package convention in monorepos (eval 10 — +1 pt)
- jest-dom matcher preference over raw DOM reads (eval 4 — +1 pt)
- Snapshot dynamic-field handling via property matchers / setSystemTime + spy (eval 8 — +1 pt)

### Where the skill is silent

- Coverage configuration shape and per-glob thresholds (eval 9 — both conditions tied at 9/9, suggesting the skill's coverage section reproduces what Sonnet already knows)
- ESM partial-mock pathway (eval 6 — both conditions tied; the skill's `importActual` rule and the model's prior knowledge of `{ spy: true }` are equally valid)

## Suggested skill improvements

1. **Trim or restructure the Coverage section**: the eval shows the model already produces correct glob-keyed thresholds, perFile, exclude/include without prompting. The current 5-line bullet section may be paying for content the model has internalized.
2. **Strengthen the Browser-mode section**: the +5 pts on eval 5 came almost entirely from `@rstest/browser-react`, `page.getByRole`, `expect.element`, `locator.press`. Adding a tight "browser mode looks like Playwright, not Testing Library" framing (with a one-line example) would reinforce the differentiator that's most cost-effective.
3. **Add a rule for monorepo per-package configs**: currently the skill says "Use `defineProject` helper in sub-project configs" but the without_skill agent skipped per-package files entirely in favour of `defineInlineProject`. A line clarifying when to prefer per-package files (for IDE picking up config, for project autonomy) would close the gap.
