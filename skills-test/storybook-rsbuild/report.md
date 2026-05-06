# storybook-rsbuild — evaluation report

**Date:** 2026-05-06
**Model:** Sonnet 4.6 (`claude-sonnet-4-6`) — runner agents and grader subagents
**Skill version:** `skills/storybook-rsbuild/SKILL.md` at `chore/rstest-best-practices-eval` HEAD

## Setup

- **Fixtures** (10, under `/tmp/agent-skills-evals/storybook-rsbuild/fixtures`, ~1.6 GB total with `node_modules` pre-installed):
  - `react-vite-migration` — Storybook 8.6 + `@storybook/react-vite` + `viteFinal` adding `@app`/`@components` aliases via `path.resolve(__dirname, ...)`
  - `react-webpack5-migration-svgr` — Storybook 8.6 + `@storybook/react-webpack5` + `webpackFinal` registering `@svgr/webpack` rule + `@storybook/addon-styling-webpack`
  - `vue3-vite-migration` — Storybook 9.0 + `@storybook/vue3-vite` + `HelloWorld.vue` SFC (version-table test: must pick `^2`, not `^1`/`^3`)
  - `react-fresh-setup-vite-app` — Vite + React app with no Storybook
  - `vanilla-html-fresh-setup` — Vite + plain TS app, `createBadge()` returns HTMLElement (must pick `storybook-html-rsbuild`)
  - `web-components-lit-fresh-setup` — Vite + Lit 3 (must pick `storybook-web-components-rsbuild`)
  - `rslib-react-integration` — Rslib React component library; agent must use `storybook-addon-rslib` overlay, not duplicate the build pipeline
  - `modernjs-app-integration` — Modern.js app with `appTools({ bundler: 'rspack' })`; agent must use `storybook-addon-modernjs`
  - `pure-rspack-react-integration` — Pure Rspack project (no `@rsbuild/core`); agent must create a thin `rsbuild.config.ts` merging existing rules via `tools.rspack`
  - `monorepo-partial-react-webpack5-migration` — pnpm workspace; migrate ONLY `packages/ui-kit`, leave root + `packages/api` (Express) + `packages/web` (Next.js 14) byte-for-byte untouched
- **Grader**: 118 assertions across the 10 fixtures — mix of structural checks (configs, devDeps, scripts) + filesystem byte-for-byte diffs against the original fixture + post-task build-output existence checks (`storybook-static/`, `dist/`).
- **Design**: 10 parallel `with_skill` subagents, 1 sample per cell. Each agent worked on its own APFS-cloned fixture copy under `runs/run-6/with_skill/<eval_name>/`. 10 parallel grader subagents post-hoc.

## Results

```plaintext
+---------------------------------------------------+--------------+----------+----------+
|  Eval                                             |  Pass/Total  |  Tokens  |  Time    |
+---------------------------------------------------+--------------+----------+----------+
|  1  react-vite-migration                          |  11/12       |  28.9k   |   174s   |
|  2  react-webpack5-migration-svgr                 |  10/10       |  34.3k   |   247s   |
|  3  vue3-vite-migration                           |  10/10       |  38.3k   |   444s   |
|  4  react-fresh-setup-vite-app                    |  12/12       |  22.1k   |   106s   |
|  5  vanilla-html-fresh-setup                      |  13/13       |  21.4k   |   131s   |
|  6  web-components-lit-fresh-setup                |  13/13       |  25.7k   |   135s   |
|  7  rslib-react-integration                       |  12/12       |  24.4k   |   135s   |
|  8  modernjs-app-integration                      |   8/9        |  42.4k   |   266s   |
|  9  pure-rspack-react-integration                 |  11/12       |  27.4k   |   222s   |
|  10 monorepo-partial-react-webpack5-migration     |  14/15       |  29.7k   |   211s   |
+---------------------------------------------------+--------------+----------+----------+
|  Total                                            |  114/118     |  29.5k   |   207s   |
|                                                   |  96.6%       |  (mean)  |  (mean)  |
+---------------------------------------------------+--------------+----------+----------+
```

Four failing assertions across three buckets:

- **Eval 1, Eval 10 — alias form regression to `path.resolve(__dirname, ...)`** in the `viteFinal` / `webpackFinal` → `rsbuildFinal` port. The migration guide's "Use relative paths in `resolve.alias`" tip in upstream docs does not always override the agent's "preserve original code verbatim" prior. This is the cost of keeping the skill as a pure router (it doesn't duplicate the SSOT tip).
- **Eval 8 — Modern.js `dist/` clobber** caused by a real upstream bug in `storybook-addon-modernjs`; fixed in this branch, awaiting release. See [Eval 8 root cause](#eval-8--modernjs-dist-clobber-upstream-bug) below.
- **Eval 9 — `storybook-react-rsbuild ^2` instead of `^3`** under the pure Rspack integration. The agent observed peer-version uncertainty between `@rsbuild/core@^2` (required by `storybook-rsbuild@^3`) and the host app's `@rspack/core@^1`, and conservatively downgraded. N=1 noise on a peer-resolution decision; the same eval has installed `^3` cleanly in adjacent runs of this skill.

## Skill / rubric changes captured in this report

- **Skill (`SKILL.md`, Principles + Migration Step 7)** — Phase B cleanup is framed as imperative obligation, not passive permission. Migration is one task with two ordered phases: install + reconfigure, then _in the same task_ delete the old framework package, the old builder package, and the legacy `webpackFinal` / `viteFinal` block.
- **Skill (`SKILL.md`, Principle 2)** — version pins must come from each framework guide's Requirements table; the skill no longer mentions sandboxes / examples as a referent at all (positive instruction only).
- **Skill (`SKILL.md`)** — the trailing `## Examples` link to upstream sandboxes was removed. The skill depends on documentation (SSOT), not on examples.
- **Rubric (`evals/evals.json`, eval 4)** — removed the `@rsbuild/plugin-react` direct-devDep assertion. The framework guide install command does not include it, and `@rsbuild/plugin-react` is a transitive dep of `storybook-react-rsbuild`. The assertion was over-strict for a Vite-host fresh setup; only the pure Rspack integration (eval 9) requires it explicitly because that path constructs a custom `rsbuild.config.ts`.

## Did the skill changes work?

**Phase B cleanup — yes, consistently.** Migration evals (1, 2, 3, 10) all complete cleanup in the same task: old framework package, old builder package, and legacy hooks are removed after Verification passes; `pnpm install` re-runs to refresh the lockfile. Agent reports include explicit "Phase B" sections describing the cleanup work.

**Alias form — accepted regression.** Two evals (1, 10) ported the `viteFinal` / `webpackFinal` aliases verbatim with `path.resolve(__dirname, ...)`. The migration guide carries a `:::tip Use relative paths in resolve.alias` block, but the SSOT tip on its own is not enough to overcome the agent's "preserve original code" prior. The skill could mirror the tip with an explicit rewrite directive — that delivered 100% canonical form in an earlier run — but that mirroring violates the skill's role as a pure router. The skill stays clean; the cost is the −2 points seen here.

## Eval 8 — Modern.js dist/ clobber: upstream bug

### Reproduction

Reset eval 8 fixture, ran `pnpm build` then `pnpm build-storybook` in sequence:

```
$ pnpm build
  → dist/ contains: html/, modern.config.json, route.json, static/  ✅ correct

$ pnpm build-storybook
  → "Output directory: storybook-static" (banner)
  → dist/ contents: iframe.html, mocker-runtime-injected.js, static/js/*.iframe.bundle.js
  → storybook-static/ contents: manager assets only (no iframe.html)
```

Storybook reports it built to `storybook-static/`, but the **preview build** physically writes to `dist/`, clobbering the Modern.js host build. Storybook's manager (in `storybook-static/`) then can't find its iframe at the relative path it expects — Storybook itself is broken in addition to Modern.js. The bug reproduces deterministically with the canonical setup the integration guide currently shows.

### Root cause

`storybook-addon-modernjs` reuses the Modern.js Rsbuild config wholesale, including `output.distPath.root = 'dist'` (which `appTools` sets implicitly). When Storybook's preview build inherits this Rsbuild config via the addon, the preview output goes to `dist/` instead of `storybook-static/`. The manager build uses Storybook's defaults independently, so the two halves get separated.

This is **not a skill issue** and **not an agent error**.

### Fix: upstream, not SSOT

Initial instinct was to amend `integrations/modernjs.mdx` with a `rsbuildFinal` workaround block. That's wrong: it bakes a workaround for an upstream bug into the documented "right way to do it", creates copy-paste maintenance burden for every user, and obscures the real defect. The fix belongs in the `storybook-addon-modernjs` package itself — users following the canonical setup should get correct behavior without ceremony.

**Bug location:** `packages/addon-modernjs/src/preset.ts`, before the final `mergeRsbuildConfig`.

**Fix applied:** strip output fields that Storybook's preview iframe owns (`distPath`, `assetPrefix`, `cleanDistPath`, `filename`) from the Modern.js-derived Rsbuild config before merging. `builder-rsbuild` hardcodes these as defensive defaults in `iframe-rsbuild.config.ts`, but that merge runs _before_ the `rsbuildFinal` hook, so any value Modern.js produced silently overrides them.

**Verified end-to-end** by rebuilding the addon, swapping the patched `dist/preset.js` into the eval fixture's `node_modules/.pnpm/.../storybook-addon-modernjs/dist/`, removing all manual workarounds from `.storybook/main.ts`, and running `pnpm build && pnpm build-storybook` in sequence:

```
dist/             ← Modern.js: html/, modern.config.json, route.json, static/  ✅
storybook-static/ ← Storybook: iframe.html, project.json, static/              ✅
```

Both builds coexist correctly with the canonical (workaround-free) `.storybook/main.ts`.

### Status

The fix lands in `packages/addon-modernjs/src/preset.ts` plus a regression test at `e2e/tests/modernjs-react.spec.ts` (asserts a sentinel file in `dist/` survives a Storybook build). Until the next `storybook-addon-modernjs` release ships to npm, an unmodified fixture would still see the bug — eval 8 stays at 8/9 in this report. After the release lands, eval 8 should hit 9/9 and the headline ceiling rises by one point. (See PR description for release coordination.)

## Architecture validation

The skill is structured as **action router + behavioral checklist**. All factual mappings — version table, package names, install commands, config conversion patterns including the relative-alias tip — live upstream at `storybook.rsbuild.rs`. The skill does not duplicate the docs; it tells agents _which page to fetch_ and _what behavioral SOPs to follow_ (Phase B cleanup, scope discipline, addon preservation).

The 96.6% pass rate is the steady state of that partitioning. Of the 4 failing assertions:

- **1 fail** is an unrelated upstream bug (eval 8) — fixed in this branch.
- **2 fails** are alias-form regressions (evals 1, 10) — sticky training prior the SSOT tip alone doesn't override. Mirroring the tip in the skill closes them; doing so duplicates SSOT and is not the right shape.
- **1 fail** is N=1 sample noise on peer-version conservatism (eval 9).

None are in the skill's domain to fix without crossing the duplication line.

## Artifacts

- Run output trees: `/tmp/agent-skills-evals/storybook-rsbuild/runs/run-6/with_skill/<eval_name>/`
- Aggregate: `/tmp/agent-skills-evals/storybook-rsbuild/grades/aggregate-run-6.json`
- Skill: `skills/storybook-rsbuild/SKILL.md`
- Rubric: `skills-test/storybook-rsbuild/evals/evals.json`
- Upstream fix: `packages/addon-modernjs/src/preset.ts` + `e2e/tests/modernjs-react.spec.ts` (in storybook-rsbuild repo, this branch)
