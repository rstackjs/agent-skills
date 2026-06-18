<!-- cspell:words chenjiahan -->

# Rstack Repository Baselines

Snapshot date: 2026-06-18.

This reference is based on public GitHub PR and repository inspection for `chenjiahan` activity under `rstackjs/*`. Re-check current main branches before applying these patterns.

## Primary Baseline: rstackjs/rslog

Use `rslog` as the primary chenjiahan-maintained baseline when modernizing a small Rstack package.

Why it is the best first template:

- It has the strongest chenjiahan maintenance signal among inspected candidates: 50 authored PRs.
- It shows the full migration history from Rslib to pure ESM, Node 20+, Rslint, TypeScript 6, and CI cleanup.
- Its current package shape is simple enough to copy: `type: "module"`, explicit `exports`, `files: ["dist"]`, `build: "rslib"`, `lint: "rslint && prettier --check ."`, `lint:write`, and `test: "rstest"`.
- Current `rslib.config.ts` uses `syntax: "es2023"`, `dts: { tsgo: true }`, and `pluginPublint()`.
- Current `rslint.config.ts` keeps `ts.configs.recommended` only because the package is TypeScript-only.
- Current `package.json#engines.node` is `^20.19.0 || >=22.12.0`.
- Current `AGENTS.md` follows the concise rsbuild-style structure: Stack, Commands, Project structure, and Code style.
- Current `.prettierignore` is intentionally minimal: `dist` and `pnpm-lock.yaml`.
- CI intentionally keeps the current Node 24-only test workflow and does not add a separate build step.

Useful PRs:

- [#23 chore(build): switch to Rslib](https://github.com/rstackjs/rslog/pull/23)
- [#33 chore: migrate to Rstest](https://github.com/rstackjs/rslog/pull/33)
- [#43 chore: remove unused @microsoft/api-extractor dependency](https://github.com/rstackjs/rslog/pull/43)
- [#59 feat!: transform to pure ESM package and requires Node 20+](https://github.com/rstackjs/rslog/pull/59)
- [#74 chore: add Rslint as linter](https://github.com/rstackjs/rslog/pull/74)
- [#76 chore: update TypeScript to v6 and adjust tsconfig settings](https://github.com/rstackjs/rslog/pull/76)
- [#77 chore: update tsconfig](https://github.com/rstackjs/rslog/pull/77)
- [#89 chore: optimize CI pnpm setup](https://github.com/rstackjs/rslog/pull/89)
- [#91 chore: upgrade rslint to 0.6.1](https://github.com/rstackjs/rslog/pull/91)
- [#93 chore(infra): enable tsgo, publint, and prettier checks](https://github.com/rstackjs/rslog/pull/93)

Review-tested decisions from #93:

- Keep `AGENTS.md` short and close to `rsbuild/AGENTS.md`; avoid a long maintenance manual.
- Do not mention formatter tools the target repo does not use; use "existing format conventions" or the repo's actual formatter.
- Keep `js.configs.recommended` out of TypeScript-only packages.
- Do not copy `rslog`'s exact `engines.node` range into target repos unless it matches the package policy.
- `@typescript/native-preview` is a deliberate tsgo toolchain dependency; pin it exactly and validate the generated declarations.
- `pnpm stage publish` is a pnpm 11 builtin, not a missing dependency.
- Knip can be used locally for dependency review, but should not be added as a devDependency unless scripted.

## Secondary Baseline: rstackjs/rsbuild-plugin-publint

Use `rsbuild-plugin-publint` when a plugin package needs a compact pure ESM + Node 20 example.

Current traits:

- `type: "module"`.
- `exports["."].types` plus ESM default entry.
- `engines.node: ">=20.20.2"`.
- `@rslib/core`, `@rslint/core`, TypeScript 6, and Rstest.
- `rslib.config.ts` uses `syntax: "es2023"` and `dts: true`.

Useful PRs:

- [#32 chore: upgrade TypeScript to 6.0.2](https://github.com/rstackjs/rsbuild-plugin-publint/pull/32)
- [#40 chore: migrate linting to Rslint and Prettier](https://github.com/rstackjs/rsbuild-plugin-publint/pull/40)
- [#49 feat: pure ESM package](https://github.com/rstackjs/rsbuild-plugin-publint/pull/49)
- [#50 feat!: replace picocolors with styleText and requires Node 20](https://github.com/rstackjs/rsbuild-plugin-publint/pull/50)
- [#54 chore: optimize CI pnpm setup](https://github.com/rstackjs/rsbuild-plugin-publint/pull/54)
- [#56 chore: upgrade rslint to 0.6.1](https://github.com/rstackjs/rsbuild-plugin-publint/pull/56)

Known gaps:

- No `AGENTS.md` in current main at snapshot time.
- No Rslib `dts.tsgo` in current main at snapshot time.

## Package Validation Reference: rstackjs/rsbuild-plugin-arethetypeswrong

Use `rsbuild-plugin-arethetypeswrong` as an additional package validation and staged publishing reference. Use `rslog`, not this repo, as the current AGENTS.md shape.

Current traits:

- `type: "module"`.
- `engines.node: ">=20.20.2"`.
- Rslib build, Rslint, TypeScript 6, and Rstest.
- `rslint.config.ts` enables both `js.configs.recommended` and `ts.configs.recommended`.
- Has `AGENTS.md` and README.
- Rslib config includes `rsbuild-plugin-publint` and bundled declarations.

Useful PRs:

- [#49 chore: switch to npm staged publishing](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong/pull/49)
- [#51 chore: build before stage publish](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong/pull/51)
- [#55 chore: optimize CI pnpm setup](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong/pull/55)
- [#58 chore: upgrade rslint to 0.6.1](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong/pull/58)

Known gaps:

- Rslib output syntax is `es2022`, not `es2023`, at snapshot time.
- No Rslib `dts.tsgo` in current main at snapshot time.

## High-Activity Reference: rstackjs/prebundle

Use `prebundle` as a high-activity reference when maintaining a CLI/build-tool style package with generated artifacts.

Current traits:

- 28 chenjiahan-authored PRs at snapshot time.
- Rslib build, Rslint, TypeScript 6, Rstest, README, and `AGENTS.md`.
- `rslint.config.ts` enables both `js.configs.recommended` and `ts.configs.recommended`.

Useful PRs:

- [#10 refactor: use Rslib to bundle](https://github.com/rstackjs/prebundle/pull/10)
- [#37 chore: enable npm trusted publishing](https://github.com/rstackjs/prebundle/pull/37)
- [#62 chore: upgrade TypeScript to ^6.0.2](https://github.com/rstackjs/prebundle/pull/62)
- [#72 chore: add Rslint linting](https://github.com/rstackjs/prebundle/pull/72)
- [#81 chore: optimize CI pnpm setup](https://github.com/rstackjs/prebundle/pull/81)
- [#83 chore: upgrade rslint to 0.6.1](https://github.com/rstackjs/prebundle/pull/83)

Known gaps:

- No `engines.node` in current main at snapshot time.
- Rslib syntax is `es2021`, so do not copy it for Node 20+/ES2023 packages without checking why.

## tsgo Reference: rstackjs/rsbuild-plugin-virtual-module

Use `rsbuild-plugin-virtual-module` only as a concrete Rslib `tsgo` configuration reference.

Current traits:

- `rslib.config.ts` uses `dts: { tsgo: true }`.
- `@typescript/native-preview` is installed.
- Dual package output is still present.

Relevant PR:

- [#28 chore: update infrastructure for tsgo](https://github.com/rstackjs/rsbuild-plugin-virtual-module/pull/28)

Important caveat:

- The tsgo PR was authored by `SoonIter`, not `chenjiahan`. Treat it as implementation evidence for Rslib tsgo, not as part of the chenjiahan-maintained baseline.

## Search Notes

Searches used:

- `type:pr org:rstackjs author:chenjiahan rslib`
- `type:pr org:rstackjs author:chenjiahan rslint`
- `type:pr org:rstackjs author:chenjiahan "typescript 6"`
- `type:pr org:rstackjs author:chenjiahan "Node 20"`
- `type:pr org:rstackjs author:chenjiahan AGENTS`
- `type:pr org:rstackjs author:chenjiahan README`
- `type:pr org:rstackjs author:chenjiahan "optimize CI"`
- `type:pr org:rstackjs author:chenjiahan knip`

Findings:

- No chenjiahan-authored `knip` PRs were found in the sampled search results.
- `rslog` now provides the chenjiahan-reviewed tsgo + publint baseline for small packages; `rsbuild-plugin-virtual-module` remains useful only as an additional implementation reference.
- Some heavily maintained packages intentionally remain dual package or use lower output syntax; copy only after checking consumer compatibility.
